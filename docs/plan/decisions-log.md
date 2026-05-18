# 意思決定ログ

> このファイルは **開発計画管理エージェント** が更新する。各決定に ID（D-001 形式）を付け、根拠と関連ドキュメントを残す。

## フォーマット

```
## D-XXX: タイトル

- 日付: YYYY-MM-DD
- 状態: Active / Superseded by D-YYY
- 関連: docs/.../filename.md
- 決定: 何を決めたか
- 根拠: なぜそう決めたか
- 代替案: 検討したが採用しなかった選択肢
- 影響: この決定がどこに波及するか
```

---

## D-001: マルチエージェント開発体制を採用

- 日付: 2026-05-18
- 状態: Active
- 関連: [README.md](../../README.md), [workflow.md](../../workflow.md)
- 決定: 要件定義 / レビュー / 実装 の 3 エージェントに加え、開発計画管理エージェントを横断的な管理役として配置
- 根拠: ユーザーの要望。役割を明確に分離することで、各フェーズの品質と再現性を高める
- 代替案: 単一エージェントで全工程を担当 → スコープ拡散のリスクが高い
- 影響: `agents/` 配下に 4 つの指示書、`docs/` 配下に成果物の受け渡しフロー

## D-002: 対象を「特定の都市・地域のみ」に限定

- 日付: 2026-05-18
- 状態: Active
- 関連: [docs/requirements/01-overview.md](../requirements/01-overview.md)
- 決定: イタリア全土を網羅するのではなく、今回の旅行で訪れる都市に絞る。ただしデータモデルは複数都市対応で柔軟に
- 根拠: ユーザーヒアリングの結果。MVP のスコープを最小化するため
- 代替案: イタリア全土 / 他国も視野 → 初期データ作成コストが過大
- 影響: 初期データ件数の見通し、地図のデフォルト中心座標の決め方

## D-003: MVP に地図ピン表示を含める

- 日付: 2026-05-18
- 状態: Active
- 関連: [docs/requirements/03-functional-req.md](../requirements/03-functional-req.md) F-5, [docs/design/data-model.md](../design/data-model.md)
- 決定: 地図ピン表示を MVP の必須機能とする
- 根拠: ユーザーが「地図表示を含める」を選択。旅程設計時に位置感覚が重要
- 代替案: 一覧のみ（地図なし） → モバイルでの旅程組みに不便
- 影響: 緯度経度がデータ必須項目に。地図ライブラリ選定が技術スタックに含まれる

## D-004: データソースに Google Sheets を採用

- 日付: 2026-05-18
- 状態: **Superseded by D-024**（2026-05-18 に JSON へ転換）
- 関連: [docs/design/tech-stack.md](../design/tech-stack.md), [docs/design/data-model.md](../design/data-model.md)
- 決定: 店舗データの保存先として Google Sheets を採用
- 根拠: ユーザーが「Notion / Google Sheets 連携」を選択。比較の結果、緯度経度の入力しやすさ、API レート制限の緩さ、認証不要の公開シート方式から Sheets を選択
- 代替案: Notion API → 認証必要、API レート厳しめ。JSON 直接編集 → モバイル編集が困難
- 影響: ビルド時のシート取得スクリプトが必要。シート ID の管理方針が必要

## D-005: 写真を MVP に含めない

- 日付: 2026-05-18
- 状態: Active
- 関連: [docs/requirements/01-overview.md](../requirements/01-overview.md), [docs/requirements/03-functional-req.md](../requirements/03-functional-req.md)
- 決定: MVP では写真を扱わない。テキスト中心
- 根拠: ユーザーが「写真なし（テキスト中心）」を選択。サイトの軽量さを優先
- 代替案: 写真同梱 / 外部ホスティング → ストレージ・転送量・運用コスト増
- 影響: データモデルから `photos` フィールドを削除。UI で画像領域を確保しない

## D-006: ホスティングは Vercel

