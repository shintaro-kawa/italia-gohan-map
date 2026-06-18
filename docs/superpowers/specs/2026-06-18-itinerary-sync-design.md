# 旅程の複数端末同期 (Private Gist + オフライン対応) — 設計書

- **作成日**: 2026-06-18
- **対象**: italia-gohan-map / Phase 7 拡張 (D-031 に追加)
- **目的**: PC と スマホで同じ旅程を双方向編集・同期し、機内/地下鉄など電波の無い環境でも編集可能にする
- **前提**: 旅程データは public repo に commit しない (D-031 プライベートモードを継続)、認証は既存 `ADMIN_PASSWORD` を再利用、Gist は GitHub 上の Private Gist (URL を知る人のみ閲覧可)

## ユーザー意思決定 (本セッションの brainstorming で確定)

| 質問 | 採用 | 却下案 |
|---|---|---|
| Q1: スマホ操作の方向性 | **B. 双方向編集** | A. 閲覧のみ / C. 各端末独立 |
| Q2: バックエンド | **A. Private GitHub Gist** | B. Vercel KV / C. クライアント暗号化 |
| Q3: オフライン対応 | **B. localStorage キュー + 自動再同期** | A. オンライン前提のみ |

「git に公表しない」は **public repo への commit のみ禁止**、Private Gist は許容 — 本人の合意済み。

## アーキテクチャ全体像

```
┌─────────────────────────┐     ┌─────────────────────────┐
│  PC ブラウザ              │     │  スマホ ブラウザ           │
│  localStorage cache     │     │  localStorage cache     │
│  + 未送信キュー            │     │  + 未送信キュー            │
└───────────┬─────────────┘     └───────────┬─────────────┘
            │                               │
            │ POST/GET + X-Admin-Password   │
            └──────┬────────────────────────┘
                   ▼
        ┌────────────────────────────────────┐
        │ Vercel Function                    │
        │  /api/sync-itinerary               │
        │   GET  : 最新を取得                  │
        │   POST : 差分を反映                  │
        └────────────────┬───────────────────┘
                         │ Octokit + GITHUB_TOKEN
                         ▼
        ┌────────────────────────────────────┐
        │ GitHub Private Gist                │
        │  ID: ITINERARY_GIST_ID (新規 env)   │
        │  file: itinerary.json (全アイテム)   │
        └────────────────────────────────────┘
```

### 3 層の責務分担

1. **Source of Truth**: Private Gist — 全アイテム (削除済みトゥームストーン含む) を 1 ファイルで保持
2. **Backend Proxy**: Vercel Function `/api/sync-itinerary` — 認証チェックと Octokit 呼び出しに専念、ロジックは最小
3. **Client Cache**: localStorage — オフライン用キャッシュ + 未送信書き込みのキュー

### 再利用するもの

- `ADMIN_PASSWORD` 環境変数 (既存、Phase 6 と共有)
- `GITHUB_TOKEN` 環境変数 (既存、`gist` scope を追加する必要あり — D-027 設定時は `repo` のみだった可能性が高い、PAT 編集 or 再発行で対応)
- 既存 Phase 6 のパスワード入力 UI (sessionStorage `italia-gohan-chat-password`)

### 新規追加するもの

- Vercel 環境変数 `ITINERARY_GIST_ID` (1 回だけセット、初期セットアップスクリプトで取得)
- `/api/sync-itinerary` エンドポイント (GET + POST)
- 1 度きりの Gist 作成スクリプト

## データスキーマ

### ItineraryItem 拡張

```ts
interface ItineraryItem {
  id: string;
  type: ItineraryType;
  title: string;
  startAt: string;
  endAt?: string;
  location?: ItineraryLocation;
  details?: Record<string, string | number | boolean | null>;
  notes?: string;

  // 🆕 同期制御フィールド
  updatedAt: string;      // ISO 8601、最終更新タイムスタンプ
  deletedAt?: string;     // ISO 8601、論理削除のトゥームストーン
}
```

`updatedAt` は必須化。既存 localStorage 上のアイテム (Phase 7 でインポートした 13 件) は `updatedAt` を持たないため、マイグレーション時に `updatedAt = now()` を付与する。

`deletedAt` はトゥームストーン。削除アイテムは物理削除せず、`deletedAt` を立てて gist に残す。これにより、削除済みアイテムを別端末が「未知のアイテム」として再アップロードする事故を防ぐ。

### Gist ファイルフォーマット

ファイル名: `itinerary.json`

