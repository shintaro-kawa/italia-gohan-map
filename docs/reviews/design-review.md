# 設計レビュー

レビュー実施日: 2026-05-18
レビュアー: レビューエージェント

## レビュー対象

- [docs/design/data-model.md](../design/data-model.md)
- [docs/design/tech-stack.md](../design/tech-stack.md)
- [docs/design/ui-wireframes.md](../design/ui-wireframes.md)

## 全体評価

設計は要件と整合しており、技術選定の根拠も明示されている。Astro + Leaflet + Google Sheets の組み合わせは要件（無料・高速・モバイル編集）を満たす合理的な選択。
重大な問題はないが、**Google Sheets の公開設定とシート ID の扱い**、および **タグの統制** は実装前に決めておきたい（Should）。

---

## 指摘事項

### [Must] D-M01: 公開シートの読み取り方法とシート ID の管理が未定義

- 対象: [tech-stack.md](../design/tech-stack.md)
- 内容: 「Google Sheets を公開シート方式で読む」とあるが、具体的にどのエンドポイント（gviz/tq、Google Sheets API v4、CSV エクスポート等）を使うか未定。シート ID は URL に含まれるため「シークレットではない」が、Vercel の環境変数経由にするのかソースに直書きするのかが決まらないと実装が止まる
- 推奨対応: tech-stack.md に以下を明記
  - 採用エンドポイント（推奨: Sheets API v4 + API キー、または gviz/tq）
  - シート ID の保持場所（Vercel 環境変数か、ソース直書きか）
  - エラー時のフォールバック（前回ビルドの JSON にフォールバック）
- 理由: 実装エージェントがビルドスクリプトを書く際の最初の判断点

### [Should] D-S01: タグ（`tags`）の統制ルールがない

- 対象: [data-model.md](../design/data-model.md)
- 内容: `tags` は自由入力配列。表記揺れ（`pasta` vs `Pasta` vs `パスタ`）で絞り込みが汚染される
- 推奨対応: 以下のいずれか
  1. タグも閉じたタクソノミー（ジャンルと同様）
  2. 自由入力だが小文字 + ハイフン区切りを規約化、Google Sheets の入力規則で検証
  3. MVP では `tags` を保持するが UI で絞り込みに使わない（表示のみ）

### [Should] D-S02: ID 生成が手動で重複サフィックス管理も手動

- 対象: [data-model.md](../design/data-model.md)
- 内容: `<city>-<slug>` の手動生成 + 重複時のサフィックス（`-2`）も手動。データ追加時のヒューマンエラー源
- 推奨対応: ビルド時に `name` + `city` からハッシュベースで生成（衝突時は安定的な命名）、または Google Sheets の数式で自動生成

### [Should] D-S03: GitHub Actions 定期再ビルドの実装方法が未確定

- 対象: [tech-stack.md](../design/tech-stack.md)
- 内容: 「1 日 1 回 cron」とあるが、Vercel 側のデプロイフックを叩く方式か、GitHub Actions 内で直接ビルド + デプロイするかが未定
- 推奨対応: Vercel Deploy Hooks を GitHub Actions の cron から叩く方式が最も簡素。Webhook URL の保管場所も合わせて明記

### [Should] D-S04: `country` フィールドの必要性

- 対象: [data-model.md](../design/data-model.md)
- 内容: MVP では `IT` 固定なのに必須フィールド。今は実質意味がない
- 推奨対応: いずれか
  1. MVP では省略（将来追加時にスキーマ拡張）
  2. デフォルト値 `IT` で必須 → 入力負担はあるが将来拡張に強い

要件 D-002（特定都市のみ）と合わせると、(1) が MVP には素直。

### [Nice] D-N01: Astro のクライアントアイランド境界が不明

- 対象: [tech-stack.md](../design/tech-stack.md), [ui-wireframes.md](../design/ui-wireframes.md)
- 内容: フィルタはクライアントで動く必要があるが、Astro でどこを `client:load` / `client:visible` にするか方針なし
- 推奨対応: 実装時に決定で OK。`Map.astro` と `FilterBar.astro` がクライアントアイランド、他は静的

### [Nice] D-N02: ボトムシートのライブラリ選定