- 日付: 2026-05-18
- 状態: Active
- 関連: [docs/design/tech-stack.md](../design/tech-stack.md)
- 決定: ホスティング先として Vercel を採用
- 根拠: 無料枠で個人プロジェクトをカバー、Astro との相性、デプロイの自動化が容易
- 代替案: GitHub Pages → ビルド設定が冗長。Netlify → 機能は同等だが Vercel の Astro サポートがより手厚い
- 影響: ドメインは `*.vercel.app` を使用。環境変数の管理方法は Vercel の UI 経由

## D-007: フロントエンドフレームワークは Astro

- 日付: 2026-05-18
- 状態: Active
- 関連: [docs/design/tech-stack.md](../design/tech-stack.md)
- 決定: Astro（SSG）を採用
- 根拠: 初回読み込みの速さ、アイランドアーキテクチャによる JS の軽量化、データソースとのビルド時統合
- 代替案: Next.js → JS バンドルが重い。Vanilla → 地図 + フィルタの実装が手間
- 影響: 実装エージェントは Astro のプロジェクト構成に従う

## D-008: 初期対応地域は Rome / Florence / Sicily

- 日付: 2026-05-18
- 状態: Active
- 関連: [docs/requirements/01-overview.md](../requirements/01-overview.md)
- 決定: MVP で扱う地域は Rome, Florence, Sicily の 3 つ。Sicily は本来「州」レベルだが MVP では「都市」と同列の絞り込み枠として扱う
- 根拠: ユーザーの旅行先（2026-05-18 ヒアリング）
- 代替案: より細かい都市分割（Palermo, Catania, Taormina など）→ シチリア島内の店舗数が増えた時点で再検討
- 影響: 地図中心は fitBounds 方式。Sheets の `city` カラムは 3 値ドロップダウン

## D-009: SEO はインデックス拒否（URL シェア限定公開）

- 日付: 2026-05-18
- 状態: Active
- 関連: [docs/requirements/04-non-functional-req.md](../requirements/04-non-functional-req.md)
- 決定: `<meta name="robots" content="noindex, nofollow">` と `robots.txt` で全クローラー拒否
- 根拠: ユーザーの希望（2026-05-18 ヒアリング）。利用者は本人と友人のみで、検索流入を想定しない
- 代替案: インデックス許可 → 想定外の流入リスクあり
- 影響: SEO 対策（OG タグの厳密化など）は MVP では不要

## D-010: Google Sheets は gviz/tq エンドポイントで読み取り

- 日付: 2026-05-18
- 状態: Active
- 関連: [docs/design/tech-stack.md](../design/tech-stack.md)
- 決定: `gviz/tq` の CSV 出力をビルド時に取得。API キー不要。シート ID は Vercel 環境変数 `SHEETS_ID`
- 根拠: API キー漏洩リスクなし、公開シートで動作、ビルド時取得で初回表示も高速
- 代替案: Sheets API v4（API キー必要）/ クライアント側 fetch（初回表示遅延）
- 影響: Astro のビルドスクリプトに fetch + CSV パースが必要。フォールバック用に `data/restaurants.json` を維持

## D-011: 定期再ビルドは Vercel Deploy Hook + GitHub Actions cron

- 日付: 2026-05-18
- 状態: Active
- 関連: [docs/design/tech-stack.md](../design/tech-stack.md)
- 決定: GitHub Actions の cron（1 日 1 回）から Vercel Deploy Hook URL に POST
- 根拠: 設定が最も簡素、GitHub 側のみで cron 管理可能
- 代替案: Vercel Cron（要 Pro プラン）/ 外部 cron サービス
- 影響: Deploy Hook URL を GitHub Secrets に保管。Vercel 環境変数とは別管理

## D-012: ID 生成はビルド時のハッシュベース自動化

