# 旅行 ToDo リスト機能 — 設計書

- **作成日**: 2026-06-23
- **対象**: italia-gohan-map / Phase 8 (D-031 の sync インフラを再利用)
- **目的**: 旅行前準備 (ホテル決定、コロッセオ予約、レストラン予約、両替など) のタスクを整理・追跡し、PC とスマホで同期可能にする

## ユーザー意思決定 (本セッションの brainstorming で確定)

| 質問 | 採用 | 却下案 |
|---|---|---|
| Q1: 既存データとの連携 | **A. 完全に独立した単純なタスクリスト** | B. 既存エンティティに紐付け / C. 旅程アイテムの "未確定ステータス" |
| Q2: 保存先 | **A. 既存 Private Gist の別ファイル `todos.json`** | B. localStorage のみ / C. 新規 Gist |
| Q3: UI 配置 | **A. 新規ページ `/todo`** | B. 旅程タブ / C. ホームページサイドバー |
| Q4: 分類 | **C + A. 都市別グルーピング + フラットリスト (フィルタチップ)** | B. 固定カテゴリ / D. 自由タグ |

## アーキテクチャ

```
┌─────────────────────────┐     ┌─────────────────────────┐
│  PC ブラウザ              │     │  スマホ ブラウザ           │
│  /itinerary  /todo       │     │  /itinerary  /todo       │
│  localStorage cache      │     │  localStorage cache      │
│  + 未送信キュー            │     │  + 未送信キュー            │
└───────────┬─────────────┘     └───────────┬─────────────┘
            │                               │
            └──────┬────────────────────────┘
                   ▼
        ┌────────────────────────────────────┐
        │ Vercel Functions                   │
        │  /api/sync-itinerary (既存)         │
        │  /api/sync-todos (新規)             │
        └────────────────┬───────────────────┘
                         │ Octokit + GITHUB_TOKEN
                         ▼
        ┌────────────────────────────────────┐
        │ Private Gist (既存 + ファイル追加)    │
        │  ID: ITINERARY_GIST_ID (既存)       │
        │  ├── itinerary.json (既存)          │
        │  └── todos.json (新規)              │
        └────────────────────────────────────┘
```

### 既存インフラから再利用

- 既存 Private Gist (新規 Gist 作成不要、setup スクリプト再実行不要)
- 環境変数: `ADMIN_PASSWORD` / `GITHUB_TOKEN` / `ITINERARY_GIST_ID` (追加なし)
- マージアルゴリズム: `src/lib/itinerary-merge.ts` の last-write-wins per id パターン
- UI パターン: フィルタチップ、同期ステータスバッジ、`X-Admin-Password` 認証、`sessionStorage` 共有
- localStorage キー命名規則: `italia-gohan-<resource>-<purpose>`
- オフライン対応: `online`/`offline` イベントによるキュードレイン

### 新規追加

- API エンドポイント: `/api/sync-todos`
- ページ: `/todo` (ヘッダーにリンク追加)
- 型: `Todo`、純関数 `mergeTodos`、`fetchTodosGist` / `updateTodosGist`
- コンポーネント: `TodoList.astro`、`TodoForm.astro` (編集モーダル)

## データモデル

### Todo 型

```ts
// src/types/todo.ts

export type TodoCity = 'Rome' | 'Florence' | 'Palermo' | 'Taormina' | 'Sicily' | '全般';

export const TODO_CITIES: ReadonlyArray<{ value: TodoCity; label: string }> = [
  { value: 'Rome', label: 'ローマ' },
  { value: 'Florence', label: 'フィレンツェ' },
  { value: 'Palermo', label: 'パレルモ' },
  { value: 'Taormina', label: 'タオルミーナ' },
  { value: 'Sicily', label: 'シチリア' },
  { value: '全般', label: '全般' },
];

export interface Todo {
  id: string;
  title: string;          // 必須
  done: boolean;          // デフォルト false
  city?: TodoCity;        // 任意、未指定 = "全般" として扱う
  notes?: string;         // 任意 (補足、予約 URL、参考リンク等)
  deadline?: string;      // 任意、ISO 日付 (時刻なし、例: "2026-07-15")
  createdAt: string;      // ISO 8601
  updatedAt: string;      // ISO 8601 — 同期競合解決に使用
  deletedAt?: string;     // ISO 8601 — tombstone (論理削除)
}
```