- 対象: [ui-wireframes.md](../design/ui-wireframes.md)
- 内容: モバイル地図タブのボトムシート（ピンタップ時）の実装ライブラリ未指定
- 推奨対応: 軽量実装が望ましい。CSS のみで OK（Vaul 等のライブラリは不要）

### [Nice] D-N03: ジャンル `other` の運用

- 対象: [data-model.md](../design/data-model.md)
- 内容: `other` を許可しているが、これが多発するとタクソノミーが形骸化
- 推奨対応: `other` 使用時は `tags` で詳細を残すルール、または運用後にタクソノミー追加を検討

---

## 判定（初回）

| 区分 | 件数 |
|---|---|
| Must | 1 |
| Should | 4 |
| Nice | 3 |

**Must が 1 件残っているため、要件定義エージェントに差し戻し。**

---

## 再レビュー（2026-05-18）

### Must 対応の確認

- **D-M01**: ✅ 解決。`tech-stack.md` に gviz/tq エンドポイント、シート ID の Vercel 環境変数管理、フォールバック方針が明記された

### Should 対応の確認

- **D-S01**: ✅ 解決。タグ規約（小文字 + ハイフン、Sheets 入力規則）が明記され、MVP では表示のみと整理された
- **D-S02**: ✅ 解決。ID 生成がビルド時のハッシュベース自動化に変更された
- **D-S03**: ✅ 解決。Vercel Deploy Hooks + GitHub Actions cron 方式が明記された
- **D-S04**: ✅ 解決。`country` フィールドが MVP から省略された

### Nice

- D-N01（Astro アイランド境界）: 実装時に確定。`tech-stack.md` で参照あり
- D-N02（ボトムシート）: 実装時に確定。CSS のみ方針
- D-N03（ジャンル `other`）: 運用後に判断

---

## 承認

- 承認日: 2026-05-18
- 状態: **APPROVED**
- コメント: Must 1 件・Should 4 件すべて解決。Nice 3 件は実装中の判断に委ねる

---

## 追加レビュー: キュレーション設計（D-016 〜 D-019）

### 対象
- [docs/design/data-model.md](../design/data-model.md) の source / sourceTrust / verdict / concerns / highlights 追加
- [docs/requirements/03-functional-req.md](../requirements/03-functional-req.md) F-11 / F-12 / F-13
- [docs/curation-guide.md](../curation-guide.md)（予定）
- [docs/ai-prompt-template.md](../ai-prompt-template.md)（予定）

### 観点と判定

- **タクソノミーの妥当性**: ✓ concerns 10 種・highlights 10 種は旅行者視点で過不足なし
- **AI の役割定義**: ✓ 「発見ではなく評価分類」と明確化（D-017）→ 幻覚リスク排除
- **プライバシー / セキュリティ**: ✓ AI 呼び出しはアプリ外（プロンプトテンプレ + 手動）。アプリ自体に API キー不要
- **シートとの整合**: ✓ `concerns` / `highlights` は JSON 文字列でセル格納する設計が明示されている
- **既存機能との衝突**: なし。フィールド追加 + UI 拡張のみ
- **タクソノミー進化の余地**: Open issue として「タクソノミー追加・統廃合のプロセス」を残すべき（下記指摘）

### 指摘

#### [Nice] D-N04: タクソノミー更新プロセスが未定義

- 内容: concerns / highlights / source が将来追加・統廃合される可能性が高いが、誰がいつ更新するかが未定
- 推奨対応: `decisions-log.md` でタクソノミー追加を D-XXX として記録する運用ルールを明文化（Plan Manager の責務）。実装は不要

#### [Nice] D-N05: AI 出力の検証手段がない

- 内容: AI が出力した JSON がスキーマ違反だった場合、シートに貼ったあとビルド時にエラーになる可能性
- 推奨対応: ローダーで未知の concern / highlight タイプを警告するだけで除外し、ビルド継続。実装エージェントの判断で対応可

### 承認

- 承認日: 2026-05-18
- 状態: **APPROVED**（キュレーション設計追加）
- コメント: Must / Should なし。Nice 2 件は実装中または将来運用で対応
