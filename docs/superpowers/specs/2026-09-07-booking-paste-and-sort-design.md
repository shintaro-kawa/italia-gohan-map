# 予約貼り付け→旅程登録 + 並び替え修正 設計 (D-035)

日付: 2026-09-07 / 状態: 承認済み (登録前の確認カード方式・キュレーションスコア順を選択)

## ① 予約確認の貼り付け → 旅程登録

### 課題

予約完了メールや WhatsApp 通知を旅程に転記する手作業が発生している。

### 設計

- **サーバー** (`src/lib/anthropic.ts` / `api/chat.ts`):
  - system prompt に第 2 モードを追加。貼られたテキストが予約確認 (メール本文 /
    WhatsApp 通知 / 予約サイト確認文) なら、店舗候補ではなく `itineraryDraft` を返す
  - スキーマは ItineraryItem 準拠: `type / title / startAt / endAt? / location? / notes? / amount? / currency?`
  - 年の記載がない日付は 2026 年と解釈。時刻は現地時刻のまま。読み取れないフィールドは省略 (憶測禁止)
  - `api/chat.ts` で `sanitizeItineraryDraft()` を通し、レスポンスに `itineraryDraft` を追加
  - 既存のレストラン提案フローは共存 (モード判定は Claude)
- **クライアント** (`src/components/ChatPanel.astro`):
  - `itineraryDraft` を受けたら確認カード表示 (種別絵文字・タイトル・日時・場所・金額・メモ)
  - 「🗓 旅程に登録」ボタン → `/api/sync-itinerary` に `{writes:[item]}` を直接 POST
    (id: `chat-<random>`, updatedAt: now、パスワードは localStorage のもの)
  - 成功で「✓ 登録しました」。旅程ページには既存の同期で全端末反映。サーバー同期 API は無変更

## ② 並び替え修正 (キュレーションスコア順)

### 課題 (根本原因)

595 件中 rating 保持 0 件、verdict は 570/595 が同値、lastAnalyzed は 4 種のみ。
全ソートモードが同点となり、最終 tiebreak の名前順に落ちる = どれを選んでもほぼ
アルファベット順に見える。

### 設計

- `src/lib/curation-score.ts` 新設:
  `score = verdict(recommended+20/neutral+10/caution−10/skip−30) + sourceTrust(high+3/medium+1) + min(highlights,5) − Σconcerns(low1/medium2/high3)`
- `RestaurantCard.astro` に `data-sort-score` を出力
- `index.astro`: 「おすすめ順」= score 降順 (同点は名前順)。「新着順」の tiebreak を
  名前順 → score 順に変更。`rating` は Sort 型・select から削除し、URL の `sort=rating` は
  `recommended` に読み替え (後方互換)
- `FilterBar.astro`: 「評価順」オプション削除

## テスト

- ビルド通過 + 手動確認: 予約メール例文を貼って確認カード → 登録 → 旅程ページに出る /
  おすすめ順で 50 Top Pizza 等の受賞店が上位に来る
