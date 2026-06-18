# 旅程の複数端末同期 — 実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PC とスマホで旅程アイテムを双方向に同期できるようにする。Private GitHub Gist を Source of Truth とし、localStorage をオフラインキャッシュ + 未送信キューとして使う。

**Architecture:** Vercel Serverless Function `/api/sync-itinerary` が認証ゲートと Octokit プロキシを担当。クライアントはページロード時に GET で最新を取得し、編集時に POST で差分を送信。`updatedAt` による last-write-wins、`deletedAt` トゥームストーンで削除同期。オフライン時は localStorage キューに溜め、`online` イベントで自動ドレイン。

**Tech Stack:** Astro 4 (static), TypeScript strict (NodeNext), Vercel Functions (@vercel/node), @octokit/rest, native localStorage / fetch / online events. No test framework — 純関数は手書き Node スクリプトで verify、それ以外は `pnpm build` の型チェック + 手動 smoke test。

**Reference Spec:** [docs/superpowers/specs/2026-06-18-itinerary-sync-design.md](../specs/2026-06-18-itinerary-sync-design.md)

---

## Task 1: スキーマ拡張 — `updatedAt` / `deletedAt` をアイテム型に追加

**Files:**
- Modify: `src/types/itinerary.ts`

- [ ] **Step 1: 現在の `ItineraryItem` インターフェースを確認**

Run: `Read src/types/itinerary.ts`
期待: `id`/`type`/`title`/`startAt`/`endAt?`/`location?`/`details?`/`notes?` の構造を確認できる

- [ ] **Step 2: フィールドを追加**

`ItineraryItem` インターフェース定義を以下に置き換え:

```ts
export interface ItineraryItem {
  id: string;
  type: ItineraryType;
  title: string;
  startAt: string;
  endAt?: string;
  location?: ItineraryLocation;
  details?: Record<string, string | number | boolean | null>;
  notes?: string;
  /** ISO 8601、最終更新タイムスタンプ。同期競合解決に使用。 */
  updatedAt: string;
  /** ISO 8601、論理削除のトゥームストーン。削除アイテムは物理削除せず deletedAt を立てて Gist に残す。 */
  deletedAt?: string;
}
```

- [ ] **Step 3: 既存ヘルパー関数の影響を確認**

`compareItineraryItems`, `itineraryTypeMeta`, `formatItineraryDateTime`, `itineraryDateKey` は新フィールドを参照していないため変更不要。

- [ ] **Step 4: 型チェック + ビルド**

Run: `pnpm build`
Expected: PASS — `[build] Complete!`、型エラー無し

- [ ] **Step 5: Commit**

```bash
git add src/types/itinerary.ts
git commit -m "Add updatedAt/deletedAt to ItineraryItem schema (sync prep)"
```

---

## Task 2: Loader を新フィールド対応 + tombstone フィルタ

**Files:**
- Modify: `src/data/itinerary-loader.ts`

- [ ] **Step 1: 現在の `sanitize` 関数を確認**

Run: `Read src/data/itinerary-loader.ts`
期待: `id`, `type`, `title`, `startAt` 必須チェックの構造を確認

- [ ] **Step 2: sanitize 関数を新フィールド対応に拡張**

`sanitize()` 関数を以下に書き換え (関数全体を置換):

```ts
function sanitize(item: unknown): ItineraryItem | null {
  if (!item || typeof item !== 'object') return null;
  const r = item as Record<string, unknown>;
  if (typeof r.type !== 'string' || !ITINERARY_TYPE_SET.has(r.type as ItineraryType)) return null;
  if (typeof r.title !== 'string' || !r.title.trim()) return null;
  if (typeof r.startAt !== 'string' || !r.startAt.trim()) return null;

  const id =
    typeof r.id === 'string' && r.id.trim()
      ? r.id
      : generateId(r.type, r.title, r.startAt);

  const updatedAt =
    typeof r.updatedAt === 'string' && r.updatedAt.trim()
      ? r.updatedAt
      : new Date().toISOString();

  return {
    id,
    type: r.type as ItineraryType,
    title: r.title.trim(),
    startAt: r.startAt,
    endAt: typeof r.endAt === 'string' ? r.endAt : undefined,
    location: typeof r.location === 'object' && r.location ? (r.location as ItineraryItem['location']) : undefined,
    details: typeof r.details === 'object' && r.details ? (r.details as ItineraryItem['details']) : undefined,
    notes: typeof r.notes === 'string' ? r.notes : undefined,
    updatedAt,
    deletedAt: typeof r.deletedAt === 'string' && r.deletedAt.trim() ? r.deletedAt : undefined,
  };
}
```

- [ ] **Step 3: tombstone フィルタを `getItinerary` 関数に追加**

`getItinerary()` 関数を以下に書き換え:

```ts
export async function getItinerary(): Promise<ItineraryItem[]> {
  const raw = itineraryJson as unknown[];
  const items: ItineraryItem[] = [];
  for (const r of raw) {
    const s = sanitize(r);
    if (s && !s.deletedAt) items.push(s);
  }
  return items.sort(compareItineraryItems);
}
```

`deletedAt` 有りはサーバーサイドレンダリング (Astro build 時) から除外。