- 日付: 2026-05-18
- 状態: Active、Supersedes 当初の手動命名方針
- 関連: [docs/design/data-model.md](../design/data-model.md)
- 決定: `name + city` のハッシュ先頭 8 文字を `<city>-<hash8>` 形式で自動生成
- 根拠: 手動管理だと重複・表記揺れが発生。冪等性が確保され、Sheets 側に `id` 列を持つ必要もない
- 代替案: 手動命名 + サフィックス管理 → ヒューマンエラー多発
- 影響: Sheets の `id` 列は不要に。ビルドスクリプトでハッシュ生成

## D-013: `country` フィールドを MVP では省略

- 日付: 2026-05-18
- 状態: Active
- 関連: [docs/design/data-model.md](../design/data-model.md)
- 決定: MVP データモデルから `country` を削除
- 根拠: イタリア国内のみが対象。`country` が定数になるなら無駄
- 代替案: `country: 'IT'` を必須維持 → 入力負担あり
- 影響: 将来他国対応時にスキーマ拡張が必要

## D-014: 現在地表示を Phase 3 スコープに追加

- 日付: 2026-05-18
- 状態: Active
- 関連: [docs/requirements/03-functional-req.md](../requirements/03-functional-req.md) F-10, [docs/requirements/04-non-functional-req.md](../requirements/04-non-functional-req.md)
- 決定: ブラウザの Geolocation API を使った「現在地表示」機能を F-10 として MVP に追加
- 根拠: ユーザー要望（2026-05-18）。プロジェクトの本質「旅先で使う」に直結し、初リリースから提供することで価値が高まる。実装規模も小（1〜2 時間）
- 代替案: Phase 4 以降への先送り → 旅行開始までに間に合わない可能性
- 影響: Map.astro に現在地ボタン追加。プライバシー方針として「ボタン押下時のみ取得、保存・送信しない」を非機能要件に追記。HTTPS 必須（Vercel デプロイで自動的に満たす、localhost も OK）

## D-015: 位置情報は取得時のみ、保存・送信しない

- 日付: 2026-05-18
- 状態: Active
- 関連: [docs/requirements/04-non-functional-req.md](../requirements/04-non-functional-req.md)
- 決定: `navigator.geolocation.getCurrentPosition()` をボタン押下時のみ呼び出し、結果はクライアントメモリ上の変数のみで保持。localStorage / Cookie / サーバー送信は一切行わない
- 根拠: 位置情報は機密性が高い。「公開サイトには個人特定情報を含めない」(01-overview.md) 方針との整合
- 代替案: `watchPosition` で常時追尾 → バッテリー消費・プライバシー懸念が増大
- 影響: 機能要件 F-10 に明示。実装エージェントは保存処理を一切書かない

## D-016: データ出典の明示と信頼層タクソノミー導入

- 日付: 2026-05-18
- 状態: Active
- 関連: [docs/design/data-model.md](../design/data-model.md), [docs/curation-guide.md](../curation-guide.md)
- 決定: Restaurant に `source`（出典スラグ）と `sourceTrust`（high / medium / low）フィールドを追加。Gambero Rosso, 50 Top Pizza, Slow Food, Reddit local, friend など主要ソースを列挙
- 根拠: Google Maps 等の広告・観光客バイアスを避け、信頼できる一次ソース由来の店だけを混ぜないようにする（ユーザー要望）
- 代替案: 自由テキストで source を記述 → 集計・フィルタができず形骸化
- 影響: データモデル拡張。`docs/curation-guide.md` にソースのリストと使い方を明文化

## D-017: AI は店舗発見ではなくランク付け・分類に使う

- 日付: 2026-05-18
- 状態: Active
- 関連: [docs/curation-guide.md](../curation-guide.md), [docs/ai-prompt-template.md](../ai-prompt-template.md)
- 決定: AI（Claude / ChatGPT）の役割は「人間が信頼できるソースから集めた候補店」に対して、verdict / concerns / highlights を付与するメタ評価のみ。新規店舗の発見・推薦には使わない
- 根拠: LLM の幻覚（存在しない店を返す）リスクを排除しつつ、テキスト分類という LLM の強みを活かす
- 代替案: AI に「ローマでおすすめのトラットリア」と聞いて店名を取得 → 幻覚リスクと裏取りコストが大きい
- 影響: ワークフローが「人間が候補収集 → AI で評価分類 → シートに反映」の 3 段階に確定

