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
- 状態: Active
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

## 更新履歴

- 2026-05-18: D-001 〜 D-007 を初期登録
- 2026-05-18: D-008 〜 D-013 を追加（レビュー指摘対応の決定事項）
- 2026-05-18: D-014, D-015 を追加（現在地表示のスコープ追加とプライバシー方針）
- 2026-05-18: D-016 〜 D-019 を追加（キュレーション設計: 出典タクソノミー / AI 役割定義 / プロンプトテンプレ方式 / verdict + concerns + highlights 二軸）
