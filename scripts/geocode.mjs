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

// data の city フィールド（英語）→ Nominatim 出力の伊語名（display_name に出やすい形）
const CITY_NAME_MAP = {
  Rome: ['roma'],
  Florence: ['firenze'],
  Palermo: ['palermo'],
  Taormina: ['taormina'],
  Sicily: ['sicilia'],
};

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

const data = JSON.parse(await readFile(TARGET, 'utf-8'));

// 住所があるエントリすべてが対象（既に正確な座標は dry-run で "already accurate" としてスキップ）
const candidates = data.filter((r) => r.address && r.address.trim().length > 0);

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
      // サニティチェック 1: 結果に期待する地名（英伊両方）が含まれているか
      const displayLower = result.displayName.toLowerCase();
      const expected = [
        ...CITY_NAME_MAP[r.city] ?? [],
        (r.area ?? '').toLowerCase(),
      ].filter((n) => n.length > 0);
      const nameMatch = expected.some((n) => displayLower.includes(n));

      // サニティチェック 2: 元座標との距離が暴れすぎていないか（同じ都市内なら 0.1 度 ≒ 11km 以内のはず）
      const dLat = Math.abs(result.lat - r.lat);
      const dLng = Math.abs(result.lng - r.lng);
      const tooFar = dLat > 0.2 || dLng > 0.2;

      if (!nameMatch) {
        console.log(`[${processed}] ${r.id}: ⚠ display name lacks expected location names [${expected.join(', ')}], SKIP`);
        console.log(`    matched: ${result.displayName}`);
      } else if (tooFar) {
        console.log(`[${processed}] ${r.id}: ⚠ delta too large (lat ${dLat.toFixed(4)}, lng ${dLng.toFixed(4)}), SKIP`);
        console.log(`    matched: ${result.displayName}`);
      } else if (dLat < 0.0005 && dLng < 0.0005) {
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