- [ ] **Step 4: 型チェック + ビルド**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/itinerary-loader.ts
git commit -m "Loader: handle updatedAt + filter tombstones from SSR"
```

---

## Task 3: マージロジックを純関数として実装 + テストスクリプト

**Files:**
- Create: `src/lib/itinerary-merge.ts`
- Create: `scripts/test-itinerary-merge.mjs`

- [ ] **Step 1: マージ関数を作成**

新規ファイル `src/lib/itinerary-merge.ts`:

```ts
import type { ItineraryItem } from '../types/itinerary.js';

export interface MergeResult {
  /** マージ結果の全アイテム (tombstone 含む) */
  next: ItineraryItem[];
  /** 反映された書き込みの id */
  applied: string[];
  /** 古いタイムスタンプで skip された書き込みの id と理由 */
  skipped: { id: string; reason: string }[];
}

/**
 * サーバー側の現在アイテム配列 (tombstone 含む) と、
 * クライアントから来た writes 配列をマージする。
 *
 * ルール: id ごとに updatedAt が新しい方を採用 (last-write-wins)。
 * 新規 id は無条件に追加。
 *
 * 純関数: 入力を mutate しない。
 */
export function mergeItems(server: ItineraryItem[], writes: ItineraryItem[]): MergeResult {
  const byId = new Map<string, ItineraryItem>();
  for (const s of server) byId.set(s.id, s);

  const applied: string[] = [];
  const skipped: { id: string; reason: string }[] = [];

  for (const w of writes) {
    const existing = byId.get(w.id);
    if (!existing) {
      byId.set(w.id, w);
      applied.push(w.id);
      continue;
    }
    const wTime = new Date(w.updatedAt).getTime();
    const eTime = new Date(existing.updatedAt).getTime();
    if (!Number.isFinite(wTime) || !Number.isFinite(eTime)) {
      skipped.push({ id: w.id, reason: 'invalid-timestamp' });
      continue;
    }
    if (wTime > eTime) {
      byId.set(w.id, w);
      applied.push(w.id);
    } else {
      skipped.push({ id: w.id, reason: 'stale' });
    }
  }

  return { next: Array.from(byId.values()), applied, skipped };
}
```

- [ ] **Step 2: テストスクリプトを作成**

新規ファイル `scripts/test-itinerary-merge.mjs`:

```js
// マージロジックの最小検証スクリプト
// 実行: node scripts/test-itinerary-merge.mjs
// 終了コード 0 = 全 PASS、非0 = FAIL

import { mergeItems } from '../src/lib/itinerary-merge.ts';

let pass = 0, fail = 0;
function eq(actual, expected, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) { pass++; console.log('  PASS:', label); }
  else { fail++; console.log('  FAIL:', label, '\n    actual  :', a, '\n    expected:', e); }
}

console.log('Test 1: new id is added');
{
  const server = [];
  const writes = [{ id: 'a', type: 'flight', title: 'A', startAt: '2026-01-01T00:00:00', updatedAt: '2026-06-18T10:00:00Z' }];
  const r = mergeItems(server, writes);
  eq(r.applied, ['a'], 'applied=[a]');
  eq(r.skipped, [], 'skipped=[]');
  eq(r.next.length, 1, 'next.length=1');
}

console.log('Test 2: newer overwrites older');
{
  const server = [{ id: 'a', type: 'flight', title: 'OLD', startAt: '2026-01-01T00:00:00', updatedAt: '2026-06-18T09:00:00Z' }];
  const writes = [{ id: 'a', type: 'flight', title: 'NEW', startAt: '2026-01-01T00:00:00', updatedAt: '2026-06-18T10:00:00Z' }];
  const r = mergeItems(server, writes);
  eq(r.applied, ['a'], 'applied=[a]');
  eq(r.next[0].title, 'NEW', 'title=NEW');
}

console.log('Test 3: older is skipped (stale)');
{
  const server = [{ id: 'a', type: 'flight', title: 'NEW', startAt: '2026-01-01T00:00:00', updatedAt: '2026-06-18T10:00:00Z' }];
  const writes = [{ id: 'a', type: 'flight', title: 'OLD', startAt: '2026-01-01T00:00:00', updatedAt: '2026-06-18T09:00:00Z' }];
  const r = mergeItems(server, writes);
  eq(r.applied, [], 'applied=[]');
  eq(r.skipped, [{ id: 'a', reason: 'stale' }], 'skipped=[{a,stale}]');
  eq(r.next[0].title, 'NEW', 'title=NEW (unchanged)');
}

console.log('Test 4: tombstone wins over older edit');
{
  const server = [{ id: 'a', type: 'flight', title: 'A', startAt: '2026-01-01T00:00:00', updatedAt: '2026-06-18T09:00:00Z' }];
  const writes = [{ id: 'a', type: 'flight', title: 'A', startAt: '2026-01-01T00:00:00', updatedAt: '2026-06-18T10:00:00Z', deletedAt: '2026-06-18T10:00:00Z' }];
  const r = mergeItems(server, writes);
  eq(r.applied, ['a'], 'applied=[a] (tombstone)');
  eq(r.next[0].deletedAt, '2026-06-18T10:00:00Z', 'deletedAt set');
}

console.log('Test 5: invalid timestamp is skipped');
{
  const server = [{ id: 'a', type: 'flight', title: 'A', startAt: '2026-01-01T00:00:00', updatedAt: '2026-06-18T10:00:00Z' }];
  const writes = [{ id: 'a', type: 'flight', title: 'X', startAt: '2026-01-01T00:00:00', updatedAt: 'not-a-date' }];
  const r = mergeItems(server, writes);
  eq(r.skipped, [{ id: 'a', reason: 'invalid-timestamp' }], 'skipped=invalid-timestamp');
}