## D-018: AI 連携はプロンプトテンプレ + 手動コピペ方式

- 日付: 2026-05-18
- 状態: Active
- 関連: [docs/ai-prompt-template.md](../ai-prompt-template.md)
- 決定: Anthropic API を組み込まず、`docs/ai-prompt-template.md` に再利用可能なプロンプトを置く。ユーザーが手元の Claude / ChatGPT にコピペして JSON を取得 → シートに貼る
- 根拠: 実装コストゼロ、API キー管理不要、API 利用料ゼロ。MVP に最適
- 代替案: `pnpm enrich` スクリプトでの自動化 → 必要になった時点で D-018 を Supersede する形で再検討
- 影響: 実装は型・UI・ローダー拡張のみ。AI 呼び出しはアプリ外

## D-019: 評価軸は concerns（負）と highlights（正）の両軸

- 日付: 2026-05-18
- 状態: Active
- 関連: [docs/design/data-model.md](../design/data-model.md), [docs/requirements/03-functional-req.md](../requirements/03-functional-req.md) F-12
- 決定: 負のシグナル（concerns）だけでなく、正のシグナル（highlights）も並行保存。両者を踏まえた総合判定 `verdict` を別フィールドで持つ
- 根拠: ユーザー要望（ポジティブ評価も追加）。負だけだと「悪くないが特に良くもない店」と「明確に良い店」が区別できない
- 代替案: 負のみ → ニュートラルとポジティブの差が出ない
- 影響: タクソノミーが 2 系統になる。UI も両方を表示する設計に

## D-021: リサーチエージェントに Web ツール（WebSearch + WebFetch）を導入

- 日付: 2026-05-18
- 状態: Active、Supersedes D-017 の「AI 知識のみ」前提
- 関連: [agents/restaurant-research-agent.md](../../agents/restaurant-research-agent.md), [docs/curation-guide.md](../curation-guide.md)
- 決定: 店舗リサーチエージェントは AI 知識だけでなく、**WebSearch + WebFetch ツール** を使って実際に信頼ソース（50 Top Pizza, MICHELIN, Gambero Rosso 等）の公開ページから情報を取得する
- 根拠: LLM 知識カットオフ問題と幻覚リスクを大幅軽減。実在性・現状の営業情報・最新のランキングを反映できる
- 代替案: API 統合（Brave Search / Anthropic Search） → 鍵管理・コストが増えるため見送り
- 影響: 1 ラウンドあたり WebSearch 1〜2 回 + WebFetch 2〜3 回。ToS 範囲内（公開ページ参照、レート過多なし）

## D-027: Phase 6 — アプリ内 AI チャットで店舗追加（F-17）

- 日付: 2026-05-18
- 状態: Active
- 関連: F-17, `src/pages/api/chat.ts`, `src/pages/api/save.ts`, `src/components/ChatPanel.astro`
- 決定: 静的サイトに **Vercel Serverless Function** で API エンドポイントを 2 本追加し、ブラウザから AI に直接質問して `data/restaurants.json` へ自動 commit する機能を追加
  - `/api/chat`: Anthropic Claude API + web_search ツールで候補生成
  - `/api/save`: GitHub API（Octokit）経由で repo に commit
  - ChatPanel: フローティング UI、パスワード認証
- アーキテクチャ転換:
  - Astro の `output: 'static'` → **`'hybrid'`** に変更（ページは静的、API ルートのみ SSR）
  - `@astrojs/vercel` アダプタを導入
- セキュリティ:
  - `ADMIN_PASSWORD` 環境変数でチャット利用を制限
  - クライアントはヘッダー `X-Admin-Password` を送信、Function 側で検証
  - sessionStorage に保存（タブを閉じれば消える）
