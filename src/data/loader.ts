import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type {
  City,
  Concern,
  ConcernType,
  Genre,
  Highlight,
  HighlightType,
  PriceRange,
  Restaurant,
  Severity,
  Source,
  SourceTrust,
  Verdict,
} from '@/types/restaurant';
import { CONCERN_TYPES, HIGHLIGHT_TYPES } from '@/types/restaurant';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FALLBACK_PATH = resolve(__dirname, '../../data/restaurants.json');

const VALID_GENRES: ReadonlySet<Genre> = new Set<Genre>([
  'pizzeria',
  'trattoria',
  'osteria',
  'ristorante',
  'enoteca',
  'bar',
  'gelateria',
  'paninoteca',
  'pasticceria',
  'other',
]);

const VALID_CITIES: ReadonlySet<City> = new Set<City>(['Rome', 'Florence', 'Sicily']);

const VALID_PRICE: ReadonlySet<PriceRange> = new Set<PriceRange>(['€', '€€', '€€€', '€€€€']);

const VALID_SOURCES: ReadonlySet<Source> = new Set<Source>([
  'gambero-rosso',
  '50-top-pizza',
  'slow-food',
  'identita-golose',
  'food-blogger',
  'reddit-local',
  'friend',
  'guidebook',
  'google-maps',
  'other',
]);

const VALID_SOURCE_TRUST: ReadonlySet<SourceTrust> = new Set<SourceTrust>(['high', 'medium', 'low']);

const VALID_VERDICT: ReadonlySet<Verdict> = new Set<Verdict>(['recommended', 'neutral', 'caution', 'skip']);

const VALID_SEVERITY: ReadonlySet<Severity> = new Set<Severity>(['low', 'medium', 'high']);

function generateId(name: string, city: string): string {
  const hash = createHash('sha1').update(`${name}|${city}`).digest('hex').slice(0, 8);
  return `${city.toLowerCase()}-${hash}`;
}

function parseCsv(csv: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];

    if (inQuotes) {
      if (ch === '"') {
        if (csv[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cur.push(field);
      field = '';
    } else if (ch === '\n') {
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = '';
    } else if (ch === '\r') {
      // skip
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }

  if (rows.length === 0) return [];
  const headers = rows[0]!;
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = (row[idx] ?? '').trim();
    });
    return obj;
  });
}

function parseBoolean(value: string): boolean {
  const v = value.toLowerCase();
  return v === 'true' || v === 'yes' || v === '1' || v === 'はい';
}