console.log('Test 6: mixed batch');
{
  const server = [
    { id: 'a', type: 'flight', title: 'A', startAt: '2026-01-01T00:00:00', updatedAt: '2026-06-18T09:00:00Z' },
    { id: 'b', type: 'hotel', title: 'B', startAt: '2026-01-02T00:00:00', updatedAt: '2026-06-18T11:00:00Z' },
  ];
  const writes = [
    { id: 'a', type: 'flight', title: 'A2', startAt: '2026-01-01T00:00:00', updatedAt: '2026-06-18T10:00:00Z' },
    { id: 'b', type: 'hotel', title: 'B2', startAt: '2026-01-02T00:00:00', updatedAt: '2026-06-18T10:00:00Z' },
    { id: 'c', type: 'train', title: 'C', startAt: '2026-01-03T00:00:00', updatedAt: '2026-06-18T12:00:00Z' },
  ];
  const r = mergeItems(server, writes);
  eq(r.applied.sort(), ['a', 'c'], 'applied=[a,c]');
  eq(r.skipped, [{ id: 'b', reason: 'stale' }], 'skipped=[b,stale]');
  eq(r.next.length, 3, 'next.length=3');
}

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
```

注: `.ts` を Node ESM で直接 import するには Node 22+ の native TypeScript サポートが必要。
- Node 22 未満なら: `npm exec -- tsx scripts/test-itinerary-merge.mjs` (tsx 経由)

- [ ] **Step 3: テスト実行 (fail を期待)**

Run: `node --experimental-strip-types scripts/test-itinerary-merge.mjs` (Node 22+) または `pnpm exec tsx scripts/test-itinerary-merge.mjs`
Expected: 全 6 テスト PASS (実装は Step 1 で完成しているので最初から PASS する)

もし `tsx` が無く Node 22 未満なら: `pnpm add -D tsx` してから再実行。

- [ ] **Step 4: Commit**

```bash
git add src/lib/itinerary-merge.ts scripts/test-itinerary-merge.mjs
git commit -m "Add itinerary merge logic (last-write-wins) with test script"
```

---

## Task 4: GitHub Gist ラッパー (`src/lib/github-gist.ts`)

**Files:**
- Create: `src/lib/github-gist.ts`

- [ ] **Step 1: Octokit 経由の薄ラッパーを作成**

新規ファイル `src/lib/github-gist.ts`:

```ts
import { Octokit } from '@octokit/rest';
import type { ItineraryItem } from '../types/itinerary.js';

const FILE_NAME = 'itinerary.json';

export interface GistContent {
  version: 1;
  items: ItineraryItem[];
  lastModifiedAt: string;
}

function client(): Octokit {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN not configured');
  return new Octokit({ auth: token });
}

function gistId(): string {
  const id = process.env.ITINERARY_GIST_ID;
  if (!id) throw new Error('ITINERARY_GIST_ID not configured');
  return id;
}

/**
 * Private Gist から旅程データを取得。
 * 未初期化 (空ファイル) なら空の version=1 構造を返す。
 */
export async function fetchItineraryGist(): Promise<GistContent> {
  const gh = client();
  const res = await gh.gists.get({ gist_id: gistId() });
  const file = res.data.files?.[FILE_NAME];
  if (!file || !file.content) {
    return { version: 1, items: [], lastModifiedAt: new Date().toISOString() };
  }
  try {
    const parsed = JSON.parse(file.content);
    if (parsed && parsed.version === 1 && Array.isArray(parsed.items)) {
      return parsed as GistContent;
    }
  } catch {
    // fall through
  }
  return { version: 1, items: [], lastModifiedAt: new Date().toISOString() };
}

/**
 * Private Gist の旅程データを更新。
 * 全置換 (差分更新ではない、呼び出し側が完全な items を渡す)。
 */
