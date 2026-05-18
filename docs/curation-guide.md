# キュレーションガイド

Google Maps の広告と観光客レビューに頼らず、信頼できる情報源から店を探すための手順書。

## 基本原則

1. **発見は人間、評価分類は AI** — 店の存在と一次情報は信頼できるソースから取り、その後の整理と注意点抽出を AI に任せる
2. **出典を必ず残す** — `source` フィールドに「どこから知ったか」を必ず記録
3. **観光客レビューを直接参考にしない** — Google / TripAdvisor の星評価は最終手段。先に下記の信頼ソースを当たる

## 信頼できる情報源（信頼層別）

### 🥇 ティア 1（high trust）

| ソース | URL | 強み | `source` 値 |
|---|---|---|---|
| **Gambero Rosso** | https://www.gamberorosso.it/ | イタリア最高峰の食ガイド。トレ・フォルケッテ評価は業界基準 | `gambero-rosso` |
| **50 Top Pizza** | https://www.50toppizza.it/ | ピザ専門の世界ランキング。業界内評価が高い | `50-top-pizza` |
| **Slow Food "Osterie d'Italia"** | https://www.slowfood.it/osterie-ditalia/ | 「家族経営・郷土料理・観光客向けでない」が選定基準そのもの | `slow-food` |
| **Identità Golose** | https://www.identitagolose.it/ | 食ジャーナリスト系の評論サイト | `identita-golose` |

### 🥈 ティア 2（medium trust）

| ソース | URL / 例 | `source` 値 |
|---|---|---|
| 食ブログ／インフルエンサー | Puok e Med（ナポリのピザ）、Stanislao Porzio など個別に判断 | `food-blogger` |
| Reddit ローカルコミュニティ | r/rome, r/italyfood, r/florence | `reddit-local` |
| 友人推薦 | 旅人やイタリア在住者からの直接推薦 | `friend` |
| 一般ガイドブック | Lonely Planet, Rough Guide | `guidebook` |

### 🥉 ティア 3（low trust、最終手段）

| ソース | 注意点 | `source` 値 |
|---|---|---|
| Google Maps | 観光客向けの罠や広告の影響大、参考程度 | `google-maps` |
| その他 | 出典不明・自分の勘 | `other` |

## ワークフロー（店を 1 件追加するときの流れ）

```
[1. 信頼ソースから候補発見]
       ↓
[2. 一次情報を集める（公式サイト、レビュー等）]
       ↓
[3. AI プロンプトに投入]   ← docs/ai-prompt-template.md を使う
       ↓
[4. AI が返した JSON を確認・微修正]
       ↓
[5. Google Sheets に貼り付け]
       ↓
[6. 次回ビルドでサイトに反映]
```

### ステップ詳細

#### 1. 候補発見

例: 「ローマのトラットリア」を探す
- Gambero Rosso で「Roma → Trattorie」を検索
- Slow Food のローマ章を見る
- Reddit `r/rome` で `best trattoria` を検索（フィルタ: `Local recs` などのフレーズで絞る）

複数のソースで言及される店ほど信頼度が高い。

#### 2. 一次情報収集

候補が決まったら以下を集める:
- 店名（正式名称、イタリア語表記）
- 住所（Google Maps から）
- 緯度経度（Google Maps URL の `@` 以降の数字）
- 公式サイト URL（あれば）
- 主要なレビュー断片（イタリア語の地元レビュー優先）
- ジャンル・価格帯の目安

#### 3. AI プロンプトに投入

[docs/ai-prompt-template.md](ai-prompt-template.md) のテンプレートを Claude / ChatGPT にコピペし、上記の情報を埋めて投入。

#### 4. AI 出力の確認

AI が返した JSON には以下が含まれる:
- `verdict`: 総合判定（recommended / neutral / caution / skip）
- `concerns[]`: 負のシグナル + severity + note
- `highlights[]`: 正のシグナル + note

特に確認すべき点:
- `tourist-oriented` が high で出ているか（観光地の罠なら警戒）
- `mediocre-food` が出ていたら、なぜそう判定したかの note を読む
- `highlights` に「料理の特徴」が出ているか（出ていない場合は note を自分で補強）

#### 5. シート貼り付け

Google Sheets の対応する行に以下のカラムを埋める:
- `name`, `city`, `area`, `genre`, `priceRange`, `lat`, `lng`, `address`, `url`
- `source`（ティア表のスラグ）, `sourceTrust`（high/medium/low、既定値はティア表の通り）
- `verdict`, `concerns`（JSON 文字列）, `highlights`（JSON 文字列）, `lastAnalyzed`

#### 6. ビルドで反映

`pnpm dev` を再起動するか、Vercel のデプロイフックを叩いて再ビルド。

## 都市別おすすめスタート地点

### Rome
1. Gambero Rosso の "Tre Forchette Roma" リスト
2. Slow Food "Osterie d'Italia" のローマ章
3. Reddit `r/rome` の `weekly food thread`

### Florence
1. Gambero Rosso "Tre Forchette Toscana"
2. Slow Food トスカーナ章
3. ジェラートは Gambero Rosso "Gelaterie d'Italia" を参照

### Sicily
1. Slow Food シチリア章（魚介・郷土料理が充実）
2. 50 Top Pizza のシチリア勢
3. パスティッチェリアは Identità Golose を参照
4. パレルモ・カターニア・タオルミーナで都市性質が違うので area で区別する

## 表記揺れの避け方

- 店名は **公式サイトかシェフ本人の表記** を優先（例: `Trattoria Da Enzo al 29`、`al 29` まで含める）
- `area` は **イタリア語の地区名** を使う（例: `Trastevere`, `Centro Storico`）
- `tags` は **小文字 + ハイフン**（例: `pizza-al-taglio`, `lunch-only`）

## メンテナンス

- 行った後に `visited: TRUE`、`visitDate`、`rating`、`comment` を更新
- 実際に行って AI 評価と乖離があった場合は `concerns` / `highlights` を手動で修正
- 大きな印象違いがあれば、その出典の `sourceTrust` を再評価する判断材料にする