```json
{
  "version": 1,
  "items": [
    { "id": "flight-...", "type": "flight", ..., "updatedAt": "2026-06-18T10:00:00Z" },
    { "id": "hotel-...", "type": "hotel", ..., "updatedAt": "2026-06-18T10:05:00Z" },
    { "id": "old-...",   "deletedAt": "2026-06-18T11:00:00Z", "updatedAt": "2026-06-18T11:00:00Z" }
  ],
  "lastModifiedAt": "2026-06-18T11:00:00Z"
}
```

`version` でフォーマット進化に備える (将来 2 にバンプする可能性を想定)。

トゥームストーン (`deletedAt` 有) は必須フィールドを欠いてもよい (型違反扱いせず、サニタイザで `deletedAt` 検出時に許容)。

### 競合解決: Last-Write-Wins per item.id

- 同じ `id` のアイテムが両端末で編集される (両方未送信、片方先に同期) ケース:
  - サーバーは GET 時点の `updatedAt` を返す → 後発端末はマージ時に「自分の更新の方が新しいか」を判定
  - 自分の方が新しい → そのままキューに残してその後 POST
  - サーバーが新しい → 自端末の変更を破棄、サーバー値で上書き
- 削除と編集の競合 (PC で削除、スマホで編集) も同じルール
  - `deletedAt > 編集の updatedAt` なら削除が勝つ
  - 編集の `updatedAt > deletedAt` なら復活 (`deletedAt` をクリア)
- ms 単位の同時編集は同一ユーザーで稀。実用上問題なし

## API 設計

### `GET /api/sync-itinerary`

**認証**: `X-Admin-Password` ヘッダー必須

**レスポンス (200)**:
```json
{
  "version": 1,
  "items": [...],
  "serverTimestamp": "2026-06-18T..."
}
```

**フロー**:
1. パスワード検証
2. `ITINERARY_GIST_ID` 未設定 → `503` + セットアップ手順
3. Octokit `gists.get({ gist_id })` → ファイル `itinerary.json` の content を読む
4. JSON パース → そのまま返す

### `POST /api/sync-itinerary`

**認証**: `X-Admin-Password` ヘッダー必須

**リクエストボディ**:
```json
{
  "writes": [
    { "id": "...", "type": "...", ..., "updatedAt": "..." },
    { "id": "...", "deletedAt": "...", "updatedAt": "..." }
  ]
}
```

**フロー**:
1. パスワード検証
2. Gist 現在値取得 (GET と同じ)
3. `writes` を 1 件ずつマージ:
   - 既存に同 id 無し → 追加
   - 既存に同 id 有り、`writes[i].updatedAt > existing.updatedAt` → 上書き
   - それ以外 → スキップ (サーバー優先)
4. 各 item のスキーマバリデーション (type / title / startAt のいずれか欠落でスキップ、ただし tombstone は許容)
5. `lastModifiedAt = now()` 更新
6. Octokit `gists.update({ gist_id, files })` で書き戻し
7. 最新状態を返す (クライアントが反映確認に使う)

**レスポンス (200)**:
```json
{
  "version": 1,
  "items": [...],  /* 最新フル状態 */
  "applied": ["item-id-1", "item-id-2"],  /* どれを反映したか */
  "skipped": [{"id": "item-id-3", "reason": "stale"}],
  "serverTimestamp": "2026-06-18T..."
}
```

### エラー時

| ステータス | 意味 | クライアント挙動 |
|---|---|---|
| 401 | パスワード無効 | sessionStorage クリア、認証 UI 表示 |
| 503 | `ITINERARY_GIST_ID` 未設定 | セットアップ手順カードを表示 |
| 500 | Octokit / GitHub 失敗 | キューに残してリトライ、エラーバナー表示 |
| 5xx 全般 | ネットワーク失敗 | 同上 |

## クライアント動作

### localStorage キー (3 つ)

| キー | 内容 | サイズ目安 |
|---|---|---|
| `italia-gohan-itinerary-private` | 全アイテムのキャッシュ (tombstones 除く、UI 描画用) | ~10KB |
| `italia-gohan-itinerary-queue` | 未送信書き込み `Record<itemId, ItineraryItem>` | ~5KB |
| `italia-gohan-itinerary-last-sync` | ISO timestamp string | ~30B |

既存 D-031 のキー `italia-gohan-itinerary-private` を継続利用。後方互換。

### ページロード時の流れ

1. `localStorage.italia-gohan-itinerary-private` から即時描画 (FCP 速い、オフライン時もこれだけで動く)
2. `navigator.onLine && getPassword()` なら裏で `GET /api/sync-itinerary` 発火
3. サーバーレスポンスを受信:
   - tombstone (deletedAt 有) は描画対象から除外、キャッシュからも削除
   - 残りでキャッシュ全置換 (ただしキュー内の未送信書き込みが新しいなら保持)
