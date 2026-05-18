# 要件レビュー

レビュー実施日: 2026-05-18
レビュアー: レビューエージェント

## レビュー対象

- [docs/requirements/01-overview.md](../requirements/01-overview.md)
- [docs/requirements/02-user-stories.md](../requirements/02-user-stories.md)
- [docs/requirements/03-functional-req.md](../requirements/03-functional-req.md)
- [docs/requirements/04-non-functional-req.md](../requirements/04-non-functional-req.md)

## 全体評価

全 4 ドキュメントとも構成が明快で、目的・スコープ・ユーザー・機能・非機能の対応関係が追える。MVP のスコープが「絞り込まれた最小機能」に収まっており、適切。
ただし **編集フローが機能要件として明示されていない** 点が Must。その他は Should / Nice レベル。

---

## 指摘事項

### [Must] R-M01: 編集フロー（US-06）が機能要件に存在しない

- 対象: [03-functional-req.md](../requirements/03-functional-req.md), [02-user-stories.md](../requirements/02-user-stories.md)
- 内容: US-06「気になった店をスマホからすぐ追加したい」が機能要件 F-* に対応していない。「Google Sheets で編集する」というデータソース側の挙動は技術設計だが、ユーザー視点の機能としてサイトに何があるか（例: ヘッダーの「+ 追加」ボタンが Google Sheets を開く）が未定義
- 推奨対応: F-9（仮）として「外部データソースを開く導線」を追加し、UI 上の位置と挙動を明記
- 理由: 機能要件にない動線は実装エージェントが勝手に作る or 落とす可能性がある

### [Must] R-M02: 初期対応都市と地図のデフォルト中心座標が決まらない

- 対象: [01-overview.md](../requirements/01-overview.md), [03-functional-req.md](../requirements/03-functional-req.md) F-5
- 内容: F-5（地図ピン表示）の初期表示には地図の中心座標が必要だが、対象都市が未確定のため定義できない。最低でも「ローマ中心」「ナポリ中心」など 1 都市の確定が必要
- 推奨対応: ユーザーに確認し、`01-overview.md` の「対象都市」セクションで初期スコープを明示
- 理由: 実装エージェントが地図の初期パラメータを決められず、Phase 3 がブロックされる

### [Should] R-S01: 「訪問済みのみ」「未訪問のみ」が排他か共存か曖昧

- 対象: [03-functional-req.md](../requirements/03-functional-req.md) F-8
- 内容: F-8 では「訪問済みのみ」「未訪問のみ」のトグルとあるが、UI ワイヤーフレームでは「✓ 訪問済みのみ」しかない。排他か、両方表示するか、片方ずつかが UI と要件で食い違う可能性
- 推奨対応: 排他トグル（3 状態: すべて / 訪問済み / 未訪問）に統一し、文言と挙動を要件側で明記

### [Should] R-S02: アクセシビリティの目標が「Best Effort」と曖昧

- 対象: [04-non-functional-req.md](../requirements/04-non-functional-req.md)
- 内容: 「WCAG AA 相当を目標」と書きつつ、スクリーンリーダーは「Best Effort」。何を必達とし、何を努力目標にするかが不明確
- 推奨対応: 必達項目を箇条書きで明示（例: コントラスト比 / キーボード操作 / セマンティック HTML は必達、ARIA は努力目標）

### [Should] R-S03: 公開サイトのインデックスポリシーが未定義

- 対象: [04-non-functional-req.md](../requirements/04-non-functional-req.md)
- 内容: 「公開サイト」とあるが、検索エンジンにインデックスされて構わないかが書かれていない。シェアされた友人だけが見ることを想定するなら `noindex` も検討すべき
- 推奨対応: SEO 方針（インデックス可 / 不可）を明記

### [Nice] R-N01: 成功の定義に定量指標がない

- 対象: [01-overview.md](../requirements/01-overview.md)
- 内容: 「3 タップ以内」など定性的だが、利用回数や継続性の指標がない
- 推奨対応: MVP 検証期間の指標（例: 旅行 1 回で実際に使えたか）を追加できると良い

### [Nice] R-N02: 価格帯の入力ルール

- 対象: [03-functional-req.md](../requirements/03-functional-req.md), [04-non-functional-req.md](../requirements/04-non-functional-req.md)
- 内容: 価格帯は店舗ごとに人によって判断が分かれる。基準（例: € = 1 人 €15 未満）が要件にない
- 推奨対応: data-model.md または運用ルールとして基準を明記

---

## 判定（初回）

| 区分 | 件数 |
|---|---|
| Must | 2 |
| Should | 3 |
| Nice | 2 |

**Must が 2 件残っているため、要件定義エージェントに差し戻し。**

---

## 再レビュー（2026-05-18）

### Must 対応の確認

- **R-M01**: ✅ 解決。`03-functional-req.md` に F-9（外部データソースを開く導線）が追加された
- **R-M02**: ✅ 解決。`01-overview.md` に対象都市（Rome / Florence / Sicily）と地図中心方針（fitBounds）が追記された

### Should 対応の確認

- **R-S01**: ✅ 解決。F-8 が排他 3 状態（すべて / 訪問済み / 未訪問）に明確化された
- **R-S02**: ✅ 解決。必達 / 努力目標が分離された
- **R-S03**: ✅ 解決。`noindex` 方針が明記された

### Nice

- R-N01 / R-N02: 未対応。実装フェーズ中の判断 or 将来検討で OK

---

## 承認

- 承認日: 2026-05-18
- 状態: **APPROVED**
- コメント: Must 2 件・Should 3 件すべて解決。Nice 2 件は実装中の判断に委ねる

---

## 追加レビュー: F-10 現在地表示（2026-05-18）

### 対象
- [03-functional-req.md](../requirements/03-functional-req.md) F-10
- [04-non-functional-req.md](../requirements/04-non-functional-req.md) 位置情報の取り扱い

### 観点と判定

- **要件と実現性の整合**: ✓ 標準 API（Geolocation）のみで実現可能。追加依存ゼロ
- **プライバシー方針の明確さ**: ✓ 「ボタン押下時のみ取得、保存・送信なし」が両ファイルに明示。D-015 で根拠も記録済み
- **エラーハンドリングの定義**: ✓ 拒否時 / 取得失敗時の挙動（トースト表示）が要件に明記
- **HTTPS 制約の認識**: ✓ Vercel ドメインと localhost で動作する旨を明記、本番運用上の障害なし
- **既存機能との衝突**: なし。地図タブ内に閉じた追加機能

### 指摘

なし。実装エージェントが既存の Map.astro に閉じた変更で実装可能。

### 承認

- 承認日: 2026-05-18
- 状態: **APPROVED**（F-10 含むスコープ追加）
