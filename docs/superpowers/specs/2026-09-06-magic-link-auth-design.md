# マジックリンク認証 設計 (D-034)

日付: 2026-09-06 / 状態: 承認済み (ユーザー確認: 認証方式の選択肢 3 案からマジックリンク方式を選択)

## 課題

パスワード (`ADMIN_PASSWORD`) が `sessionStorage` 保存のためタブを閉じるたびに消え、
開くたびに再入力が必要。入力するまで同期も走らないため、ToDo/旅程の同期が「だるい」。
利用者は本人 + パートナーの 2 人のみ。

## 決定

`#key=<ADMIN_PASSWORD>` 付き URL を一度開くだけで localStorage に永続保存し、
以後は入力ゼロ・同期全自動にする。

## 設計

1. **共有モジュール新設** `src/lib/password-client.ts`
   - `bootstrapPasswordFromUrl()`: URL フラグメント `#key=...` を検出 → localStorage に保存 →
     `history.replaceState` で URL から即除去。旧 sessionStorage 保存分も localStorage へ移行
   - `getPassword / setPassword / clearPassword`: 保存先を localStorage に一元化
2. **置き換え**: `src/pages/todo.astro` / `src/pages/itinerary.astro` /
   `src/components/ChatPanel.astro` の重複ローカル実装 (sessionStorage 版) を削除し import に置換。
   各スクリプト冒頭で `bootstrapPasswordFromUrl()` を呼ぶ
3. **同期強化**: todo / itinerary に `visibilitychange` (visible 復帰時) の自動再同期を追加
   (スマホでタブに戻った時に最新化)
4. **フォールバック**: 401 時は `clearPassword()` → 既存のパスワード入力 UI (変更なし)
5. **サーバー変更なし**: `src/lib/auth.ts` / 各 API はそのまま

## セキュリティトレードオフ

- フラグメント (`#key=`) はサーバー・アクセスログに送信されない (クエリ `?key=` は不採用)
- リンク所持者 = 全権限。2 人利用の私的アプリとして許容。漏洩時は Vercel の
  `ADMIN_PASSWORD` 変更で全リンク即失効
- localStorage 永続化により端末を触れる人はアクセス可能 (従来の sessionStorage と大差なし)

## テスト

- ビルド (`pnpm build`) 通過
- 手動確認手順: `#key=` 付き URL → URL から消える / リロード後も同期が自動で走る /
  誤パスワードで 401 → 入力 UI に戻る