- 必要な環境変数（Vercel）:
  - `ANTHROPIC_API_KEY`: Claude API キー
  - `GITHUB_TOKEN`: PAT（`repo` 権限）
  - `GITHUB_OWNER`: `shintaro-kawa`
  - `GITHUB_REPO`: `italia-gohan-map`
  - `ADMIN_PASSWORD`: チャット保護パスワード
- コスト見積:
  - Claude Sonnet 4.6 ≈ $0.05/クエリ（web_search 込み）
  - Vercel Function 実行: 無料枠内
  - 月 50 クエリ ≈ $2.5
- 段階:
  - **Phase 6a**: チャット UI + AI 候補生成（手動コピー）
  - **Phase 6b**: 「リストに追加」で GitHub 自動 commit
  - Phase 6c は後日（Nominatim 統合 / 画像取得統合）
- ハルシネーション対策:
  - Claude の `web_search` を必須化（実在ソース引用）
  - レスポンスを Restaurant スキーマでサーバー側バリデーション
  - 既存店名・id をコンテキストに含めて重複検出を AI に任せる
  - city タクソノミーを system prompt で制約（Rome / Florence / Sicily のみ）
- 影響: ビルド成果物にサーバーレス Function が含まれる、Vercel デプロイ時間が微増、依存パッケージ +3（@astrojs/vercel, @anthropic-ai/sdk, @octokit/rest）

## D-026: Phase 5 拡張 — 検索バー + 並び替え（F-7 昇格 + F-16 新規）

- 日付: 2026-05-18
- 状態: Active
- 関連: [docs/requirements/03-functional-req.md](../requirements/03-functional-req.md) F-7, F-16
- 決定: データ件数が 37 を超え、既存の都市 / ジャンル / 訪問 / 除外フィルタだけでは細粒度の到達が難しくなったため:
  1. **F-7（フリーワード検索）を「推奨機能」→「必須機能」に昇格**
  2. **F-16 並び替え** を新規追加（おすすめ順 / 評価順 / 名前順 / 新着順 の 4 軸）
- 根拠: 旅行中の高速到達体験のため。「Trastevere のトラットリアを評価順で見たい」のようなニーズを満たす
- 実装方針:
  - 検索: クライアントサイド substring（name / area / comment / tags / notes を横断）、URL `?q=`
  - 並び替え: 既存カード要素の CSS `order` を JS で書き換え、URL `?sort=`
  - 既存フィルタチェーンに **AND** で組み込み
- 影響: FilterBar.astro に検索入力 + ソート select、index.astro のフィルタロジック拡張

## D-025: Phase 5 開始 — データ品質底上げ + UX 仕上げ + CI

- 日付: 2026-05-18
- 状態: Active
- 関連: [docs/plan/project-plan.md](project-plan.md), [docs/requirements/03-functional-req.md](../requirements/03-functional-req.md)
- 決定: Phase 4 公開後の運用レビューで判明した課題を Phase 5 として正式着手:
  1. **F-14 画像 URL 表示** — 旅行サイトとして写真不足は致命的
  2. **F-15 OSM Nominatim 自動ジオコーディング** — 既存 37 件の「要検証」緯度経度を一掃
  3. **F-13 完成** — Phase 3 で仕様化したまま未実装だったネガティブフィルタを UI 化
  4. **「+ 追加」残骸除去** — D-024 で意味を失った旧 Sheets 編集導線を削除
  5. **CI 自動化** — GitHub Actions で push 時に型チェック + ビルドを実行
- 根拠: 開発工程レビューでユーザーが優先度 1〜3 を「データ品質」「UX」「軽作業まとめて」と判断
- 代替案: オフライン PWA 化を最優先 → 「中規模実装、現状でも localhost で使える」のため Phase 6 候補へ
- 影響: 機能要件 +2、未実装要件の完成 +1、コード負債除去 +2

## D-024: Sheets 依存を解除、`data/restaurants.json` を source of truth に

