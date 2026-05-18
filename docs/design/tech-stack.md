# 技術スタック

## 選定の前提

要件（[01-overview](../requirements/01-overview.md), [04-non-functional-req](../requirements/04-non-functional-req.md)）から導かれる主要な制約:

1. 完全無料運用
2. モバイル優先・初回読み込み 2 秒以内
3. **公開サイト**（認証不要）
4. データソースは **外部サービス**（旅先のスマホからも編集したい）
5. 地図ピン表示が MVP に含まれる
6. 写真なし・テキスト中心

## 推奨構成

| レイヤー | 採用技術 | 代替案 |
|---|---|---|
| フロントエンド | **Astro**（静的サイト生成 + アイランドアーキテクチャ） | Next.js (SSG), Vite + React |
| 地図 | **Leaflet + OpenStreetMap** | Mapbox GL JS |
| データソース | **`data/restaurants.json`**（git 管理）← D-024 で Sheets から変更 | Google Sheets（オプション、SHEETS_ID 設定時のみ）|
| データ取得方法 | **ビルド時に JSON 読込**（loader.ts） | Sheets gviz/tq（fallback 不要） |
| ホスティング | **Vercel** | GitHub Pages, Netlify |
| 定期再ビルド | **GitHub Actions**（1 日 1 回 cron） | Vercel Deploy Hooks |

## 各選定の根拠

### Astro を推奨する理由

- **静的サイト生成**で初回読み込みが高速 → 要件「2 秒以内」を満たしやすい
- アイランドアーキテクチャで地図部分のみ JavaScript を実行（軽量）
- React / Vue / Vanilla JS いずれも混在可能（地図ライブラリの選択肢が広い）
- データソースとの統合がビルド時で完結し、API キーをクライアントに露出しない

### Leaflet + OpenStreetMap を採用する理由

- **完全無料**（要件: 無料運用）。地図タイルの利用回数制限なし（OpenStreetMap の利用規約に従う）
- API キー不要
- 軽量（ライブラリサイズ ~40KB）
- ピン表示・クラスタリングなど必要機能は MVP で十分カバー

代替案（Mapbox）は無料枠を超えると課金が発生するため MVP では選ばない。

### Google Sheets をデータソースに採用する理由

| 観点 | Google Sheets | Notion |
|---|---|---|
| 緯度経度の入力 | 数値列で直感的 | 数値プロパティは可能だが手間 |
| モバイル編集 | スマホアプリで快適 | スマホアプリで可能 |
| 公開読み込み | 公開シート → API キー不要 | 公開ページの API は読み取り制約あり |
| API レート制限 | 緩い（公開シート） | 厳しい（3 req/sec） |
| 認証の手間 | 不要（公開シート） | Integration Token 必要 |

**Google Sheets を採用**。スマホから旅先で店を追加するシナリオ（US-06）でも、Google スプレッドシートアプリで快適に操作可能。

### Google Sheets の読み取り方式（詳細）

| 項目 | 採用方針 |
|---|---|
| シートの公開設定 | 「リンクを知っている全員が閲覧可能」（編集権限はオーナーのみ） |
| 取得エンドポイント | **`gviz/tq` の CSV/JSON 出力**: `https://docs.google.com/spreadsheets/d/<SHEET_ID>/gviz/tq?tqx=out:csv&sheet=<SHEET_NAME>` |
| 取得タイミング | **ビルド時のみ**（Astro のビルドスクリプト内で fetch） |
| 認証 | 不要（公開シート方式） |
| API キー | **使用しない**（gviz/tq は API キー不要） |
| シート ID の保持 | **Vercel の環境変数** `SHEETS_ID`（公開リポジトリでも秘匿可能。シート自体は公開だが、URL の露出最小化のため） |
| ローカル開発 | `.env.local` に `SHEETS_ID` を設定（`.gitignore` 済み） |
| フォールバック | フェッチ失敗時は `data/restaurants.json`（前回ビルド時のスナップショット）を使う。ビルドは継続する |
| データ正規化 | CSV を取得後、ビルドスクリプトで `data-model.md` のスキーマに準拠した JSON に変換 |

