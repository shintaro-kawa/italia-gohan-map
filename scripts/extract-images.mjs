#!/usr/bin/env node
// data/restaurants.json の各エントリの公式 URL から og:image を抽出して imageUrl に格納する。
//
// 使い方:
//   pnpm images           # dry-run (差分プレビューのみ)
//   pnpm images --apply   # 実書き込み
//
// 対象:
//   - url フィールドあり
//   - imageUrl 未設定 (既存値は上書きしない)
//
// マナー:
//   - User-Agent を付与
//   - サイト 1 件ごとに 800ms wait

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TARGET = resolve(__dirname, '../data/restaurants.json');

const APPLY = process.argv.includes('--apply');
const WAIT_MS = 800;
const TIMEOUT_MS = 8000;
const USER_AGENT = 'italia-gohan-map/0.1 (https://github.com/shintaro-kawa/italia-gohan-map)';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      signal: controller.signal,
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// og:image / twitter:image を HTML から抽出
function extractOgImage(html, baseUrl) {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) {
      try {
        return new URL(m[1], baseUrl).toString();
      } catch {
        return null;
      }
    }
  }
  return null;
}

const data = JSON.parse(await readFile(TARGET, 'utf-8'));

const candidates = data.filter((r) => r.url && r.url.trim() && !r.imageUrl);

console.log(`Total entries: ${data.length}`);
console.log(`Candidates with url + no imageUrl: ${candidates.length}`);
console.log(`Mode: ${APPLY ? 'APPLY (will write)' : 'DRY-RUN'}`);
console.log('---');

const updates = [];

for (let i = 0; i < candidates.length; i++) {
  const r = candidates[i];
  try {
    const html = await fetchWithTimeout(r.url);
    const image = extractOgImage(html, r.url);
    if (!image) {
      console.log(`[${i + 1}] ${r.id}: no og:image found`);
    } else {
      console.log(`[${i + 1}] ${r.id}: ${image}`);
      updates.push({ id: r.id, imageUrl: image });
    }
  } catch (e) {
    console.log(`[${i + 1}] ${r.id}: ERROR ${e.message} (url: ${r.url})`);
  }
  if (i < candidates.length - 1) await sleep(WAIT_MS);
}

console.log('---');
console.log(`Updates ready: ${updates.length} / ${candidates.length}`);

if (APPLY && updates.length > 0) {
  const updated = data.map((r) => {
    const u = updates.find((x) => x.id === r.id);
    return u ? { ...r, imageUrl: u.imageUrl } : r;
  });
  await writeFile(TARGET, JSON.stringify(updated, null, 2) + '\n', 'utf-8');
  console.log(`Written ${updates.length} updates to ${TARGET}`);
} else if (APPLY) {
  console.log('Nothing to write.');
} else {
  console.log('Run with --apply to write changes.');
}