4. 再描画 (差分 DOM 更新)
5. キューが空でなければドレイン (各書き込みを順次 POST)

### 編集時の流れ

1. フォーム送信時に `updatedAt = new Date().toISOString()` を付与
2. キャッシュとキュー両方に書き込み (同期処理ではなく Promise.all 並列)
3. UI 即時反映
4. オンラインなら `POST /api/sync-itinerary` を裏で発火
5. 成功でキューから当該 id を除去 + `last-sync` 更新
6. 失敗ならキューに残す (リトライは次回のオンライン復帰時 or 手動ボタン)

### 削除時の流れ

1. アイテムに `deletedAt = now()`, `updatedAt = now()` 立てる
2. キューに tombstone として push
3. UI から非表示 (キャッシュからも削除)
4. オンラインなら POST、サーバーで tombstone 保存
5. 失敗時の挙動は編集と同じ

### オフライン検知と UI

```
ヘッダー右上のステータス表示:
  オンライン + キュー空: "✓ 同期済み 14:23"
  オンライン + キュー有: "🔄 同期中 (3 件)"
  オフライン + キュー空: "📴 オフライン"
  オフライン + キュー有: "📴 オフライン (3 件保留)"
```

実装:
- `window.addEventListener('online', () => drainQueue())`
- `window.addEventListener('offline', () => updateStatusBadge())`
- 手動同期ボタン 🔄 を nav に配置、押下で `getLatest()` + `drainQueue()` を順次実行

### キューのドレインロジック

```ts
async function drainQueue() {
  if (!navigator.onLine) return;
  const queue = loadQueue();
  if (Object.keys(queue).length === 0) return;
  const writes = Object.values(queue);
  const res = await fetch('/api/sync-itinerary', {
    method: 'POST',
    body: JSON.stringify({ writes }),
    headers: { 'X-Admin-Password': getPassword() ?? '' },
  });
  if (!res.ok) {
    // リトライは次回オンライン復帰時
    return;
  }
  const data = await res.json();
  // applied に含まれている item は queue から除去
  // skipped (stale) も queue から除去 (サーバー優先で諦め)
  for (const id of data.applied) removeFromQueue(id);
  for (const skip of data.skipped) removeFromQueue(skip.id);
  // サーバー最新状態でキャッシュ全置換
  saveCache(data.items.filter((x) => !x.deletedAt));
  setLastSync(data.serverTimestamp);
}
```

## セットアップとマイグレーション

### 初期セットアップ (1 回限り)

`scripts/setup-itinerary-gist.mjs`:

```js
import { Octokit } from '@octokit/rest';
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('GITHUB_TOKEN required');
const gh = new Octokit({ auth: token });
const initial = JSON.stringify({ version: 1, items: [], lastModifiedAt: new Date().toISOString() }, null, 2);
const res = await gh.gists.create({
  description: 'italia-gohan-map itinerary (private)',
  public: false,
  files: { 'itinerary.json': { content: initial } },
});
console.log(`Gist ID: ${res.data.id}`);
console.log(`Set in Vercel:`);
console.log(`  vercel env add ITINERARY_GIST_ID production`);
console.log(`  (paste the ID above when prompted)`);
console.log(`Or via Vercel dashboard: Settings → Environment Variables`);
```

実行手順:
1. PAT に `gist` scope を追加: https://github.com/settings/tokens の既存 PAT 編集 (Classic) or 再発行 (Fine-grained)
2. `.env.local` の `GITHUB_TOKEN` を新 token に更新 (Vercel 側も忘れず)
3. `node scripts/setup-itinerary-gist.mjs` 実行
4. 出力された Gist ID を Vercel `ITINERARY_GIST_ID` env var に設定
5. Vercel 再デプロイ

### 既存 localStorage データの移行

PC ブラウザに 13 件 (D-031 のスニペットでインポートした旅程) が `updatedAt` なしで存在する。

マイグレーションタイミング: ページロード時、cache を読んだ直後
```ts
function migrateCache() {
  const cache = loadCache();
  let changed = false;
  for (const item of cache) {
    if (!item.updatedAt) {
      item.updatedAt = new Date().toISOString();
      changed = true;
      enqueueWrite(item);  // 次回 sync で gist へ push
    }
  }
  if (changed) saveCache(cache);
}
```

最初のオンライン状態 + 認証成功時に、これらが gist に push される。スマホは次の GET でそれらを取得。

### スマホ初回利用フロー

1. スマホで `https://italia-gohan-map.vercel.app/itinerary` を開く
2. 「🔒 同期 (パスワード必要)」ボタンが表示される
3. タップ → パスワード入力
4. パスワード保存 → 自動で GET → gist の現在値を取得 → 描画
5. 以降は通常通り、編集すると POST、PC と同期