export async function updateItineraryGist(items: ItineraryItem[]): Promise<GistContent> {
  const gh = client();
  const content: GistContent = {
    version: 1,
    items,
    lastModifiedAt: new Date().toISOString(),
  };
  await gh.gists.update({
    gist_id: gistId(),
    files: {
      [FILE_NAME]: { content: JSON.stringify(content, null, 2) },
    },
  });
  return content;
}
```

- [ ] **Step 2: 型チェック + ビルド**

Run: `pnpm build`
Expected: PASS (`@octokit/rest` は既存依存)

- [ ] **Step 3: Commit**

```bash
git add src/lib/github-gist.ts
git commit -m "Add github-gist wrapper for itinerary sync"
```

---

## Task 5: `/api/sync-itinerary` エンドポイント

**Files:**
- Create: `api/sync-itinerary.ts`

- [ ] **Step 1: GET + POST ハンドラを実装**

新規ファイル `api/sync-itinerary.ts`:

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchItineraryGist, updateItineraryGist } from '../src/lib/github-gist.js';
import { mergeItems } from '../src/lib/itinerary-merge.js';
import type { ItineraryItem, ItineraryType } from '../src/types/itinerary.js';

const VALID_TYPES = new Set<ItineraryType>([
  'flight', 'hotel', 'train', 'attraction', 'restaurant', 'generic',
]);

function validateWrite(input: unknown): ItineraryItem | string {
  if (!input || typeof input !== 'object') return 'item must be object';
  const r = input as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id.trim()) return 'id required';
  if (typeof r.updatedAt !== 'string' || !r.updatedAt.trim()) return 'updatedAt required';
  if (typeof r.deletedAt === 'string' && r.deletedAt.trim()) {
    // tombstone: type/title/startAt は省略可
    return {
      id: r.id.trim(),
      type: (typeof r.type === 'string' && VALID_TYPES.has(r.type as ItineraryType) ? r.type : 'generic') as ItineraryType,
      title: typeof r.title === 'string' ? r.title : '',
      startAt: typeof r.startAt === 'string' ? r.startAt : new Date(0).toISOString(),
      updatedAt: r.updatedAt,
      deletedAt: r.deletedAt,
    };
  }
  // 通常アイテム: 必須フィールドあり
  if (typeof r.type !== 'string' || !VALID_TYPES.has(r.type as ItineraryType)) return 'invalid type';
  if (typeof r.title !== 'string' || !r.title.trim()) return 'title required';
  if (typeof r.startAt !== 'string' || !r.startAt.trim()) return 'startAt required';

  const item: ItineraryItem = {
    id: r.id.trim(),
    type: r.type as ItineraryType,
    title: r.title.trim(),
    startAt: r.startAt,
    updatedAt: r.updatedAt,
  };
  if (typeof r.endAt === 'string' && r.endAt.trim()) item.endAt = r.endAt;
  if (r.location && typeof r.location === 'object') item.location = r.location as ItineraryItem['location'];
  if (r.details && typeof r.details === 'object' && !Array.isArray(r.details)) {
    item.details = r.details as ItineraryItem['details'];
  }
  if (typeof r.notes === 'string' && r.notes.trim()) item.notes = r.notes.trim();
  return item;
}

function authOk(req: VercelRequest): string | null {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return 'ADMIN_PASSWORD not configured on server';
  const given = (req.headers['x-admin-password'] ?? '') as string;
  if (!given) return 'Missing X-Admin-Password header';
  if (given !== expected) return 'Invalid password';
  return null;
}

function checkGistConfig(res: VercelResponse): boolean {
  if (!process.env.ITINERARY_GIST_ID) {
    res.status(503).json({
      error: 'ITINERARY_GIST_ID not configured. Run: node scripts/setup-itinerary-gist.mjs',
    });
    return false;
  }
  if (!process.env.GITHUB_TOKEN) {
    res.status(503).json({ error: 'GITHUB_TOKEN not configured on server' });
    return false;
  }
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authErr = authOk(req);
  if (authErr) return res.status(401).json({ error: authErr });
  if (!checkGistConfig(res)) return;

  try {
    if (req.method === 'GET') {
      const content = await fetchItineraryGist();
      return res.status(200).json({
        version: content.version,
        items: content.items,
        serverTimestamp: new Date().toISOString(),
      });
    }

    if (req.method === 'POST') {
      const body = req.body as { writes?: unknown } | undefined;
      const raw = body?.writes;
      if (!Array.isArray(raw)) {
        return res.status(400).json({ error: 'writes must be an array' });
      }
      const writes: ItineraryItem[] = [];
      const rejected: { index: number; reason: string }[] = [];
      raw.forEach((w, i) => {
        const v = validateWrite(w);
        if (typeof v === 'string') rejected.push({ index: i, reason: v });
        else writes.push(v);
      });

      const current = await fetchItineraryGist();
      const { next, applied, skipped } = mergeItems(current.items, writes);
      const updated = await updateItineraryGist(next);

      return res.status(200).json({
        version: updated.version,
        items: updated.items,
        applied,
        skipped,
        rejected,
        serverTimestamp: new Date().toISOString(),
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ error: msg });
  }
}
```

- [ ] **Step 2: ビルド**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add api/sync-itinerary.ts
git commit -m "Add /api/sync-itinerary endpoint (GET + POST with merge)"
```

---

## Task 6: セットアップスクリプト (一度きり、Gist 作成)

**Files:**
- Create: `scripts/setup-itinerary-gist.mjs`

- [ ] **Step 1: スクリプトを作成**

新規ファイル `scripts/setup-itinerary-gist.mjs`:

```js
#!/usr/bin/env node
// Private Gist を 1 つ作成し、ITINERARY_GIST_ID に設定すべき ID を出力する。
// 実行: node scripts/setup-itinerary-gist.mjs
// 前提: 環境変数 GITHUB_TOKEN に gist scope を含む PAT が設定されていること

import { Octokit } from '@octokit/rest';

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error('ERROR: GITHUB_TOKEN env var is required.');
  console.error('Hint: set in .env.local or pass inline: GITHUB_TOKEN=ghp_... node scripts/setup-itinerary-gist.mjs');
  process.exit(1);
}

const gh = new Octokit({ auth: token });

const initial = {
  version: 1,
  items: [],
  lastModifiedAt: new Date().toISOString(),
};

