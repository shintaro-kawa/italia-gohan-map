#!/usr/bin/env node
/**
 * data/_pending-candidates.json (サブエージェントの結果配列) を読み、
 * schema 検証 + 重複排除して data/restaurants.json に追記する。
 *
 * Usage:
 *   node scripts/merge-candidates.mjs            # apply, log to console
 *   node scripts/merge-candidates.mjs --dry-run  # validate only
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA = resolve(ROOT, 'data/restaurants.json');
const PENDING = resolve(ROOT, 'data/_pending-candidates.json');

const DRY = process.argv.includes('--dry-run');

const VALID_GENRES = new Set([
  'pizzeria', 'trattoria', 'osteria', 'ristorante', 'enoteca',
  'bar', 'gelateria', 'paninoteca', 'pasticceria', 'other',
]);
const VALID_CITIES = new Set(['Rome', 'Florence', 'Palermo', 'Taormina', 'Sicily']);
const VALID_SOURCES = new Set([
  'gambero-rosso', '50-top-pizza', 'slow-food', 'identita-golose',
  'food-blogger', 'reddit-local', 'friend', 'guidebook', 'google-maps', 'other',
]);
const VALID_TRUSTS = new Set(['high', 'medium', 'low']);
const VALID_VERDICTS = new Set(['recommended', 'neutral', 'caution', 'skip']);
const VALID_SEVERITY = new Set(['low', 'medium', 'high']);
const VALID_CONCERNS = new Set([
  'tourist-oriented', 'overpriced', 'mediocre-food', 'quality-declined',
  'not-authentic', 'service-issues', 'hidden-fees',
  'language-barrier-eng-only', 'long-wait', 'crowded-noisy',
]);
const VALID_HIGHLIGHTS = new Set([
  'locals-frequent', 'family-run', 'generations-old', 'signature-dish',
  'hidden-gem', 'award-winning', 'seasonal-menu', 'fresh-ingredients',
  'innovative', 'value-for-money',
]);

function normalize(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}

function generateId(name, city) {
  const hash = createHash('sha1').update(`${name}|${city}`).digest('hex').slice(0, 8);
  return `${city.toLowerCase()}-${hash}`;
}

function sanitizeConcerns(raw) {
  if (!Array.isArray(raw)) return undefined;
  const out = [];
  for (const c of raw) {
    if (!c || typeof c !== 'object') continue;
    if (!VALID_CONCERNS.has(c.type)) continue;
    if (!VALID_SEVERITY.has(c.severity)) continue;
    out.push({
      type: c.type,
      severity: c.severity,
      note: typeof c.note === 'string' ? c.note : undefined,
    });
  }
  return out.length ? out : undefined;
}

function sanitizeHighlights(raw) {
  if (!Array.isArray(raw)) return undefined;
  const out = [];
  for (const h of raw) {
    if (!h || typeof h !== 'object') continue;
    if (!VALID_HIGHLIGHTS.has(h.type)) continue;
    out.push({
      type: h.type,
      note: typeof h.note === 'string' ? h.note : undefined,
    });
  }
  return out.length ? out : undefined;
}

function sanitize(item) {
  if (!item || typeof item !== 'object') return { ok: false, reason: 'not-object' };
  if (typeof item.name !== 'string' || !item.name.trim()) return { ok: false, reason: 'no-name' };
  if (!VALID_CITIES.has(item.city)) return { ok: false, reason: `bad-city:${item.city}` };
  if (!VALID_GENRES.has(item.genre)) return { ok: false, reason: `bad-genre:${item.genre}` };
  const lat = Number(item.lat);
  const lng = Number(item.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { ok: false, reason: 'bad-coords' };

  const today = new Date().toISOString().slice(0, 10);
  return {
    ok: true,
    value: {
      id: generateId(item.name, item.city),
      name: item.name.trim(),
      city: item.city,
      area: typeof item.area === 'string' ? item.area : undefined,
      genre: item.genre,
      priceRange: typeof item.priceRange === 'string' ? item.priceRange : undefined,
      lat,
      lng,
      address: typeof item.address === 'string' ? item.address : undefined,
      visited: false,
      url: typeof item.url === 'string' ? item.url : undefined,
      tags: Array.isArray(item.tags) ? item.tags.filter((t) => typeof t === 'string') : undefined,
      source: VALID_SOURCES.has(item.source) ? item.source : 'other',
      sourceTrust: VALID_TRUSTS.has(item.sourceTrust) ? item.sourceTrust : 'medium',
      verdict: VALID_VERDICTS.has(item.verdict) ? item.verdict : undefined,
      concerns: sanitizeConcerns(item.concerns),
      highlights: sanitizeHighlights(item.highlights),
      lastAnalyzed: typeof item.lastAnalyzed === 'string' ? item.lastAnalyzed : today,
    },
  };
}

function isDup(candidate, existing) {
  const cn = normalize(candidate.name);
  for (const e of existing) {
    if (e.city !== candidate.city) continue;
    if (normalize(e.name) === cn) return { yes: true, against: e.id };
    if (e.address && candidate.address && normalize(e.address) === normalize(candidate.address)) {
      return { yes: true, against: e.id };
    }
  }
  return { yes: false };
}

async function main() {
  const data = JSON.parse(await readFile(DATA, 'utf-8'));
  const pendingRaw = JSON.parse(await readFile(PENDING, 'utf-8'));
  const pending = Array.isArray(pendingRaw) ? pendingRaw : (pendingRaw.candidates ?? []);

  console.log(`Existing: ${data.length}`);
  console.log(`Pending: ${pending.length}`);
  console.log(`Mode: ${DRY ? 'DRY-RUN' : 'APPLY'}`);
  console.log('---');

  const adopted = [];
  const rejected = [];

  for (const raw of pending) {
    const result = sanitize(raw);
    if (!result.ok) {
      rejected.push({ name: raw?.name ?? '(?)', reason: result.reason });
      continue;
    }
    const s = result.value;
    const dup = isDup(s, data);
    if (dup.yes) {
      // Also check intra-pending dup
      rejected.push({ name: s.name, reason: `duplicate-of:${dup.against}` });
      continue;
    }
    const intraDup = isDup(s, adopted);
    if (intraDup.yes) {
      rejected.push({ name: s.name, reason: `intra-pending-dup:${intraDup.against}` });
      continue;
    }
    adopted.push(s);
  }

  console.log(`Adopted: ${adopted.length}`);
  for (const a of adopted) {
    console.log(`  + ${a.id} ${a.name} (${a.city}/${a.genre}/${a.area ?? '-'})`);
  }
  console.log(`\nRejected: ${rejected.length}`);
  for (const r of rejected) {
    console.log(`  - [${r.reason}] ${r.name}`);
  }

  if (!DRY && adopted.length > 0) {
    const next = data.concat(adopted);
    await writeFile(DATA, JSON.stringify(next, null, 2) + '\n', 'utf-8');
    console.log(`\nWritten ${adopted.length} entries. New total: ${next.length}`);
  } else if (DRY) {
    console.log('\n(dry-run, no write)');
  }
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