スニペット貼り付けは不要 (gist 経由で自動的に伝播)。

## UI 変更点

### `ItineraryForm.astro`

- ラベル変更: 「🔒 プライベート保存 (この端末のみ)」 → 「🔒 プライベート (Gist 同期)」
- 説明文も更新: 「GitHub Private Gist に保存、URL を知らない人は閲覧不可」

### 旅程ページヘッダー

```
[旅程] [N アイテム] [🔄 同期] [✓ 同期済み 14:23 | 📴 オフライン (3 件)]
```

- 🔄 ボタン: 手動同期トリガー
- ステータステキスト: 動的更新

### 既存 UI との互換

- 既存の編集/削除ボタン、フォーム、タイムライン表示はそのまま
- 「プライベート」と「パブリック」の二択は維持 (パブリックは Phase 6 と同様 `data/itinerary.json` への commit、現状ユーザーは使わないがコード残置)

## ファイル変更一覧

### 新規

- `api/sync-itinerary.ts` (Vercel function, GET + POST)
- `src/lib/github-gist.ts` (Octokit gist 操作ラッパー、`fetchGist()` `updateGist()`)
- `scripts/setup-itinerary-gist.mjs` (1 度きりのセットアップ)
- `docs/superpowers/specs/2026-06-18-itinerary-sync-design.md` (本書)

### 改変

- `src/types/itinerary.ts` (`updatedAt`, `deletedAt` を追加)
- `src/data/itinerary-loader.ts` (新フィールドのサニタイズ)
- `src/pages/itinerary.astro` (sync ロジック、キュー、オフライン検知、ステータス表示)
- `src/components/ItineraryForm.astro` (ラベル変更、`updatedAt` セット)
- `src/styles/global.css` (同期ステータスバッジ、オフライン表示)
- `docs/plan/decisions-log.md` (D-031 に同期設計を追記)
- `.env.local.example` (`ITINERARY_GIST_ID` 例を追加、もし存在すれば)

### 削除

- なし (既存の Phase 6/7 ファイルは温存)

## エラー処理とエッジケース

| ケース | 動作 |
|---|---|
| Gist が削除された | API が 404 を返す → クライアントに「Gist が見つからない、再セットアップ要」表示 |
| Gist が 1MB を超過 | Octokit が 422 → クライアントに「アイテム数削減 or 分割要」表示 |
| 同時に同じアイテムを編集 (両端末オンライン) | サーバー側でタイムスタンプ比較、後発の片方が `skipped` で返る → ユーザーには「サーバー値で上書きしました」通知 |
| パスワード変更 (admin 側) | 全端末で 401 → 認証 UI 再表示 |
| キュー内のアイテムがすでに gist に有 (重複 POST) | サーバーが `updatedAt` で skip → クライアントはキューから除去 |
| 機内 (オフライン) で 10 件編集 → 着陸後オンライン | `online` イベントで自動ドレイン、10 件まとめて POST 1 回 |

## テスト戦略

### 自動テスト (将来導入時)

- 単体: マージロジック (last-write-wins、tombstone、updatedAt 比較)
- 統合: ローカル Vercel dev + テスト用 gist で round-trip

### 手動テスト (本実装後)

1. **基本機能**: PC で 1 件追加 → 同期 → スマホで GET → 表示確認
2. **双方向編集**: PC でタイトル変更、スマホでメモ追加、両方同期 → マージ確認
3. **削除**: PC で削除 → スマホでも消える
4. **オフライン編集**: スマホを機内モード、5 件編集 → モード解除 → 自動同期
5. **競合**: 両端末同時編集 (同一アイテム) → last-write-wins 確認
6. **マイグレーション**: 既存 13 件が初回同期で gist に push される

## 実装スコープ外 (将来検討)

- 暗号化 (Q2 案 C) — 必要に応じて後付け可能、E2EE で追加
- リアルタイム同期 (WebSocket / SSE) — 現状の手動 + 自動再同期で十分
- 複数ユーザー対応 — 単一管理者前提を維持
- 衝突解決の UI (両方の値を見せて選ばせる) — last-write-wins で実用上不要

## 参考

- D-027 (Phase 6 在チャット機能): Octokit + GITHUB_TOKEN パターンの先行例
- D-031 (Phase 7 旅程管理): 本拡張のベース、既存 UI とコンポーネントを温存
- [GitHub Gist API](https://docs.github.com/en/rest/gists) — Octokit が薄ラップ
- [Vercel Storage 比較](https://vercel.com/docs/storage) — Vercel KV / Blob / Postgres は採用せず