try {
  const res = await gh.gists.create({
    description: 'italia-gohan-map itinerary (private, do not share URL)',
    public: false,
    files: {
      'itinerary.json': { content: JSON.stringify(initial, null, 2) },
    },
  });
  const gistId = res.data.id ?? '(unknown)';
  const gistUrl = res.data.html_url ?? '(unknown)';
  console.log('');
  console.log('  ✓ Private Gist created');
  console.log('');
  console.log(`  Gist ID  : ${gistId}`);
  console.log(`  Gist URL : ${gistUrl}`);
  console.log('');
  console.log('  Next steps:');
  console.log('  1. Set Vercel env var ITINERARY_GIST_ID to the ID above:');
  console.log('     - Via CLI : vercel env add ITINERARY_GIST_ID production');
  console.log('     - Via UI  : https://vercel.com/dashboard → Settings → Environment Variables');
  console.log('  2. Add to local .env.local for testing:');
  console.log(`     ITINERARY_GIST_ID=${gistId}`);
  console.log('  3. Trigger Vercel redeploy (git push or manual)');
  console.log('');
} catch (e) {
  console.error('Failed to create gist:', e.message ?? e);
  if (e.message?.includes('scope')) {
    console.error('Hint: your PAT may be missing the `gist` scope. Edit at https://github.com/settings/tokens');
  }
  process.exit(2);
}
```

- [ ] **Step 2: スクリプトの構文チェック**

Run: `node --check scripts/setup-itinerary-gist.mjs`
Expected: 終了コード 0 (構文 OK)

- [ ] **Step 3: Commit**

```bash
git add scripts/setup-itinerary-gist.mjs
git commit -m "Add setup-itinerary-gist script (one-time gist creation)"
```

---

## Task 7: ページスクリプトに sync ロジックを追加

**Files:**
- Modify: `src/pages/itinerary.astro`

注: これは比較的大きな変更です。section ごとに差分適用してください。

- [ ] **Step 1: localStorage キー定数を追加**

`src/pages/itinerary.astro` の `<script>` セクション内、`PRIVATE_KEY` の宣言の直後に追加:

```ts
const QUEUE_KEY = 'italia-gohan-itinerary-queue';
const LAST_SYNC_KEY = 'italia-gohan-itinerary-last-sync';
```

- [ ] **Step 2: キュー操作関数を追加**

`loadPrivate`/`savePrivate` 関数の近く (同セクション) に追加:

```ts
function loadQueue(): Record<string, Item> {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    return typeof p === 'object' && p ? (p as Record<string, Item>) : {};
  } catch {
    return {};
  }
}
function saveQueue(q: Record<string, Item>) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}
function enqueueWrite(item: Item) {
  const q = loadQueue();
  q[item.id] = item;
  saveQueue(q);
}
function dequeueWrite(id: string) {
  const q = loadQueue();
  delete q[id];
  saveQueue(q);
}
function getLastSync(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}
function setLastSync(ts: string) {
  localStorage.setItem(LAST_SYNC_KEY, ts);
}
```

- [ ] **Step 3: マイグレーション関数を追加**

`renderPrivateItems` 関数の近くに追加:

```ts
function migrateLocalItems() {
  const items = loadPrivate();
  let changed = false;
  for (const it of items) {
    if (!(it as Partial<Item>).updatedAt) {
      it.updatedAt = new Date().toISOString();
      enqueueWrite(it);
      changed = true;
    }
  }
  if (changed) savePrivate(items);
}
```

`Item` 型に `updatedAt?: string; deletedAt?: string;` を加える (script 内の型定義箇所):

```ts
type Item = {
  id: string;
  type: 'flight' | 'hotel' | 'train' | 'attraction' | 'restaurant' | 'generic';
  title: string;
  startAt: string;
  endAt?: string;
  location?: { name?: string; address?: string; from?: string; to?: string; lat?: number; lng?: number };
  details?: Record<string, string | number | boolean | null>;
  notes?: string;
  updatedAt?: string;
  deletedAt?: string;
};
```

- [ ] **Step 4: GET (fetch latest) 関数を追加**

`submitToApi` 関数の近くに追加:

```ts
async function fetchLatestFromServer(): Promise<Item[] | null> {
  const password = getPassword();
  if (!password) return null;
  if (!navigator.onLine) return null;
  try {
    const res = await fetch('/api/sync-itinerary', {
      method: 'GET',
      headers: { 'x-admin-password': password },
    });
    if (res.status === 401) { clearPassword(); return null; }
    if (!res.ok) return null;
    const json = await res.json();
    if (!Array.isArray(json.items)) return null;
    setLastSync(json.serverTimestamp ?? new Date().toISOString());
    return json.items as Item[];
  } catch {
    return null;
  }
}
```

- [ ] **Step 5: キュードレイン関数を追加**

```ts
async function drainQueue() {
  const password = getPassword();
  if (!password) return;
  if (!navigator.onLine) return;
  const q = loadQueue();
  const writes = Object.values(q);
  if (writes.length === 0) return;
  try {
    const res = await fetch('/api/sync-itinerary', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ writes }),
    });
    if (!res.ok) return;
    const json = await res.json();
    (json.applied ?? []).forEach((id: string) => dequeueWrite(id));
    (json.skipped ?? []).forEach((s: { id: string }) => dequeueWrite(s.id));
    if (Array.isArray(json.items)) {
      applyServerItems(json.items as Item[]);
    }
    setLastSync(json.serverTimestamp ?? new Date().toISOString());
  } catch {
    // network error: keep queue, retry next time
  }
}
```

- [ ] **Step 6: サーバー値をキャッシュに反映する関数を追加**

```ts
function applyServerItems(serverItems: Item[]) {
  const queue = loadQueue();
  // サーバー側を起点にする (tombstone 除外)
  const next = serverItems.filter((x) => !x.deletedAt);
  // キューに残っているアイテムが新しければ保持
  for (const [id, qItem] of Object.entries(queue)) {
    const sIdx = next.findIndex((x) => x.id === id);
    const sItem = sIdx >= 0 ? next[sIdx] : null;
    const qTime = qItem.updatedAt ? new Date(qItem.updatedAt).getTime() : 0;
    const sTime = sItem?.updatedAt ? new Date(sItem.updatedAt).getTime() : 0;
    if (qTime > sTime && !qItem.deletedAt) {
      if (sIdx >= 0) next[sIdx] = qItem;
      else next.push(qItem);
    }
  }
  savePrivate(next);
  rerenderTimeline();
}