function parseTags(value: string): string[] | undefined {
  if (!value) return undefined;
  const tags = value
    .split(/[,;|]/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
  return tags.length > 0 ? tags : undefined;
}

function safeJsonParse<T>(value: string): T | undefined {
  if (!value || !value.trim()) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function sanitizeConcerns(raw: unknown): Concern[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: Concern[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    const type = obj.type;
    const severity = obj.severity;
    if (typeof type !== 'string' || typeof severity !== 'string') continue;
    if (!CONCERN_TYPES.has(type as ConcernType)) {
      console.warn(`[loader] Unknown concern type "${type}", dropping`);
      continue;
    }
    if (!VALID_SEVERITY.has(severity as Severity)) {
      console.warn(`[loader] Invalid severity "${severity}", dropping`);
      continue;
    }
    out.push({
      type: type as ConcernType,
      severity: severity as Severity,
      note: typeof obj.note === 'string' && obj.note.trim() ? obj.note.trim() : undefined,
    });
  }
  return out.length > 0 ? out : undefined;
}

function sanitizeHighlights(raw: unknown): Highlight[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: Highlight[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    const type = obj.type;
    if (typeof type !== 'string') continue;
    if (!HIGHLIGHT_TYPES.has(type as HighlightType)) {
      console.warn(`[loader] Unknown highlight type "${type}", dropping`);
      continue;
    }
    out.push({
      type: type as HighlightType,
      note: typeof obj.note === 'string' && obj.note.trim() ? obj.note.trim() : undefined,
    });
  }
  return out.length > 0 ? out : undefined;
}

function transformRow(row: Record<string, string>): Restaurant | null {
  const name = row.name?.trim();
  const cityRaw = row.city?.trim();
  const genreRaw = row.genre?.trim().toLowerCase();
  const latStr = row.lat?.trim();
  const lngStr = row.lng?.trim();

  if (!name || !cityRaw || !genreRaw || !latStr || !lngStr) return null;
  if (!VALID_CITIES.has(cityRaw as City)) return null;
  if (!VALID_GENRES.has(genreRaw as Genre)) return null;

  const lat = Number(latStr);
  const lng = Number(lngStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const city = cityRaw as City;
  const genre = genreRaw as Genre;
  const priceRaw = row.priceRange?.trim();
  const priceRange = priceRaw && VALID_PRICE.has(priceRaw as PriceRange) ? (priceRaw as PriceRange) : undefined;

  const ratingStr = row.rating?.trim();
  const rating = ratingStr ? Number(ratingStr) : undefined;

  const sourceRaw = row.source?.trim().toLowerCase();
  const source = sourceRaw && VALID_SOURCES.has(sourceRaw as Source) ? (sourceRaw as Source) : undefined;

  const sourceTrustRaw = row.sourceTrust?.trim().toLowerCase();
  const sourceTrust =
    sourceTrustRaw && VALID_SOURCE_TRUST.has(sourceTrustRaw as SourceTrust) ? (sourceTrustRaw as SourceTrust) : undefined;

  const verdictRaw = row.verdict?.trim().toLowerCase();
  const verdict = verdictRaw && VALID_VERDICT.has(verdictRaw as Verdict) ? (verdictRaw as Verdict) : undefined;

  const concerns = sanitizeConcerns(safeJsonParse(row.concerns ?? ''));
  const highlights = sanitizeHighlights(safeJsonParse(row.highlights ?? ''));

  return {
    id: generateId(name, city),
    name,
    city,
    area: row.area?.trim() || undefined,
    genre,
    priceRange,
    lat,
    lng,
    address: row.address?.trim() || undefined,
    visited: parseBoolean(row.visited ?? ''),
    visitDate: row.visitDate?.trim() || undefined,
    rating: rating && Number.isFinite(rating) ? rating : undefined,
    comment: row.comment?.trim() || undefined,
    url: row.url?.trim() || undefined,
    tags: parseTags(row.tags ?? ''),
    imageUrl: row.imageUrl?.trim() || undefined,
    source,
    sourceTrust,
    verdict,
    concerns,
    highlights,
    lastAnalyzed: row.lastAnalyzed?.trim() || undefined,
  };
}

async function fetchFromSheets(sheetsId: string, sheetName: string): Promise<Restaurant[]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetsId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sheets fetch failed: HTTP ${res.status}`);
  const csv = await res.text();
  const rows = parseCsv(csv);
  return rows.map(transformRow).filter((r): r is Restaurant => r !== null);
}

async function readLocalJson(): Promise<Restaurant[]> {
  const raw = await readFile(FALLBACK_PATH, 'utf-8');
  const data = JSON.parse(raw) as Restaurant[];
  return data.map((r) => ({
    ...r,
    id: r.id || generateId(r.name, r.city),
    concerns: sanitizeConcerns(r.concerns),
    highlights: sanitizeHighlights(r.highlights),
  }));
}

export async function getRestaurants(): Promise<Restaurant[]> {
  const sheetsId = process.env.SHEETS_ID;
  const sheetName = process.env.SHEET_NAME ?? 'restaurants';

  if (sheetsId) {
    try {
      const data = await fetchFromSheets(sheetsId, sheetName);
      if (data.length === 0) {
        console.warn('[loader] Sheets returned 0 rows, using local snapshot');
        return await readLocalJson();
      }
      try {
        await writeFile(FALLBACK_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
      } catch (e) {
        console.warn('[loader] Failed to update snapshot:', e);
      }
      return data;
    } catch (e) {
      console.warn('[loader] Sheets fetch failed, falling back to local snapshot:', e);
    }
  }
  return await readLocalJson();
}
