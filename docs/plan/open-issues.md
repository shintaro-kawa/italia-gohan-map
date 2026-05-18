# 未解決事項リスト

> このファイルは **開発計画管理エージェント** が更新する。

## ラベル

- `Blocker`: フェーズ進行を止めるレベル
- `Important`: 実装前に解決したい
- `Minor`: 余裕があれば対応

## オーナー

- `User`: ユーザー判断待ち
- `Requirements`: 要件定義エージェント
- `Review`: レビューエージェント
- `Implementation`: 実装エージェント
- `PlanManager`: 開発計画管理エージェント

---

## Open

### Important（Phase 3 動作確認のために必要）

#### I-020 [Important] Node.js 環境がユーザー端末にない

- 発見日: 2026-05-18
- オーナー: `User`
- 関連: [README.md](../../README.md) のセットアップ手順
- 内容: 実装エージェントの作業中に判明。ユーザー環境に Node.js / npm / pnpm が未インストール
- 対応: `winget install OpenJS.NodeJS.LTS` などで Node.js をインストール後、`pnpm install && pnpm dev` で動作確認
- 期限: Phase 3 完了前

### Minor（Phase 3 で実装エージェントが判断、または将来）

#### I-004 [Minor] フィルタが多くなった場合の折り畳み UI

- オーナー: `Implementation`
- 関連: [docs/design/ui-wireframes.md](../design/ui-wireframes.md)

#### I-015 [Minor] 成功の定量指標

- 由来: レビュー指摘 R-N01
- オーナー: `User`
- 関連: [docs/requirements/01-overview.md](../requirements/01-overview.md)

#### I-016 [Minor] 価格帯の判断基準

- 由来: レビュー指摘 R-N02
- オーナー: `User` or `Requirements`
- 関連: [docs/design/data-model.md](../design/data-model.md)

#### I-017 [Minor] Astro クライアントアイランドの境界

- 由来: レビュー指摘 D-N01
- オーナー: `Implementation`
- 関連: [docs/design/tech-stack.md](../design/tech-stack.md)
- 備考: 方針は記載済（`Map.astro` と `FilterBar.astro` がクライアント）。最終確定は実装中

#### I-018 [Minor] ボトムシート実装方法

- 由来: レビュー指摘 D-N02
- オーナー: `Implementation`
- 関連: [docs/design/ui-wireframes.md](../design/ui-wireframes.md)
- 備考: 方針は CSS のみ。最終確定は実装中

#### I-019 [Minor] ジャンル `other` の運用ルール

- 由来: レビュー指摘 D-N03
- オーナー: `User`
- 関連: [docs/design/data-model.md](../design/data-model.md)
- 備考: 運用後に判断

---

## Closed

#### I-001 [Important] 対象都市の具体名

- Closed 日: 2026-05-18
- 解決方法: I-006 として Blocker に昇格させ統合管理

#### I-002 [Minor] 「+ 追加」ボタンの導線

- Closed 日: 2026-05-18
- 解決方法: F-9 として機能要件に明文化（Google Sheets を別タブで開く）

#### I-003 [Minor] 地図のデフォルト中心座標

- Closed 日: 2026-05-18
- 解決方法: I-006 と統合し、絞り込みに応じた fitBounds 方式に決定

#### I-005 [Blocker] 編集フロー（US-06）が機能要件にない

- Closed 日: 2026-05-18
- 解決方法: [03-functional-req.md](../requirements/03-functional-req.md) に F-9 を追加

#### I-006 [Blocker] 初期対応都市と地図デフォルト中心座標が未確定

- Closed 日: 2026-05-18
- 解決方法: Rome / Florence / Sicily を初期対象に確定。地図は fitBounds 方式

#### I-007 [Blocker] Google Sheets 読み取り方法とシート ID 管理が未定義

- Closed 日: 2026-05-18
- 解決方法: gviz/tq エンドポイント + Vercel 環境変数 + 前回スナップショットへのフォールバック

#### I-008 [Important] 訪問済み/未訪問フィルタの挙動を排他に統一

- Closed 日: 2026-05-18
- 解決方法: F-8 を排他 3 状態（すべて / 訪問済み / 未訪問）に明確化

#### I-009 [Important] アクセシビリティの必達項目を明示

- Closed 日: 2026-05-18
- 解決方法: 必達 / 努力目標を分離して列挙

#### I-010 [Important] 検索エンジンへのインデックスポリシーを決定

- Closed 日: 2026-05-18
- 解決方法: `noindex` 採用、`robots.txt` で全 Disallow

#### I-011 [Important] タグ統制ルール

- Closed 日: 2026-05-18
- 解決方法: 小文字 + ハイフン規約、Sheets 入力規則で検証、MVP では表示のみ

#### I-012 [Important] ID 生成の自動化方針

- Closed 日: 2026-05-18
- 解決方法: ビルド時にハッシュベース自動生成（`<city>-<hash8>`）

#### I-013 [Important] 定期再ビルドの実装方式

- Closed 日: 2026-05-18
- 解決方法: Vercel Deploy Hooks + GitHub Actions cron（1 日 1 回）

#### I-014 [Important] `country` フィールドを MVP で省略するかどうか

- Closed 日: 2026-05-18
- 解決方法: MVP では省略。他国対応する将来段階で追加

---

## サマリー

| 区分 | Open | Closed |
|---|---|---|
| Blocker | 0 | 3 |
| Important | 1 | 7 |
| Minor | 6 | 3 |

**Phase 3 のファイル実装は完了。残 Important（I-020）は環境準備の問題で、ユーザー側で Node.js をインストール + `pnpm dev` で動作確認するとクローズできる。**

## 更新履歴

- 2026-05-18: 初版（Phase 1 持ち越し 4 件）
- 2026-05-18: レビュー結果を反映（Blocker 3 / Important 7 / Minor 8）
- 2026-05-18: Blocker 3 件・Important 7 件を Closed 化。Phase 3 開始可能な状態へ
- 2026-05-18: Phase 3 着手中に I-020（Node.js 未インストール）を発見
