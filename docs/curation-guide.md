# キュレーションガイド

Google Maps の広告と観光客レビューに頼らず、信頼できる情報源から店を探すための手順書。

## 基本原則

1. **発見は信頼ソース、評価分類は AI** — 店名と一次情報は信頼できる業界ソースから WebSearch / WebFetch で取得し、その後の整理と注意点抽出を AI に任せる
2. **出典を必ず残す** — `source` フィールドに「どこから知ったか」を必ず記録
3. **観光客レビューを直接参考にしない** — Google / TripAdvisor の星評価は最終手段。先に下記の信頼ソースを当たる
4. **AI 知識だけで補完しない** — Web ヒットがなかった店は候補にしない（D-021）

## 信頼できる情報源（信頼層別）

### 🥇 ティア 1（high trust）

| ソース | URL | 強み | `source` 値 | WebFetch 可否 |
|---|---|---|---|---|
| **Gambero Rosso** | https://www.gamberorosso.it/ | イタリア最高峰の食ガイド。トレ・フォルケッテ評価は業界基準 | `gambero-rosso` | ❌ **恒常的に 403** (D-023 学習 1) |
| **50 Top Pizza** | https://www.50toppizza.it/ | ピザ専門の世界ランキング。業界内評価が高い | `50-top-pizza` | ✅ HTTP リダイレクトに注意 |
| **Slow Food "Osterie d'Italia"** | https://www.slowfood.it/osterie-ditalia/ | 「家族経営・郷土料理・観光客向けでない」が選定基準そのもの | `slow-food` | ⚠ メインは制限、**regional blogs**（後述）が動く |
| **Identità Golose** | https://www.identitagolose.it/ | 食ジャーナリスト系の評論サイト | `identita-golose` | 未検証 |

#### Slow Food regional blogs（D-023 で確認、必ず先に試す）

