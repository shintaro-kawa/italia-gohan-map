#!/usr/bin/env node
// data/restaurants.json の住所から OSM Nominatim API で緯度経度を取得し更新する。
//
// 使い方:
//   pnpm geocode              # dry-run (差分プレビューのみ、書き込まない)
//   pnpm geocode --apply      # 実書き込み
//
// Nominatim ToS:
//   - User-Agent 必須
//   - rate limit 1 req/sec (本スクリプトは 1100ms wait)
//   - 1 回の実行で最大 50 件 (本スクリプトは MAX で制御)

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TARGET = resolve(__dirname, '../data/restaurants.json');

const APPLY = process.argv.includes('--apply');
const MAX = 50;
const WAIT_MS = 1100;
const USER_AGENT = 'italia-gohan-map/0.1 (https://github.com/shintaro-kawa/italia-gohan-map)';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json) || json.length === 0) return null;
  return {
    lat: Number(json[0].lat),
    lng: Number(json[0].lon),
    displayName: json[0].display_name,
  };
}

// 概算座標かどうかを判定（同じ座標が複数店舗で使われている = placeholder の可能性大）
function countCoordOccurrences(data) {
  const counts = new Map();
  for (const r of data) {
    const k = `${r.lat},${r.lng}`;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

const data = JSON.parse(await readFile(TARGET, 'utf-8'));
const coordCounts = countCoordOccurrences(data);

const candidates = data.filter((r) => {
  if (!r.address || !r.address.trim()) return false;
  // 同じ座標が 2 件以上 → placeholder の可能性
  const sharing = coordCounts.get(`${r.lat},${r.lng}`) ?? 0;
  return sharing >= 2;
});

console.log(`Total entries: ${data.length}`);
console.log(`Candidates with address + shared coord: ${candidates.length}`);
console.log(`Will process up to: ${Math.min(MAX, candidates.length)}`);
console.log(`Mode: ${APPLY ? 'APPLY (will write)' : 'DRY-RUN'}`);
console.log('---');

const updates = [];
let processed = 0;

for (const r of candidates) {
  if (processed >= MAX) break;
  processed++;
  try {
    const result = await geocode(r.address);
    if (!result) {
      console.log(`[${processed}] ${r.id}: no match for "${r.address}"`);
    } else {
      const dLat = Math.abs(result.lat - r.lat);
      const dLng = Math.abs(result.lng - r.lng);
      if (dLat < 0.0005 && dLng < 0.0005) {
        console.log(`[${processed}] ${r.id}: already accurate`);
      } else {
        console.log(`[${processed}] ${r.id}: ${r.lat},${r.lng} -> ${result.lat},${result.lng}`);
        console.log(`    address: ${r.address}`);
        console.log(`    matched: ${result.displayName}`);
        updates.push({ id: r.id, lat: result.lat, lng: result.lng });
      }
    }
  } catch (e) {
    console.log(`[${processed}] ${r.id}: ERROR ${e.message}`);
  }
  await sleep(WAIT_MS);
}

console.log('---');
console.log(`Updates ready: ${updates.length}`);

if (APPLY && updates.length > 0) {
  const updated = data.map((r) => {
    const u = updates.find((x) => x.id === r.id);
    return u ? { ...r, lat: u.lat, lng: u.lng } : r;
  });
  await writeFile(TARGET, JSON.stringify(updated, null, 2) + '\n', 'utf-8');
  console.log(`Written ${updates.length} updates to ${TARGET}`);
} else if (APPLY) {
  console.log('Nothing to write.');
} else {
  console.log('Run with --apply to write changes.');
}