`id`: クライアント側で `todo-<8桁ランダム hex>` で生成、`crypto.getRandomValues` を使用。

`updatedAt`: 必須。チェックボックス toggle、編集、削除でいずれも `new Date().toISOString()` を再設定。

`deletedAt`: tombstone マーカー。物理削除せず Gist に残す (旅程と同じ方式)。SSR からは除外。

### Gist ファイルフォーマット (`todos.json`)

```json
{
  "version": 1,
  "todos": [
    {
      "id": "todo-a1b2c3d4",
      "title": "コロッセオ予約",
      "done": false,
      "city": "Rome",
      "deadline": "2026-08-15",
      "createdAt": "2026-06-23T10:00:00Z",
      "updatedAt": "2026-06-23T10:00:00Z"
    }
  ],
  "lastModifiedAt": "2026-06-23T10:00:00Z"
}
```

`itinerary.json` と同じ Gist (`ITINERARY_GIST_ID = b1d5f6ff...`) 内に並ぶ別ファイル。Octokit の `gists.update` は `files: { 'filename.json': { content: '...' } }` 形式を受け取るので、両ファイルを同時または個別に更新可能。

## 競合解決

旅程と同じ Last-Write-Wins per `id`、純関数 `mergeTodos`:

```ts
// src/lib/todos-merge.ts

import type { Todo } from '../types/todo.js';

export interface MergeTodosResult {
  next: Todo[];
  applied: string[];
  skipped: { id: string; reason: string }[];
}

export function mergeTodos(server: Todo[], writes: Todo[]): MergeTodosResult {
  // 実装は itinerary-merge.ts と同形 (id ベースの Map、updatedAt の strict > 比較)
  // 同タイムスタンプは stale 扱い (server 優先)
}
```

旅程の merge との共通点が多いが、**別ファイルとする**:
- Todo 固有の将来ルール追加余地 (例: completed タスクの隠蔽ロジック等)
- 独立テスト可能 (`scripts/test-todos-merge.mjs`)
- DRY 違反は局所的、可読性 > 抽象化

## API 設計

### `/api/sync-todos` (新規ファイル `api/sync-todos.ts`)

既存 `api/sync-itinerary.ts` とほぼ同形、`items` → `todos` に置換。

**GET**:
- 認証: `X-Admin-Password` ヘッダー
- 503 if `ITINERARY_GIST_ID` または `GITHUB_TOKEN` 未設定
- レスポンス: `{ version: 1, todos: Todo[], serverTimestamp: string }`

**POST**:
- 認証: 同上
- リクエスト: `{ writes: Todo[] }`
- フロー: `fetchTodosGist` → `mergeTodos` → `updateTodosGist`
- レスポンス: `{ version, todos, applied, skipped, rejected, serverTimestamp }`
- 405: 他メソッド
- 500: Octokit 失敗等

### `src/lib/github-gist.ts` の拡張

既存ファイルに 2 つの関数を追加 (別ファイル化せず、責務的に同じ Gist 操作なので同居):

```ts
const TODOS_FILE_NAME = 'todos.json';

export interface TodosGistContent {
  version: 1;
  todos: Todo[];
  lastModifiedAt: string;
}

export async function fetchTodosGist(): Promise<TodosGistContent> {
  // 既存 fetchItineraryGist と同形、ファイル名のみ変更
}

export async function updateTodosGist(todos: Todo[]): Promise<TodosGistContent> {
  // 既存 updateItineraryGist と同形、ファイル名のみ変更
}
```

## クライアント動作

### localStorage キー (3 つ)

| キー | 内容 |
|---|---|
| `italia-gohan-todo-cache` | 全 ToDo キャッシュ (tombstone 除く、UI 描画用) |
| `italia-gohan-todo-queue` | 未送信書き込み (`Record<todoId, Todo>`) |
| `italia-gohan-todo-last-sync` | 最終同期成功時刻 (ISO string) |

`sessionStorage`: 既存 `italia-gohan-chat-password` を再利用。

### ページロード時の流れ

1. localStorage キャッシュから即時描画 (FCP 速い、オフライン対応)
2. オンライン & パスワードあれば `GET /api/sync-todos` 発火
3. レスポンスを反映 (tombstone 除外、キュー内の新しい書き込みは保持)
4. 再描画
5. キューが空でなければドレイン (POST)