function rerenderTimeline() {
  // 既存の private カードを全削除して描画し直す
  document.querySelectorAll<HTMLElement>('[data-source="private"]').forEach((el) => el.remove());
  // 空 day-group も削除
  document.querySelectorAll<HTMLElement>('.itinerary-day').forEach((day) => {
    if (!day.querySelector('.itinerary-card')) day.remove();
  });
  renderPrivateItems();
  hideEmptyStateIfHasItems();
  updateCount();
}
```

- [ ] **Step 7: submitToPrivate を編集 — updatedAt を必ずセット、キューに入れる**

既存の `submitToPrivate` 関数を以下に置き換え:

```ts
function submitToPrivate(item: Item) {
  item.updatedAt = new Date().toISOString();
  upsertPrivate(item);
  enqueueWrite(item);
  setSensitive(item.id, gatherFormSensitive());
  const status = document.getElementById('if-status');
  if (status) {
    status.hidden = false;
    status.textContent = navigator.onLine
      ? '✓ 保存 (同期中…)'
      : '✓ 保存 (オフライン、復帰時に同期)';
  }
  const existing = document.querySelector(`[data-id="${item.id}"]`);
  if (existing) existing.remove();
  const list = ensureDayGroup(dateKey(item.startAt));
  insertCardSorted(list, buildCardHtml(item, true), item);
  attachCardListeners();
  renderSensitiveLines();
  hideEmptyStateIfHasItems();
  updateCount();
  // 非同期でドレイン (await しない)
  void drainQueue();
  setTimeout(modalClose, 800);
}
```

- [ ] **Step 8: 削除ハンドラを tombstone 対応に変更**

既存の `attachCardListeners` 内の delete ハンドラを以下に変更:

```ts
scope.querySelectorAll<HTMLButtonElement>('[data-delete-id]').forEach((btn) => {
  if (btn.dataset.bound === '1') return;
  btn.dataset.bound = '1';
  btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-delete-id');
    if (!id) return;
    const ok = confirm('このアイテムを削除しますか？');
    if (!ok) return;
    const isPriv = !!findPrivate(id);
    if (isPriv) {
      const target = findPrivate(id);
      if (target) {
        const tombstone: Item = { ...target, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        enqueueWrite(tombstone);
      }
      deletePrivate(id);
      clearSensitive(id);
      const card = document.querySelector(`[data-id="${id}"]`);
      card?.remove();
      updateCount();
      hideEmptyStateIfHasItems();
      void drainQueue();
    } else {
      submitToApi('delete', { id, type: 'generic', title: '', startAt: '' });
    }
  });
});
```

- [ ] **Step 9: updateSyncBadge 関数を追加**

`drainQueue` 関数の近くに追加 (Task 8 が HTML 要素を追加するまではこの関数は no-op で動作 — `getElementById` が null を返すと早期 return):

```ts
function updateSyncBadge() {
  const el = document.getElementById('itinerary-sync-status');
  if (!el) return;
  const queueSize = Object.keys(loadQueue()).length;
  const ls = getLastSync();
  if (!navigator.onLine) {
    el.dataset.state = 'offline';
    el.textContent = queueSize > 0 ? `📴 オフライン (${queueSize} 件保留)` : '📴 オフライン';
    return;
  }
  if (queueSize > 0) {
    el.dataset.state = 'syncing';
    el.textContent = `🔄 同期中 (${queueSize})`;
    return;
  }
  if (ls) {
    const d = new Date(ls);
    const hm = d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    el.dataset.state = 'ok';
    el.textContent = `✓ 同期済み ${hm}`;
  } else {
    el.dataset.state = 'idle';
    el.textContent = '—';
  }
}
```

- [ ] **Step 10: ページロード時の sync 呼び出しを追加**

ファイル末尾近くの初期化箇所 (`renderPrivateItems();` の手前) に追加:

```ts
// 移行: updatedAt 無しのレガシーアイテムにタイムスタンプ付与
migrateLocalItems();
```

そして `renderPrivateItems();` の直後に追加:

```ts
// オンライン時はサーバーから最新を取得 → 描画反映
void (async () => {
  const latest = await fetchLatestFromServer();
  if (latest) applyServerItems(latest);
  await drainQueue();
  updateSyncBadge();
})();