| URL | カバー範囲 |
|---|---|
| [slowfoodpalermo.it](https://slowfoodpalermo.it/) | Palermo / Sicilia |
| 各地の slowfood<地域>.it | 個別地域（要検索） |

### 🥈 ティア 2（medium trust）

| ソース | URL / 例 | `source` 値 | WebFetch 可否 |
|---|---|---|---|
| **地元ジャーナリズム（Sicily）** | [ilsicilia.it](https://ilsicilia.it/), [palermotoday.it](https://www.palermotoday.it/), [sicilianstories.eu](https://sicilianstories.eu/) | `food-blogger` | ✅ Top-N 記事が綺麗に取れる |
| **World of Mouth** | [worldofmouth.app](https://www.worldofmouth.app/) | `food-blogger` | ✅ Florence 等で確認済 |
| **Mama Florence / 各都市ブロガー** | mamaflorence.com 等 | `food-blogger` | ✅ |
| 食ブログ／インフルエンサー | Puok e Med（ナポリのピザ）、Stanislao Porzio | `food-blogger` | 個別判断 |
| Reddit ローカルコミュニティ | r/rome, r/italyfood, r/florence | `reddit-local` | ⚠ 検索結果から拾う、フェッチは UI 障壁あり |
| 友人推薦 | 旅人やイタリア在住者からの直接推薦 | `friend` | - |
| 一般ガイドブック | Lonely Planet, Rough Guide | `guidebook` | - |

### 🥉 ティア 3（low trust、最終手段）

| ソース | 注意点 | `source` 値 |
|---|---|---|
| Google Maps | 観光客向けの罠や広告の影響大、参考程度 | `google-maps` |
| その他 | 出典不明・自分の勘 | `other` |

## フォールバックチェーン（D-023 で実証済み）

リサーチ AG は以下の順序でソースを試す。前段が落ちたら次段へ。

### Pizzeria
1. **50 Top Pizza Italia** （メインページから領域別に絞る、構造化リスト）
2. Slow Food regional（pizza に強い地域のみ）
3. 地元ジャーナリズム（"site:palermotoday.it pizzeria" 等）

### Trattoria / Osteria
1. **Slow Food regional blogs**（例: slowfoodpalermo.it）
2. ~~Gambero Rosso~~（403 のためスキップ、WebSearch のメタのみ可）
3. World of Mouth / Mama Florence / 地元食ブロガー
4. Reddit r/<city>（WebSearch でフィルタリング）

### Paninoteca / 屋台 / Street Food
1. **地元ジャーナリズムの Top-N 記事**（例: ilsicilia.it "Top Ten pani ca' meusa"）
2. palermotoday.it "Le migliori X di <city>"
3. Slow Food ストリートフード記事

### Pasticceria / Gelateria
1. Gambero Rosso "Tre Coni" / "Tre Torte" → WebSearch でメタ
2. 地元ジャーナリズム
3. Slow Food（菓子店掲載は限定的）

## ソース別抽出パターン（リサーチ AG 用）

WebSearch / WebFetch クエリのテンプレート集。`<city>` / `<genre>` は実際の値に置換。

### MICHELIN Guide（高優先）

```
WebSearch: site:guide.michelin.com <city> bib gourmand
WebSearch: site:guide.michelin.com <city> restaurants
```

- Bib Gourmand は「コスパが良い良質店」枠で、観光客の罠を除外しやすい
- 公式 URL からは住所・電話・営業時間も取れる
- ジャンル分類は MICHELIN 独自なので、こちらの `genre` タクソノミーに手動マッピング

### 50 Top Pizza（pizzeria 専用）

```
WebFetch: https://www.50toppizza.it/en/50-top-pizza-italia-2024/  (←年度に置き換え)
WebFetch: https://www.50toppizza.it/en/50-top-pizza-italia-<year>/
```

- 公開リスト形式。順位 + 店名 + 都市が一覧で取れる
- `source: 50-top-pizza`、`sourceTrust: high`、`award-winning` highlight 必須

### Gambero Rosso

```
WebSearch: site:gamberorosso.it Roma trattoria
WebSearch: site:gamberorosso.it tre forchette <city>
WebSearch: site:gamberorosso.it tre gamberi (pizzeria)
WebSearch: site:gamberorosso.it tre coni (gelateria)
```

- 「トレ・フォルケッテ」「トレ・ガンベリ」「トレ・コーニ」が最高評価
- WebFetch で記事ページから店名と評価コメントを抽出
- `source: gambero-rosso`、評価コメントは concerns / highlights の素材

### Slow Food（Osterie d'Italia）

```
WebSearch: site:slowfood.it osterie d'italia <city>
WebSearch: site:slowfoodroma.it (ローマ特化サイト)
WebSearch: "chiocciola slow food" <city>
```

- 「キオッチョラ（カタツムリマーク）」が最高評価。家族経営・郷土料理重視
- `source: slow-food`、`family-run` / `locals-frequent` highlight が頻出

### Reddit（ローカル意見）

```
WebSearch: site:reddit.com r/<city subreddit> best <genre>
WebSearch: site:reddit.com r/italy "where do locals eat" <city>
WebSearch: site:reddit.com r/AskCulinary <city> trattoria
```

- 投票数の多いコメントを優先
- 観光客投稿と地元投稿の判別: コメント主のフレア（"local"/"Roman" 等）、投稿頻度
- `source: reddit-local`、`sourceTrust: medium`

### OpenStreetMap（補助、緯度経度の確実取得）

```
WebFetch: https://nominatim.openstreetmap.org/search?q=<店名>+<city>&format=json
```

- Nominatim API は公開で API キー不要（ただしレート制限 1 req/sec）
- 名前と住所から正確な緯度経度を取得可能
- ジャンル分類は OSM tag を参照

### 重複チェック支援

```
WebSearch: <店名> <city> reddit
WebSearch: <店名> <city> 2024 (営業中確認)
WebSearch: <店名> <city> closed (閉店確認)
```

「最近閉店した」等の情報を拾うため、リサーチ AG は必要に応じてクロスチェック検索を 1 回挟む。

## クロス検証の推奨

3 ソース以上で言及された店は **信頼度が大きく上がる**:

```
候補 X が
  - Gambero Rosso でトレ・フォルケッテ
  - Slow Food でキオッチョラ
  - 50 Top Pizza ランキングに登場
→ verdict: recommended 確定、複数 highlight 付与
```

統合 AG はクロス検証情報を `highlights` の note に残す（「Gambero Rosso + Slow Food 両者掲載」など）。

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