### クイック追加 (即時保存)

ページ上部に常設 (折りたたみなし):
```
[+ 新規 ToDo 入力欄] [都市選択 ▾ "全般"] [追加ボタン]
```

- 「タイトル」「都市」のみ。`notes` `deadline` は無し (詳細は ✎ で追加)
- Enter キーまたは追加ボタンで作成
- `done: false`、`updatedAt = createdAt = now()` で即キャッシュ + キュー
- UI 即時反映、フォーム入力欄クリア、フォーカス維持

### チェックボックス操作

- `<input type="checkbox">` クリックで `done` toggle
- `updatedAt = now()` 再設定、キャッシュ + キュー更新
- 同期キュードレイン非同期発火 (`void drainTodosQueue()`)
- 完了済タスクは透明度を下げ、リスト下部へ移動 (CSS で `.done` 状態)

### 編集 (✎ モーダル)

旅程の `ItineraryForm.astro` と同形のモーダル、フィールド少なめ:
- タイトル
- 都市 (チップ選択)
- 期限 (`<input type="date">`)
- メモ (textarea)

OK で `updatedAt` 再設定、キャッシュ + キュー、同期発火。

### 削除 (🗑 → tombstone)

- 確認ダイアログ → `deletedAt = updatedAt = now()` セット
- キューに tombstone 追加、UI から即非表示
- 同期発火

### オンライン/オフライン

- `window.online`/`offline` イベント listener
- ステータスバッジ (旅程と同じ 4 状態: `idle` / `ok` / `syncing` / `offline`)
- 手動同期ボタン (🔄): `getLatest` + `drainQueue` 順次実行

### 並び替え (固定)

1. **未完了** 上、**完了済** 下
2. 未完了同士の順序:
   - 期限超過 (今日より前)
   - 期限が近い順 (今日から N 日先)
   - 期限なし
   - 新着順 (`createdAt` desc)
3. 完了同士: `updatedAt` desc (最近完了したもの上)

### フィルタ

- **都市チップ**: `すべて | ローマ | フィレンツェ | パレルモ | タオルミーナ | シチリア | 全般`
  - URL `?city=...` でパラメータ化
- **完了表示トグル**: `[☑ 未完了のみ]` (デフォルト ON)
  - チェック OFF にすると完了済タスクも表示
  - URL `?show=all` でパラメータ化

### 視覚的緊急度 (期限)

- 期限超過: 🔴 `⚠ N日超過` 赤バッジ
- 7 日以内: 🟠 `⏰ あとN日` オレンジバッジ
- 8〜30 日: 通常 `📅 M月D日`
- 期限なし: マーク無し

## UI コンポーネント分割

### `src/pages/todo.astro`

エントリポイント。

- `<Layout>` に旅程と同じヘッダー構造を入れる (`🗺 マップ` / `📅 旅程` 既存リンク + 自己)
- `<TodoList items={todos} />` に SSR データを渡す (初期描画)
- `<TodoForm />` 編集用モーダル
- クライアント `<script>` に sync ロジック (旅程と同形)

### `src/components/TodoList.astro`

タイムライン本体:
- クイック追加フォーム (上部固定)
- フィルタチップ
- 都市別グルーピング → 各 ToDo カード
- 空状態メッセージ

### `src/components/TodoForm.astro`

編集モーダル:
- パスワード認証 (sessionStorage 共有)
- フィールド: タイトル、都市、期限、メモ
- 保存 / キャンセル

### スタイル

`src/styles/global.css` に追記 (旅程 CSS のすぐ後ろに新セクション):
- `.todo-quick-add`
- `.todo-card` (チェックボックス + タイトル + 期限バッジ + 編集/削除)
- `.todo-card.done` (透明度低下)
- `.todo-deadline-badge[data-urgency="overdue|soon|normal"]`
- `.todo-city-group`

## ファイル変更一覧

### 新規

- `src/types/todo.ts`
- `src/data/todo-loader.ts` (SSR loader、tombstone 除外、`data/todos.json` をフォールバック)
- `src/lib/todos-merge.ts`
- `api/sync-todos.ts`
- `src/components/TodoList.astro`
- `src/components/TodoForm.astro`
- `src/pages/todo.astro`
- `data/todos.json` (空 `[]`、SSR 用フォールバック、source of truth は Gist)
- `scripts/test-todos-merge.mjs` (merge テスト)