- 日付: 2026-05-18
- 状態: **Active、Supersedes D-004**（Google Sheets as data source）
- 関連: [data/restaurants.json](../../data/restaurants.json), [src/data/loader.ts](../../src/data/loader.ts), [agents/curation-integration-agent.md](../../agents/curation-integration-agent.md)
- 決定: 当初 D-004 で Sheets を source of truth としていたが、運用実態が以下に変化したため転換:
  - キュレーションサブチーム（D-020）導入後、データの 9 割以上が AI リサーチ経由で `data/restaurants.json` に直接書き込まれる
  - Sheets ↔ JSON の二重管理がコストに見合わない（D-023 学習 1〜6 で観測）
  - 「Step 1 で Sheets に貼り直し」が自動化困難（Google Sheets API 認証が必要）
  → **`data/restaurants.json` を唯一の source of truth とし、Sheets は不要**
- 実装:
  - **コード変更不要**: loader.ts は既に `SHEETS_ID` 未設定で JSON フォールバックする実装
  - Vercel から **`SHEETS_ID` 環境変数を削除** すれば自動的に JSON-only モードへ
  - データ編集は `data/restaurants.json` を直接編集 → `git push` で自動デプロイ
- 代替案（採用せず）:
  - 案 A: Google Sheets API + サービスアカウントでフル自動化 → 初期セットアップ 10 分 + 鍵管理が必要、複雑
  - 案 C: 部分自動化（Deploy Hook のみ）→ Step 1 が残り効果薄
- 影響:
  - 「旅先のスマホから Sheets で追加」は不可になる代わりに、**GitHub Mobile で `data/restaurants.json` を直接編集 + コミット** で代替可能
  - キュレーション統合 AG の出力フォーマットを「Sheets 貼付 TSV」→「JSON 追記 + `git diff` プレビュー」に変更
  - `scripts/json-to-tsv.mjs` と `docs/curation/sheets-import.tsv` は将来 Sheets 復活時のため保持（dormant）

## D-023: セッション #1〜#2 の運用学習を反映

- 日付: 2026-05-18
- 状態: Active
- 関連: [docs/curation-guide.md](../curation-guide.md), [agents/restaurant-research-agent.md](../../agents/restaurant-research-agent.md), [docs/curation/coverage-target.md](../curation/coverage-target.md)
- 決定: セッション #1（R-002〜R-004）と #2（R-005〜R-007）で観測した実運用パターンを以下のように体系化:

### 学習 1: Gambero Rosso は WebFetch を恒常的に拒否（403）
- 観測: 計 3 回試行、すべて 403 Forbidden（Bot 対策）
- 対応: ソース優先順序から **Gambero Rosso の直接フェッチを外す**。WebSearch でメタ情報を拾う用途のみに留める
- 代替ソース: Slow Food regional blogs（例: slowfoodpalermo.it）、地元ジャーナリズム（ilsicilia.it / palermotoday.it 等）

### 学習 2: 地元ジャーナリズム系が想定以上に有用
- 観測: ilsicilia.it / sicilianstories.eu / palermotoday.it / World of Mouth が構造化された Top-N リストを公開しており、WebFetch でクリーンに抽出できる
- 対応: ソースタクソノミーに `local-journalism`（medium trust）を **将来追加候補**（現状は `food-blogger` で代用可）

### 学習 3: 緯度経度は AI 知識では精度不足、住所までで止める
- 観測: 全 31 件で「都市/地区中心の概算」しか提供できず、要検証フラグが必須化
- 対応: リサーチ AG の出力で **緯度経度は明示的に「街区中心仮値」と明記**、最終値はユーザーが Google Maps で取得
- 将来改善: OSM Nominatim API を呼び出す中間ステップを検討（D-021 で既に言及済）

### 学習 4: 屋台・カート系の営業時間が data model 不足
- 観測: R-006 の pani ca' meusa 5 件はすべて早朝〜午後のみ営業、`openingHours` フィールド欠落で表現できず
- 対応: 現状は **`comment` フィールドに時間情報を含める** ルールを暫定採用。フィールド追加は openingHours の正規化（曜日別?）が複雑なため将来検討
- エスカレーション先: 要件定義 AG に `openingHours` 追加要否を打診