window.addEventListener('online', () => { void drainQueue(); updateSyncBadge(); });
window.addEventListener('offline', () => { updateSyncBadge(); });
setInterval(updateSyncBadge, 30_000);
```

- [ ] **Step 11: ビルド**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 12: Commit**

```bash
git add src/pages/itinerary.astro
git commit -m "Add sync logic to itinerary page (queue + drain + online/offline)"
```

---

## Task 8: 同期ステータスバッジ UI + 手動同期ボタン

**Files:**
- Modify: `src/pages/itinerary.astro`
- Modify: `src/styles/global.css`

注: Task 7 で `updateSyncBadge` 関数は既に追加済み。Task 8 はその関数が targets する DOM 要素と CSS、手動ボタンのクリックハンドラを追加するだけ。

- [ ] **Step 1: HTML に同期ボタンとバッジを追加**

`itinerary.astro` のヘッダー部分を以下に変更 (既存の `<header class="app-header">` 全体を置換):

```astro
<header class="app-header">
  <h1>旅程</h1>
  <nav class="app-nav">
    <a href="/" class="app-nav-link">🗺 マップに戻る</a>
    <button type="button" id="itinerary-sync-btn" class="app-nav-link" title="同期">🔄</button>
    <span id="itinerary-sync-status" class="itinerary-sync-status" data-state="idle">—</span>
  </nav>
  <span class="card-meta" id="itinerary-count">{items.length} アイテム</span>
</header>
```

- [ ] **Step 2: 手動同期ボタンのハンドラを追加**

`window.addEventListener('online', ...)` の近くに追加:

```ts
document.getElementById('itinerary-sync-btn')?.addEventListener('click', async () => {
  updateSyncBadge();
  const latest = await fetchLatestFromServer();
  if (latest) applyServerItems(latest);
  await drainQueue();
  updateSyncBadge();
});
```

- [ ] **Step 3: CSS スタイルを追加**

`src/styles/global.css` の末尾 (`.itinerary-priv-badge {...}` の直後) に追加:

```css
.itinerary-sync-status {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  background: var(--color-surface-2);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  white-space: nowrap;
}
.itinerary-sync-status[data-state="ok"] {
  background: #d1fae5;
  color: #065f46;
  border-color: #6ee7b7;
}
.itinerary-sync-status[data-state="syncing"] {
  background: #fef3c7;
  color: #92400e;
  border-color: #fcd34d;
}
.itinerary-sync-status[data-state="offline"] {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fca5a5;
}
#itinerary-sync-btn {
  cursor: pointer;
  background: var(--color-surface-2);
}
#itinerary-sync-btn:hover {
  background: var(--color-surface);
}
```

- [ ] **Step 4: ビルド**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/itinerary.astro src/styles/global.css
git commit -m "Add sync status badge + manual sync button UI"
```

---

## Task 9: フォームラベル変更 + 決定ログ追記

**Files:**
- Modify: `src/components/ItineraryForm.astro`
- Modify: `docs/plan/decisions-log.md`

- [ ] **Step 1: フォームのプライベートトグルラベルを更新**

`src/components/ItineraryForm.astro` の以下の部分:

```astro
<label class="if-row if-private-toggle">
  <input type="checkbox" id="if-private" checked />
  <span>🔒 プライベート保存 (この端末のみ、GitHub に commit しない)</span>
</label>
```

を以下に変更:

```astro
<label class="if-row if-private-toggle">
  <input type="checkbox" id="if-private" checked />
  <span>🔒 プライベート (Private Gist 同期、端末間で共有)</span>
</label>
```

- [ ] **Step 2: 決定ログに同期拡張を追記**

`docs/plan/decisions-log.md` の D-031 セクション末尾 (`private/itinerary-import-snippet.js` の言及の段落の直後) に追加:

```markdown

### 2026-06-18 追加: 複数端末同期 (Private Gist)

ユーザー要望「スマホからアクセスした際にも旅程出るようにして」を受けて、**複数端末双方向同期** を追加実装:

- Private GitHub Gist を Source of Truth として 1 ファイル `itinerary.json` で全アイテム管理 (tombstone 含む)
- `/api/sync-itinerary` (GET + POST) を新設、認証は `ADMIN_PASSWORD`、Gist 操作は既存 `GITHUB_TOKEN` (要 `gist` scope)
- `ItineraryItem` に `updatedAt` (必須) と `deletedAt` (省略可、tombstone) を追加
- マージ: last-write-wins per `id`、`updatedAt` で比較 (純関数 `src/lib/itinerary-merge.ts`)
- localStorage は (1) キャッシュ (`italia-gohan-itinerary-private`)、(2) 未送信キュー (`italia-gohan-itinerary-queue`)、(3) 最終同期時刻 (`italia-gohan-itinerary-last-sync`) の 3 キー
- オフライン対応: `online`/`offline` イベントでキューを自動ドレイン、UI にステータスバッジ表示 (`✓ 同期済み HH:MM` / `🔄 同期中 (N)` / `📴 オフライン (N 件保留)`)
- 既存ローカル 13 件は初回 sync 時に `updatedAt = now()` 自動付与 + キュー push でサーバーへ反映
- 新環境変数: `ITINERARY_GIST_ID` (Vercel、`scripts/setup-itinerary-gist.mjs` で取得)

設計書: `docs/superpowers/specs/2026-06-18-itinerary-sync-design.md`、実装プラン: `docs/superpowers/plans/2026-06-18-itinerary-sync.md`
```

