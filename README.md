# イタリアご飯マップ

イタリア旅行で出会った（または行きたい）レストランを、地域・ジャンル別に整理して保存・共有する Web サイト。

## プロジェクトのゴール

- 自分の旅行メモとして使える
- URL を共有すれば他の人も見られる（検索エンジンには非公開）
- 「ローマのトラットリア」「シチリアのピッツェリア」のように、**地域 × ジャンル** で絞り込める
- 地図上でピン表示

## マルチエージェント開発体制

7 つのエージェントが 2 つのチームに分かれて運用される。

### コア開発チーム（4 エージェント）

| エージェント | 役割 | 成果物の置き場 |
|---|---|---|
| 開発計画管理エージェント | 進捗・意思決定・未解決事項の一元管理（横断） | [docs/plan/](docs/plan/) |
| 要件定義エージェント | サイトの目的・機能・データ構造を定義 | [docs/requirements/](docs/requirements/) と [docs/design/](docs/design/) |
| レビューエージェント | 要件と設計の妥当性をチェック・指摘 | [docs/reviews/](docs/reviews/) |
| 実装エージェント | 承認された要件・設計を元にコードを書く | [src/](src/) と [data/](data/) |

### キュレーションサブチーム（3 エージェント、D-020）

| エージェント | 役割 | 成果物の置き場 |
|---|---|---|
| キュレーション計画エージェント | リサーチブリーフ作成（ターゲット・件数・ソース順） | [docs/curation/curation-log.md](docs/curation/curation-log.md) |
| 店舗リサーチエージェント | 信頼ソース由来の候補発見 + AI 評価メタ付与 | 同上 |
| キュレーション統合エージェント | 重複検証 + Sheets 貼り付け用 TSV 整形 + 確認事項提示 | 同上 |

各エージェントの詳細な指示書は [agents/](agents/) に格納。連携フローは [workflow.md](workflow.md) を参照。

## 技術スタック

- **Astro 4**（静的サイト生成）
- **Leaflet + OpenStreetMap**（地図）
- **TypeScript**
- **`data/restaurants.json`** をデータソースとして git 管理（D-024 以降。Google Sheets はオプション）
- **Vercel**（ホスティング、git push で自動デプロイ）

## セットアップ

### 必須

- Node.js **18 以上**（推奨: LTS）
- パッケージマネージャ: pnpm 推奨（npm / yarn でも可）

Windows での Node.js インストール:

```powershell
winget install OpenJS.NodeJS.LTS
# または公式サイトから: https://nodejs.org/
```

pnpm のインストール（任意）:

```powershell
npm install -g pnpm
```

### 初回セットアップ

```powershell
pnpm install
# または: npm install
```

## ローカル起動

```powershell
pnpm dev
# または: npm run dev
```

ブラウザで `http://localhost:4321` を開く。

### 通常の運用（D-024 以降）

`pnpm dev` で `data/restaurants.json` を読んでサイトをレンダリング。データを追加・編集するには:

1. `data/restaurants.json` を直接編集（VSCode / GitHub Mobile / 任意エディタ）
2. `git add . && git commit && git push`
3. Vercel が自動でビルド・デプロイ
4. 数分後にサイト反映

新規店舗の追加は AI リサーチでも可能（[キュレーションサブチーム](agents/curation-planning-agent.md) を参照）。

### Google Sheets と連携する場合（オプション、現在は使用しない）

`SHEETS_ID` 環境変数を Vercel に設定するとシートをデータソースとして使う。詳細は [DEPLOY.md](DEPLOY.md) の Sheets セクション。

シートからの取得に失敗した場合は `data/restaurants.json` にフォールバック。

## ビルド

```powershell
pnpm build
```

出力は `dist/` に生成される。

## デプロイ（Vercel）

1. [Vercel](https://vercel.com/) で GitHub リポジトリを連携
2. 環境変数に `SHEETS_ID` と（必要なら）`SHEET_NAME` を設定
3. デプロイ
4. Vercel ダッシュボードから **Deploy Hook URL** を発行し、GitHub Actions の Secrets に `VERCEL_DEPLOY_HOOK_URL` として登録
5. `.github/workflows/rebuild.yml`（実装エージェントが追加予定）で定期再ビルドが動く

## ディレクトリ構成

```
.
├── agents/         各エージェントの役割定義（コア 4 + キュレーション 3）
├── docs/           エージェント間で受け渡す成果物
│   ├── requirements/  要件
│   ├── design/        設計
│   ├── reviews/       レビュー指摘
│   ├── plan/          計画・意思決定・未解決事項
│   ├── curation/      キュレーションラウンド台帳
│   ├── curation-guide.md       信頼ソース一覧
│   └── ai-prompt-template.md   Claude 用評価プロンプト
├── public/         静的ファイル（robots.txt, favicon）
├── src/
│   ├── components/    Astro コンポーネント
│   ├── data/          Sheets 取得 + フォールバック
│   ├── layouts/       共通レイアウト
│   ├── pages/         ページ（index.astro）
│   ├── styles/        global.css
│   └── types/         TypeScript 型
├── data/           店舗データ（サンプル / フォールバック）
├── .github/workflows/rebuild.yml  GitHub Actions cron + 手動トリガー
├── astro.config.mjs
├── tsconfig.json
└── package.json
```

## 主要機能

- 店舗カード一覧
- 都市・ジャンル絞り込み（複数選択 OR、グループ間 AND）
- 訪問済み / 未訪問 / すべて の排他 3 状態トグル
- 地図ピン表示（訪問済みは緑、未訪問は赤、形状も区別）
- 店舗詳細モーダル
- フィルタ状態を URL に同期
- **現在地表示**（F-10）: 地図タブの「📍 現在地」ボタンで Geolocation API による現在地表示。位置情報はクライアントのメモリのみで保持し、保存・送信しない
- **AI キュレーション**: WebSearch + WebFetch でリサーチ → AI で評価 → `data/restaurants.json` に追記 → git push で反映

> 「+ 追加」リンクは D-024 で外部 Sheets を切り離したため非表示（旧運用の参照用に DOM は残っている）

## 既知の制限事項

- 写真は MVP では非対応（要件で明示的に除外）
- ユーザー認証なし（編集はシート所有者のみ）
- フリーワード検索は未実装（推奨機能として候補）
- 多言語対応は日本語のみ

## ライセンス

プライベートプロジェクト。
