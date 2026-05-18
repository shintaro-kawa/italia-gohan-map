#!/usr/bin/env node
// data/restaurants.json から Sheets 貼付用の TSV を生成する。
// 使い方: pnpm tsv  (または node scripts/json-to-tsv.mjs)
//
// 出力先: docs/curation/sheets-import.tsv
// 用途: ユーザーが Sheets を空にしたあと、これを丸ごとコピペすれば全データが反映される

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT = resolve(__dirname, '../data/restaurants.json');
const OUTPUT = resolve(__dirname, '../docs/curation/sheets-import.tsv');

const COLS = [
  'name', 'city', 'area', 'genre', 'priceRange',
  'lat', 'lng', 'address', 'visited', 'visitDate',
  'rating', 'comment', 'url', 'tags',
  'source', 'sourceTrust', 'verdict',
  'concerns', 'highlights', 'lastAnalyzed',
];

function cell(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  // タブと改行は CSV 内では即破綻するので空白に置換
  return String(value).replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
}

const data = JSON.parse(await readFile(INPUT, 'utf-8'));

const lines = [COLS.join('\t')];

for (const r of data) {
  const row = COLS.map((c) => {
    if (c === 'visited') return r.visited ? 'TRUE' : 'FALSE';
    if (c === 'tags') return Array.isArray(r.tags) ? r.tags.join(',') : '';
    if (c === 'concerns') return JSON.stringify(r.concerns ?? []);
    if (c === 'highlights') return JSON.stringify(r.highlights ?? []);
    return cell(r[c]);
  });
  lines.push(row.join('\t'));
}

await writeFile(OUTPUT, lines.join('\n') + '\n', 'utf-8');
console.log(`Wrote ${data.length} rows (+1 header) to ${OUTPUT}`);