- [ ] **Step 3: ビルド**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ItineraryForm.astro docs/plan/decisions-log.md
git commit -m "Update private toggle label + log sync extension in D-031"
```

---

## Task 10: E2E 手動検証 + 初期セットアップ実行

**Files:** (なし、操作のみ)

注: ここまでのコード変更はすべて push してください (`git push` で Vercel デプロイ起動)。Vercel デプロイ完了を確認後、以下を順に実行。

- [ ] **Step 1: PAT に `gist` scope を追加**

操作: https://github.com/settings/tokens で既存 PAT を編集 (Classic)、または Fine-grained PAT を再発行
- Classic: チェックボックス「gist」を ON、Update token
- 新しい token 文字列をコピー (PAT は再表示できないので注意)

- [ ] **Step 2: `.env.local` の `GITHUB_TOKEN` を更新**

`.env.local` を編集して `GITHUB_TOKEN=<new_token>` に変更

- [ ] **Step 3: ローカルでセットアップスクリプト実行**

Run (プロジェクト直下で):

```bash
pnpm exec dotenv -e .env.local -- node scripts/setup-itinerary-gist.mjs
```

または `.env.local` を読み込むパッケージが無い場合:

```bash
# PowerShell: 環境変数を export してから実行
$env:GITHUB_TOKEN = (Get-Content .env.local | Where-Object { $_ -match '^GITHUB_TOKEN=' } | ForEach-Object { ($_ -split '=', 2)[1].Trim() })
node scripts/setup-itinerary-gist.mjs
```

Expected: 「✓ Private Gist created」と Gist ID が表示される。ID をコピー保存。

- [ ] **Step 4: Vercel に `ITINERARY_GIST_ID` を設定**

操作: Vercel ダッシュボード → italia-gohan-map → Settings → Environment Variables
- Name: `ITINERARY_GIST_ID`
- Value: Step 3 でコピーした Gist ID
- Environments: Production にチェック
- Save

- [ ] **Step 5: Vercel に `GITHUB_TOKEN` を新 PAT で上書き**

操作: 同じ画面で `GITHUB_TOKEN` を Edit → Step 1 の新 token を貼り付け → Save

- [ ] **Step 6: Vercel 再デプロイをトリガー**

操作: Deployments タブの最新デプロイで「⋯」→「Redeploy」、または `git commit --allow-empty -m "Trigger redeploy" && git push`

デプロイ完了を待つ (~1-2 分)。

- [ ] **Step 7: GET エンドポイントを curl で確認**

Run (パスワードは実際の `ADMIN_PASSWORD` に置換):

```bash
curl -s -H "x-admin-password: YOUR_PASSWORD" https://italia-gohan-map.vercel.app/api/sync-itinerary | head -c 200
```

Expected: `{"version":1,"items":[],"serverTimestamp":"..."}`

- [ ] **Step 8: PC ブラウザで sync 動作確認**

1. https://italia-gohan-map.vercel.app/itinerary を開く
2. 既存の 13 件が表示される (localStorage キャッシュから即時)
3. 数秒後、🔄 ボタン横のバッジが「✓ 同期済み HH:MM」に変わる (GET → drainQueue 完了)
4. F12 → Application → Local Storage → `italia-gohan-itinerary-queue` が `{}` であることを確認

- [ ] **Step 9: Gist の中身を確認**

操作: Step 3 で出力された Gist URL をブラウザで開く (要 GitHub ログイン)
Expected: `itinerary.json` ファイルに 13 件のアイテムが含まれている、各アイテムに `updatedAt` がある

- [ ] **Step 10: スマホで初回アクセス**

1. スマホブラウザで https://italia-gohan-map.vercel.app/itinerary を開く
2. ✎ ボタンを試しに 1 個押す → パスワード入力 UI 出現 → パスワード入力 → ロック解除
3. 一度モーダル閉じる → 自動で GET が走り 13 件が表示される

- [ ] **Step 11: 双方向同期テスト**

1. PC で 1 件追加 (任意のタイトル)
2. ヘッダーバッジが「🔄 同期中 (1)」→「✓ 同期済み」に変化
3. スマホで 🔄 ボタンタップ → 追加した 1 件が表示される
4. スマホで別の 1 件追加
5. PC で 🔄 タップ → スマホ追加分が表示される
6. PC でスマホ追加分を削除
7. スマホで 🔄 タップ → 該当アイテムが消える

- [ ] **Step 12: オフラインテスト**

1. PC で DevTools → Network → Offline をオン
2. アイテムを 1 件編集 → バッジが「📴 オフライン (1 件保留)」
3. Offline を解除 → 自動で「🔄 同期中」→「✓ 同期済み」
4. スマホで 🔄 タップ → 編集が反映される

- [ ] **Step 13: 確認結果をログ**

`docs/curation/auto-expand-log.md` の末尾に E2E 結果セクションを追加 (任意):

```markdown
## 2026-06-18 同期 E2E 確認

- GET/POST 疎通 OK
- 13 件マイグレーション OK
- 双方向同期 PC ↔ スマホ OK
- オフライン → オンライン復帰の自動ドレイン OK
- 削除トゥームストーン伝播 OK
```

- [ ] **Step 14: 最終 commit (確認ログを付けた場合)**

```bash
git add docs/curation/auto-expand-log.md
git commit -m "Log itinerary sync E2E verification (D-031 extension)"
git push
```

---

## 完了基準

- [ ] 全 10 タスクのチェックボックスが完了
- [ ] `pnpm build` が型エラー無しで通る
- [ ] `node scripts/test-itinerary-merge.mjs` (または tsx 経由) が全 6 テスト PASS
- [ ] 本番環境で GET エンドポイントが空 items を返す
- [ ] PC とスマホで双方向同期が動く
- [ ] オフライン編集 → オンライン復帰で自動同期される
