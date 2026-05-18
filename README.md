# イタリアご飯マップ

イタリア旅行で出会った（または行きたい）レストランを、地域・ジャンル別に整理して保存・共有する Web サイト。

## プロジェクトのゴール

- 自分の旅行メモとして使える
- URL を共有すれば他の人も見られる（検索エンジンには非公開）
- 「ローマのトラットリア」「シチリアのピッツェリア」のように、**地域 × ジャンル** で絞り込める
- 地図上でピン表示

## マルチエージェント開発体制

このプロジェクトは 4 つのエージェントが連携して進める。3 つの専門エージェントが順番に作業を引き継ぎ、開発計画管理エージェントが横断的に進捗と意思決定を管理する。

| エージェント | 役割 | 成果物の置き場 |
|---|---|---|
| 開発計画管理エージェント | 進捗・意思決定・未解決事項の一元管理（横断） | [docs/plan/](docs/plan/) |
| 要件定義エージェント | サイトの目的・機能・データ構造を定義 | [docs/requirements/](docs/requirements/) と [docs/design/](docs/design/) |
| レビューエージェント | 要件と設計の妥当性をチェック・指摘 | [docs/reviews/](docs/reviews/) |
| 実装エージェント | 承認された要件・設計を元にコードを書く | [src/](src/) と [data/](data/) |

各エージェントの詳細な指示書は [agents/](agents/) に格納。連携フローは [workflow.md](workflow.md) を参照。

## 技術スタック

- **Astro 4**（静的サイト生成）
- **Leaflet + OpenStreetMap**（地図）
- **TypeScript**
- **Google Sheets**（データソース、ビルド時に `gviz/tq` で取得）
- **Vercel**（ホスティング）

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

### Google Sheets を使わずローカルデータで起動する場合

そのまま `pnpm dev` で OK。`data/restaurants.json` がデータソースになる。

### Google Sheets と連携する場合

1. シートを「リンクを知っている全員が閲覧可能」に設定
2. プロジェクトルートに `.env.local` を作成（`.env.local.example` を参考）
   ```
   SHEETS_ID=<シート URL の /d/ と /edit の間の文字列>
   SHEET_NAME=restaurants
   ```
3. シートの 1 行目に以下のヘッダー（順不同）を入れる:
   `name, city, area, genre, priceRange, lat, lng, address, visited, visitDate, rating, comment, url, tags`
4. `pnpm dev` を再起動 → ビルド時にシートから取得される

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
├── agents/         各エージェントの役割定義
├── docs/           エージェント間で受け渡す成果物
│   ├── requirements/  要件
│   ├── design/        設計
│   ├── reviews/       レビュー指摘
│   └── plan/          計画・意思決定・未解決事項
├── public/         静的ファイル（robots.txt, favicon）
├── src/
│   ├── components/    Astro コンポーネント
│   ├── data/          Sheets 取得 + フォールバック
│   ├── layouts/       共通レイアウト
│   ├── pages/         ページ（index.astro）
│   ├── styles/        global.css
│   └── types/         TypeScript 型
├── data/           店舗データ（サンプル / フォールバック）
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
- 「+ 追加」リンクで Google Sheets を別タブで開く
- **現在地表示**（F-10）: 地図タブの「📍 現在地」ボタンで Geolocation API による現在地表示。位置情報はクライアントのメモリのみで保持し、保存・送信しない

## 既知の制限事項

- 写真は MVP では非対応（要件で明示的に除外）
- ユーザー認証なし（編集はシート所有者のみ）
- フリーワード検索は未実装（推奨機能として候補）
- 多言語対応は日本語のみ

## ライセンス

プライベートプロジェクト。