### 学習 5: カバレッジ目標の偏り耐性が弱い
- 観測: pizzeria（Rome / Sicily）と Sicily.trattoria/paninoteca が目標超過、Florence のスイーツ系が未着手のまま
- 対応: 計画 AG オーケストレーターが **「次に最大ギャップ」を機械的に選ぶ** ロジックを強化。target の +200% を超えたら警告

### 学習 6: ユーザー直接指示（自由なキーワード）への対応
- 観測: 「Palermo + Taormina の trattoria と paninoteca」のようにエリア + ジャンル指定が来た
- 対応: 計画 AG は `area` 指定にも対応するモード C を追加（カバレッジ目標を一時的に上書き）

## D-022: キュレーション計画 AG をオーケストレーター化、自律モード追加

- 日付: 2026-05-18
- 状態: Active
- 関連: [agents/curation-planning-agent.md](../../agents/curation-planning-agent.md), [docs/curation/coverage-target.md](../curation/coverage-target.md)
- 決定: 計画エージェントに「カバレッジ目標」概念を導入し、目標と現状のギャップを自動計算してラウンドを連続生成・実行する能力を付与
- 根拠: ユーザー要望（自律的な複数ラウンド回り）。手動で 1 ラウンドずつブリーフを書く負担を排除
- 代替案: 4 つ目の「オーケストレーター」エージェントを新設 → 役割重複でかえって複雑化、計画 AG の拡張で十分
- 影響: `docs/curation/coverage-target.md` で目標宣言。1 ターン内最大 5 ラウンド連続実行（safety limit）

## D-020: キュレーション専門サブチーム（3 エージェント）を設立

- 日付: 2026-05-18
- 状態: Active
- 関連: [agents/curation-planning-agent.md](../../agents/curation-planning-agent.md), [agents/restaurant-research-agent.md](../../agents/restaurant-research-agent.md), [agents/curation-integration-agent.md](../../agents/curation-integration-agent.md), [docs/curation/curation-log.md](../curation/curation-log.md)
- 決定: 既存の 4 エージェント（要件 / レビュー / 実装 / 計画管理）とは別に、データ拡充専用のサブチームを新設。役割は (1) キュレーション計画、(2) 店舗リサーチ、(3) 統合・レビュー の 3 段階
- 根拠: 「データの拡充」は「コードの開発」とサイクルが大きく異なる（リサーチ → AI 評価 → シート反映の繰り返し）。専用ロールを切り分けることで Plan Manager の負担を軽減し、ラウンドベースで再現可能なワークフローを構築
- 代替案: 既存の Plan Manager + Implementation で兼務 → 役割が混在し、データ品質の議論と機能開発の議論が混ざる
- 影響: agents/ 配下に 3 ファイル追加。workflow.md に「キュレーションサブチーム」セクションを追記。docs/curation/ で各ラウンドを記録

## 更新履歴

- 2026-05-18: D-001 〜 D-007 を初期登録
- 2026-05-18: D-008 〜 D-013 を追加（レビュー指摘対応の決定事項）
- 2026-05-18: D-014, D-015 を追加（現在地表示のスコープ追加とプライバシー方針）
- 2026-05-18: D-016 〜 D-019 を追加（キュレーション設計: 出典タクソノミー / AI 役割定義 / プロンプトテンプレ方式 / verdict + concerns + highlights 二軸）
- 2026-05-18: D-020 を追加（キュレーション専門 3 エージェント体制を設立）
- 2026-05-18: D-021, D-022 を追加（Web ツール統合 + 計画 AG のオーケストレーター化）
- 2026-05-18: D-023 を追加（セッション #1〜#2 の運用学習 6 項目を反映）
- 2026-05-18: D-024 を追加（Sheets 依存解除、JSON が source of truth）、D-004 を Superseded
- 2026-05-18: D-025 を追加（Phase 5 開始 — データ品質 + UX + CI）