> 採用理由: Sheets API v4 は API キーが必要で漏洩リスクがあるが、gviz/tq は API キー不要かつ公開シートで動作するため最もシンプル。

### 定期再ビルドの実装方式

| 項目 | 採用方針 |
|---|---|
| 仕組み | **Vercel Deploy Hooks** を **GitHub Actions の cron** から HTTP POST |
| 頻度 | 1 日 1 回（UTC 03:00 = JST 12:00 想定） |
| 手動トリガー | Vercel Dashboard の "Redeploy" ボタン、または `workflow_dispatch` で GitHub Actions を手動実行 |
| Deploy Hook URL の保管 | **GitHub Actions の Secrets** に `VERCEL_DEPLOY_HOOK_URL` として保存 |
| 失敗時 | GitHub Actions のログで検知。サイトは前回のビルドのまま動き続ける |

### ビルド時取得（vs クライアント側 fetch）

- ビルド時に Google Sheets からデータを取得 → JSON として静的バンドルに含める
- **メリット**: 初回表示が高速、API キー（あれば）が露出しない、シート障害時もサイトが落ちない
- **デメリット**: 編集後即時反映されない → **GitHub Actions の定期再ビルド**（1 日 1 回 + 手動トリガー）でカバー

緊急で即反映が必要な場合は、Vercel のデプロイフックを叩く運用を併用。

### Vercel をホスティングに採用する理由

- 無料枠で個人プロジェクトを完全カバー
- Astro のサポートが手厚く、ビルド設定がほぼゼロ
- Git push に連動した自動デプロイ
- GitHub Actions との連携が容易

GitHub Pages も無料だが、ビルドステップを GitHub Actions に書く必要があり、設定が冗長。

## 補助ツール

- **パッケージマネージャ**: pnpm（軽量）
- **Linter / Formatter**: Biome（高速、設定簡素）
- **型システム**: TypeScript（データモデルの型安全性のため）

## 想定するディレクトリ構成（実装フェーズの参考）

```
src/
├── pages/
│   ├── index.astro          # 一覧 + 地図
│   └── restaurant/[id].astro # 詳細
├── components/
│   ├── RestaurantCard.astro
│   ├── FilterBar.astro
│   └── Map.astro            # Leaflet（クライアントサイド island）
├── data/
│   └── load-from-sheets.ts  # ビルド時にシートを取得
└── styles/
    └── global.css
data/
└── restaurants.json          # サンプル / フォールバックデータ
```

## 不採用にしたもの

- **Next.js**: Astro より JS バンドルが重く、SSG なら Astro の方が初回読み込みで有利
- **Firebase / Supabase**: バックエンド不要なので過剰
- **Mapbox**: 課金リスクあり

## 未確定事項

- ~~Google Sheets のシート ID をどう環境変数として管理するか~~ → **解決**: Vercel 環境変数 `SHEETS_ID`
- ~~地図のデフォルト中心座標~~ → **解決**: 絞り込みに応じた fitBounds（[01-overview.md](../requirements/01-overview.md) 参照）
- Astro のクライアントアイランド境界（`Map.astro` と `FilterBar.astro` がクライアント）→ 実装時に最終決定
- ボトムシート実装方法（CSS のみで OK）→ 実装時に最終決定

## 更新履歴

- 2026-05-18: 初版作成（要件定義エージェント）
- 2026-05-18: レビュー指摘 D-M01 / I-007 対応で Google Sheets 読み取り方式（gviz/tq）とシート ID 管理を明記。D-S03 / I-013 対応で定期再ビルド方式（Vercel Deploy Hooks + GitHub Actions cron）を明記
- 2026-05-18: D-024 に基づき、データソースを Google Sheets から `data/restaurants.json` に変更。Sheets 関連はオプション扱い
