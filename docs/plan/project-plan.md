# プロジェクト計画

> このファイルは **開発計画管理エージェント** が更新する。

## 現在のステータス

| 項目 | 値 |
|---|---|
| 現フェーズ | **Phase 6 完了、運用中** |
| プロジェクト開始 | 2026-05-18 |
| 最終更新 | 2026-05-19 |
| 公開 URL | https://italia-gohan-map.vercel.app |
| GitHub | https://github.com/shintaro-kawa/italia-gohan-map |
| 店舗数 | 67 件（Rome 25 / Florence 22 / Sicily 20）|
| 採用機能 | F-1〜F-17 全達成 |
| 累計意思決定 | D-001 〜 D-027 |
| 採用エージェント数 | 7 体（コア 4 + キュレーション 3）|

## マイルストーン

| フェーズ | 担当エージェント | 状態 | 完了日 |
|---|---|---|---|
| Phase 0: プロジェクト構造設計 | （ユーザー + Plan Manager） | ✅ 完了 | 2026-05-18 |
| Phase 1: 要件定義 | 要件定義エージェント | ✅ 完了 | 2026-05-18 |
| Phase 2: レビュー | レビューエージェント | ✅ 完了（APPROVED） | 2026-05-18 |
| Phase 3: 実装 | 実装エージェント | ✅ 完了 | 2026-05-18 |
| Phase 4: 公開・運用 | 実装エージェント + ユーザー | ✅ 完了 | 2026-05-18 |
| Phase 5: データ品質 + UX 仕上げ + CI | 全 7 エージェント | ✅ 完了 | 2026-05-18 |
| Session #3: ユーザー指示 Rome 15 + Florence 15 | キュレーション AG | ✅ 完了 | 2026-05-18 |
| Phase 6: アプリ内 AI チャット + 自動 commit | 全 7 エージェント | ✅ 完了 | 2026-05-19 |

## フェーズ完了の判定基準（DoD）

### Phase 1: 要件定義
- [x] `docs/requirements/` の 4 ファイルが TODO なしで埋まっている
- [x] `docs/design/` の 3 ファイルが TODO なしで埋まっている（未確定事項は明示）
- [x] 重要な意思決定が `decisions-log.md` に記録されている

### Phase 2: レビュー
- [x] `docs/reviews/requirements-review.md` が記入され、Must が解決済み
- [x] `docs/reviews/design-review.md` が記入され、Must が解決済み
- [x] 両ファイルの末尾に `APPROVED` サインがある
- [x] レビュー指摘事項が `open-issues.md` に反映されている

### Phase 3: 実装
- [x] `src/` 配下に動くコードがある（Astro プロジェクト）
- [x] `data/restaurants.json` にサンプル 6 件（Rome 2 / Florence 2 / Sicily 2）
- [x] ローカルでフィルタ・地図表示・詳細表示が動作（2026-05-18 検証済み）
- [x] Google Sheets からの取り込みスクリプトが実装済み（gviz/tq、`src/data/loader.ts`）
- [x] `robots.txt` と `<meta name="robots" content="noindex">` が設置済み
- [x] README にローカル起動手順がある
- [x] F-10（現在地表示）が実装済み（D-014 / D-015 に基づく追加スコープ）
- [ ] F-10 をスマホ実機で動作確認（**HTTPS 必須なので Vercel デプロイ後の検証推奨**）

### Phase 4: 公開・運用
- [ ] Vercel にデプロイされ、URL でアクセス可能
- [ ] Google Sheets が公開シートとして設定され、Vercel 環境変数 `SHEETS_ID` が設定済み
- [ ] GitHub Actions の定期再ビルドが動作確認済み
- [ ] Vercel Deploy Hook URL が GitHub Secrets `VERCEL_DEPLOY_HOOK_URL` に保管済み

## 次のアクション

1. ✅ Phase 1〜3 完了（要件・レビュー・実装すべて）
2. ✅ ローカル動作確認 OK（2026-05-18）
3. ✅ 追加スコープ実装: F-10 現在地表示、F-11/12/13 出典・評価・フィルタ → 完了
4. 🟡 **Phase 4 デプロイ準備中** ← 現在ここ
   - 実装エージェント: GitHub Actions ワークフロー + DEPLOY.md 作成（完了）
   - ユーザー: git 初期化 → GitHub プッシュ → Vercel 接続 → Google Sheets 連携
5. 本番動作確認（PC + スマホ実機 + F-10 現在地）
6. 運用フェーズへ

## スコープのリマインダ

**MVP に含めるもの**: 店舗一覧、都市・ジャンル絞り込み、地図ピン、詳細表示、訪問済みフラグ、外部データソースを開く導線（F-9）

**MVP に含めないもの**（要望が出ても Phase 3 では追加しない）: 認証、写真、レビュー投稿、フリーワード検索（推奨機能として候補のまま）、多言語、オフライン対応、ルート計画

## Phase 3 開始前の確認事項

- 残 Issues はすべて Minor（実装中の判断 or 将来）
- Google Sheets の実体は Phase 3 中に作成（実装エージェントがシートのテンプレートを用意）
- データの初期投入は Phase 3 終盤、または Phase 4 でユーザーが行う

## 更新履歴

- 2026-05-18: Phase 0, 1 完了。Phase 2 に遷移
- 2026-05-18: Phase 2 レビュー実施。Blocker 3 件で要件定義エージェントに差し戻し
- 2026-05-18: 差し戻し対応完了、再レビュー APPROVED。Phase 3 開始待ち
- 2026-05-18: Phase 3 開始。Astro + Leaflet + Google Sheets のプロジェクト構造を実装。動作確認はユーザー側で実施
- 2026-05-18: ローカル動作確認 OK。スコープ追加（F-10 現在地表示、D-014 / D-015）を実装、ビルド検証済み
- 2026-05-18: Phase 4 完了。Vercel 本番デプロイ + GitHub Actions cron 稼働開始
- 2026-05-18: キュレーションサブチーム導入（D-020）、自律モードで R-001〜R-007 実行、Sicily 中心 20 件追加
- 2026-05-18: D-024 で Sheets 依存解除、JSON を source of truth に転換
- 2026-05-18: Phase 5 完了（F-13/14/15/16 + F-7 昇格 + CI）、ジオコーディング 13 件、画像 3 件
- 2026-05-18: Session #3 で Rome+Florence 30 件追加、合計 67 件に
- 2026-05-19: Phase 6 完了。アプリ内 AI チャット + GitHub 自動 commit が本番稼働
