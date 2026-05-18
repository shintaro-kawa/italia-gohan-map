# デプロイ手順（Phase 4）

イタリアご飯マップを **Vercel** に公開し、**GitHub Actions の cron** で 1 日 1 回 Google Sheets を再取得する仕組みを完成させるまでの手順。

## 全体像

```
[Google Sheets]
  ↓ ビルド時 fetch（gviz/tq）
[Vercel (Astro 静的サイト)]
  ↑ Deploy Hook で再ビルド trigger
[GitHub Actions cron (1 日 1 回)]
```

## 前提

- ローカルで `pnpm build` が成功している（Phase 3 完了済み）
- GitHub アカウントを持っている
- Vercel アカウントを持っている（GitHub アカウントで sign-up 可、無料枠で完結）
- Google アカウント（Google Sheets を作成・公開する用）

---

## STEP 1: Git リポジトリの初期化

PowerShell でプロジェクトディレクトリに移動し:

```powershell
cd "c:\Users\sinnt\OneDrive\デスクトップ\イタリアご飯"

# git ユーザー設定（初回のみ。グローバルでよければ --global）
git config --global user.name "あなたの名前"
git config --global user.email "あなたのメール"

# リポジトリ初期化
git init -b main

# .env.local が誤って入っていないか確認
git status
```

`.env.local` が表示されないことを確認（`.gitignore` で除外済み）。

### 初回コミット

```powershell
git add .
git commit -m "Initial commit: イタリアご飯マップ MVP"
```

---

## STEP 2: GitHub にプッシュ

### 選択肢 A: GitHub Web で新規リポジトリ作成（推奨）