### 改変

- `src/lib/github-gist.ts` (`fetchTodosGist` / `updateTodosGist` 追加、`TodosGistContent` 型追加)
- `src/pages/index.astro` (ヘッダーに `✓ ToDo` リンク追加)
- `src/pages/itinerary.astro` (ヘッダーに `✓ ToDo` リンク追加)
- `src/styles/global.css` (todo セクション追加、~150 行)
- `docs/plan/decisions-log.md` (D-032: Phase 8 ToDo 機能を追記)

### 削除

なし。

## エラー処理 / エッジケース

| ケース | 動作 |
|---|---|
| Gist の `todos.json` ファイルが存在しない (初回) | `fetchTodosGist` が空 `{version:1, todos:[]}` を返す (既存 `fetchItineraryGist` と同じパターン) |
| 重複 id の書き込み (バッチ内) | 既存 merge と同じ「最後勝ち」(`Map.set` で上書き) |
| 期限の不正な日付文字列 | `Date(deadline)` が `Invalid Date` → 期限なし扱い (`deadline = undefined` として描画) |
| 期限超過後に再開 | 表示は赤バッジで継続、操作は通常通り (期限変更/完了) |
| 同期中の二重クリック | 既存 `draining` フラグパターンで防止 |
| Gist 1MB 制限 | 旅程と合算で考慮、ToDo は数十件規模で問題なし |

## セキュリティ / プライバシー

- 既存方針継承: ToDo データは Private Gist 内 (URL を知らない人は閲覧不可)
- `ADMIN_PASSWORD` で保護
- 機密度の高いフィールド (予約番号等) は持たない設計 (notes に書く想定、必要なら旅程の機密フィールドに記載)
- 公開 repo (`data/todos.json`) は **空配列のままコミット**、実データは Gist 経由

## スコープ外 (将来検討)

- **ToDo 完了 → 旅程アイテム自動生成**: ToDo "コロッセオ予約" が done になったら旅程の attraction を作成。便利だが手動でも 1 分。Q1 で却下した B/C 寄りなので除外
- **期限通知/リマインダー**: ブラウザ通知 API は要 service worker、コスト > 価値
- **一括操作**: 完了済全削除等。タスク数少ないので不要
- **タグ自由付与**: 都市分類で十分、自由タグはメンテ手間
- **並び替えカスタマイズ**: 固定ソートで十分
- **テンプレ ToDo**: 「予約系」「持ち物」プリセット。将来検討
- **テスト自動化**: `mergeTodos` の純関数テストは追加するが、E2E は手動 smoke test

## デプロイ手順

新規環境変数なし、新規 Gist 作成なし。

1. push → Vercel 自動デプロイ
2. デプロイ完了後、`/todo` ページにアクセス
3. パスワード認証 → 初回はゴ Gist の `todos.json` が無いので空配列で開始
4. ToDo を 1 件追加 → Gist `todos.json` 自動作成
5. PC ↔ スマホで同期確認

## テスト戦略

### 自動 (純関数)

- `scripts/test-todos-merge.mjs` で `mergeTodos` の動作テスト
- 既存 `scripts/test-itinerary-merge.mjs` と同様、7 ケース最低 (新規追加、上書き、stale、tombstone、invalid-timestamp、mixed batch、equal-timestamp)

### 手動 (E2E)

1. **基本機能**: PC で 1 件追加 → 同期 → スマホで GET → 表示確認
2. **チェック toggle**: PC でチェック → スマホで反映確認
3. **編集**: タイトル変更が両端末で反映
4. **削除**: tombstone 伝播
5. **フィルタ**: 都市別、未完了のみ、両方適用
6. **期限視覚化**: 過去日付/今日+3日/今日+30日/期限なしの 4 ケース
7. **オフライン編集**: 機内モードで 3 件編集 → 復帰時に自動同期

## 参考

- D-027 (Phase 6 在チャット機能): `/api/save` + Octokit パターン
- D-031 (Phase 7 旅程管理 + sync 拡張): `/api/sync-itinerary` パターン、本実装の直接の先行例
- 設計書: `docs/superpowers/specs/2026-06-18-itinerary-sync-design.md`
- 実装プラン: `docs/superpowers/plans/2026-06-18-itinerary-sync.md`