1. [https://github.com/new](https://github.com/new) を開く
2. Repository name: `italia-gohan-map`（任意）
3. **Public / Private のどちらでも可**（サイトは noindex なので Public でも検索流入はなし）
4. 「Initialize this repository with」のチェックは **すべて外す**（既存のローカルコミットを使うため）
5. Create repository をクリック
6. 表示された手順の中から「…or push an existing repository from the command line」を採用

```powershell
git remote add origin https://github.com/<あなたのユーザー名>/italia-gohan-map.git
git push -u origin main
```

初回プッシュで GitHub のログインダイアログ（ブラウザ）が出る場合あり。

### 選択肢 B: gh CLI を使う（要インストール）

```powershell
winget install GitHub.cli
# 新しい PowerShell を開く
gh auth login
gh repo create italia-gohan-map --private --source=. --push
```

---

## STEP 3: Google Sheets の準備

`SHEETS_ID` を未設定でも `data/restaurants.json` のサンプルで動きますが、シート連携を有効にするには以下:

### 3-1. シートを作成

1. [Google Sheets](https://sheets.google.com) で新規スプレッドシート作成
2. シート名（タブ名）を **`restaurants`** に変更
3. 1 行目に以下のヘッダーを **そのまま** 入力（順不同・列の余り OK）

```
name	city	area	genre	priceRange	lat	lng	address	visited	visitDate	rating	comment	url	tags	source	sourceTrust	verdict	concerns	highlights	lastAnalyzed
```

4. 2 行目以降に既存の `data/restaurants.json` 6 件を移植（or 新規追加）
5. `concerns` / `highlights` 列は JSON 文字列で入れる（例: `[{"type":"family-run"}]`）

### 3-2. シートを「リンクを知っている全員が閲覧可能」に公開

1. 右上「共有」ボタン
2. 「リンクを知っている全員」を選択
3. 権限は **閲覧者** のままで OK
4. 「コピー」でリンクを取得

### 3-3. シート ID を控える

シート URL から ID を抽出:

```
https://docs.google.com/spreadsheets/d/<ここがSHEETS_ID>/edit?gid=0
```

`/d/` と `/edit` の間の長い文字列が `SHEETS_ID`。控えておく。

---

## STEP 4: Vercel にデプロイ

### 4-1. プロジェクト作成

1. [https://vercel.com/new](https://vercel.com/new) を開く
2. GitHub でログイン（初回はリポジトリアクセス権を付与）
3. 先ほど作った `italia-gohan-map` リポジトリを「Import」
4. Framework Preset が **Astro** に自動検出されることを確認
5. Build Command: `pnpm build`（自動）/ Output Directory: `dist`（自動）/ Install Command: `pnpm install`（自動）

### 4-2. 環境変数を設定

「Environment Variables」セクションで:

| Name | Value |
|---|---|
| `SHEETS_ID` | STEP 3-3 で控えた文字列 |
| `SHEET_NAME` | `restaurants` |

Production / Preview / Development 全部にチェック。

### 4-3. Deploy

「Deploy」ボタンをクリック。初回は 1〜2 分。

完了すると `https://italia-gohan-map-xxxx.vercel.app` のような URL が発行される。

---

## STEP 5: Vercel Deploy Hook を発行

GitHub Actions から Vercel の再ビルドを叩くための URL。

1. Vercel ダッシュボード → プロジェクトを開く
2. Settings → Git → 「Deploy Hooks」セクション
3. 「Create Hook」
   - Hook Name: `daily-sheets-sync`
   - Git Branch Name: `main`
4. 発行された URL（`https://api.vercel.com/v1/integrations/deploy/...`）を **コピー**

---

## STEP 6: GitHub Secrets に Deploy Hook URL を登録

1. GitHub の対象リポジトリ → Settings → Secrets and variables → Actions
2. 「New repository secret」
   - Name: `VERCEL_DEPLOY_HOOK_URL`
   - Secret: STEP 5 でコピーした URL
3. 「Add secret」

これで `.github/workflows/rebuild.yml` の cron（毎日 UTC 03:00 / JST 12:00）で自動再ビルドが回る。

### 動作確認（手動トリガー）

1. GitHub の Actions タブ → `Daily Rebuild` を選択
2. 右上「Run workflow」→ Run
3. 数秒後にジョブが緑になり、Vercel ダッシュボードで新しいデプロイが走っているのを確認

---

## STEP 7: 本番動作確認チェックリスト

Vercel の URL を **スマホとPCの両方** で開いて確認:

### A. 基本動作
- [ ] サイトが 200 で表示される
- [ ] カード 6 枚が表示される
- [ ] フィルタ（都市・ジャンル・訪問）が動く
- [ ] 地図タブでピン表示
- [ ] カードクリックで詳細モーダル
- [ ] URL クエリ同期（`?city=Rome`）

### B. F-10 現在地表示（スマホ実機推奨）
- [ ] 地図タブ右上の「📍 現在地」ボタン押下
- [ ] ブラウザの位置情報許可ダイアログが出る
- [ ] 許可 → 地図上に青い丸 + 精度円
- [ ] 拒否 → トースト「位置情報の利用が許可されていません」

### C. SEO 設定
- [ ] DevTools で `<meta name="robots" content="noindex, nofollow">` を確認
- [ ] `https://<your-domain>/robots.txt` で `Disallow: /` を確認

### D. Google Sheets 連携
- [ ] Google Sheets に新しい行を追加
- [ ] GitHub Actions の `Run workflow` を手動実行
- [ ] 数分後、サイトをリロードして新店舗が表示される

---

## トラブル対処

### Vercel ビルドが失敗する
- ビルドログを確認
- `pnpm-lock.yaml` を commit していない場合は `git add pnpm-lock.yaml && git commit -m "Add lockfile"` でプッシュ
- `package.json` の `pnpm.onlyBuiltDependencies` 設定が反映されていない場合、Vercel のビルドキャッシュをクリア

### Sheets からデータが取れない
- シートが本当に「リンクを知っている全員」になっているか確認
- シート名（タブ名）が `restaurants` か確認
- 環境変数 `SHEETS_ID` の値を再確認（URL ごと貼っていないか）
- フォールバックで `data/restaurants.json` が使われるので、致命的にはならない

### GitHub Actions が失敗する
- Secret 名が `VERCEL_DEPLOY_HOOK_URL` で完全一致しているか
- Hook URL が期限切れではないか（Vercel で再発行可能）

### 現在地が取得できない
- HTTPS で開いているか（Vercel の URL は自動で HTTPS）
- スマホの「設定 → ブラウザ → 位置情報」が許可になっているか
- 屋内・地下では GPS が弱いので、屋外で再試行

---

## 完了後の運用

- 店舗追加: Google Sheets に行を追加 → 翌日の cron で自動反映 / 即時反映したいときは Actions を手動実行
- 訪問記録: `visited` を TRUE に変更し、`visitDate` / `rating` / `comment` を更新
- AI 評価: 新店追加時に [docs/ai-prompt-template.md](docs/ai-prompt-template.md) のプロンプトを使う
- ソース選定: [docs/curation-guide.md](docs/curation-guide.md) のティア表を参照

---

## エージェントへの引き継ぎ

完了したら [docs/plan/project-plan.md](docs/plan/project-plan.md) の Phase 4 DoD を全て ✅ にしてください（または "完了しました" と教えてもらえれば Plan Manager として更新します）。
