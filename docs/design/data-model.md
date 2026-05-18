# データモデル

## 概要

データソースは **Google Sheets**（[tech-stack.md](tech-stack.md) 参照）。シートの 1 行 = 1 店舗 とし、ビルド時に JSON 化して静的サイトに埋め込む。

## 店舗 (Restaurant) スキーマ

```json
{
  "id": "rome-trattoria-da-enzo",
  "name": "Trattoria Da Enzo al 29",
  "city": "Rome",
  "area": "Trastevere",
  "genre": "trattoria",
  "priceRange": "€€",
  "lat": 41.8896,
  "lng": 12.4696,
  "address": "Via dei Vascellari, 29, 00153 Roma RM",
  "visited": true,
  "visitDate": "2026-04-15",
  "rating": 5,
  "comment": "カチョエペペが絶品。予約必須。",
  "url": "https://www.daenzoal29.com/",
  "tags": ["pasta", "local", "reservation-required"],
  "source": "gambero-rosso",
  "sourceTrust": "high",
  "verdict": "recommended",
  "concerns": [
    { "type": "long-wait", "severity": "low", "note": "予約しないと並ぶ" }
  ],
  "highlights": [
    { "type": "family-run", "note": "1980 年代から続く" },
    { "type": "locals-frequent" },
    { "type": "signature-dish", "note": "カチョエペペ" }
  ],
  "lastAnalyzed": "2026-05-18"
}
```

> `country` フィールドは MVP では省略（イタリア国内のみが対象のため）。他国対応する将来段階で追加。

## フィールド定義

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | string | Yes | 一意な識別子。**ビルド時に自動生成**（下記「ID 生成ルール」参照） |
| `name` | string | Yes | 店舗名（イタリア語表記推奨） |
| `city` | string | Yes | 都市・地域名（MVP では `Rome` / `Florence` / `Sicily`。粒度の補足は [01-overview.md](../requirements/01-overview.md)） |
| `area` | string | No | 都市内のエリア・地区名（例: `Trastevere`, `Centro Storico`） |
| `genre` | enum | Yes | ジャンル（下記タクソノミー参照） |
| `priceRange` | enum | No | `€` / `€€` / `€€€` / `€€€€` |
| `lat` | number | Yes | 緯度（小数第 4 位以上を推奨） |
| `lng` | number | Yes | 経度（小数第 4 位以上を推奨） |
| `address` | string | No | 住所（フル表記） |
| `visited` | boolean | Yes | 訪問済みかどうか（デフォルト `false`） |
| `visitDate` | string (ISO date) | No | 訪問日。`visited === true` のときに有効 |
| `rating` | number (1-5) | No | 評価（訪問済み店舗のみ意味を持つ） |
| `comment` | string | No | 自由記述コメント |
| `url` | string (URL) | No | 公式サイト or 参考リンク |
| `tags` | array of string | No | 自由タグ（**小文字 + ハイフン区切り**、下記「タグ規約」参照） |
| `source` | enum | No | 推薦元の出典スラグ（下記「出典タクソノミー」参照） |
| `sourceTrust` | enum | No | `high` / `medium` / `low` |
| `verdict` | enum | No | `recommended` / `neutral` / `caution` / `skip`（AI が付与） |
| `concerns` | array | No | 負のシグナル（下記「concern タクソノミー」参照） |
| `highlights` | array | No | 正のシグナル（下記「highlight タクソノミー」参照） |
| `lastAnalyzed` | string (ISO date) | No | AI 分析を最後に行った日付 |

## ジャンル タクソノミー（閉じたリスト）

| 値 | 表示名 | 説明 |
|---|---|---|
| `pizzeria` | ピッツェリア | ピザ専門店 |
| `trattoria` | トラットリア | 庶民的な家庭料理レストラン |
| `osteria` | オステリア | 簡素な郷土料理 |
| `ristorante` | リストランテ | 正餐レストラン |
| `enoteca` | エノテカ | ワインバー（軽食あり） |
| `bar` | バール | カフェ・軽食 |
| `gelateria` | ジェラテリア | ジェラート店 |
| `paninoteca` | パニノテカ | パニーノ専門店 |
| `pasticceria` | パスティッチェリア | 菓子店 |
| `other` | その他 | 上記に該当しない場合 |

> 注: 将来追加の場合は data-model.md と Google Sheets の入力規則を同時に更新する。

## 地域の粒度

3 階層: `country` → `city` → `area`

- `country` は MVP では `IT` 固定だが、将来「他国も追加」できる構造として保持
- `city` は絞り込みの主軸（F-2）
- `area` は詳細表示用。絞り込みには使わない（MVP）

## 出典タクソノミー（source）

| 値 | 表示名 | 信頼層（既定 sourceTrust） |
|---|---|---|
| `gambero-rosso` | Gambero Rosso | high |
| `50-top-pizza` | 50 Top Pizza | high |
| `slow-food` | Slow Food（Osterie d'Italia） | high |
| `identita-golose` | Identità Golose | high |
| `food-blogger` | 食ブログ／インフルエンサー | medium |
| `reddit-local` | Reddit r/italy 等のローカル投稿 | medium |
| `friend` | 友人推薦 | medium |
| `guidebook` | 一般ガイドブック（Lonely Planet 等） | medium |
| `google-maps` | Google Maps | low |
| `other` | その他 | low |

> `sourceTrust` は上記の既定値で OK だが、特定店舗のみ手動で上書きも可能（例: friend からの推薦でも、その友人が業界人なら high）。

## concern タクソノミー（負のシグナル）

| 値 | 説明 |
|---|---|
| `tourist-oriented` | 観光客向けに最適化されている |
| `overpriced` | 価格に見合わない |
| `mediocre-food` | 料理が平凡 |
| `quality-declined` | 昔は良かったが品質低下 |
| `not-authentic` | 本場っぽくない（フュージョン的・チェーン的） |
| `service-issues` | サービスの粗雑・差別的扱い |
| `hidden-fees` | コペルト過大・チップ強要 |
| `language-barrier-eng-only` | 英語前提（地元客が来ない兆候） |
| `long-wait` | 待ち時間が品質に見合わない |
| `crowded-noisy` | 混雑・騒音で味わえない |

各 concern は `severity: low / medium / high` と `note?: string` を持つ。

## highlight タクソノミー（正のシグナル）

| 値 | 説明 |
|---|---|
| `locals-frequent` | 地元客が多く通う |
| `family-run` | 家族経営 |
| `generations-old` | 何世代も続く老舗 |
| `signature-dish` | 名物料理がある |
| `hidden-gem` | 評価控えめだが質が高い隠れた名店 |
| `award-winning` | Gambero Rosso 等の受賞歴 |
| `seasonal-menu` | 季節メニューあり |
| `fresh-ingredients` | 地元食材・新鮮さ重視 |
| `innovative` | 革新的な料理（伝統 + 工夫） |
| `value-for-money` | 質の割に安い |

各 highlight は `note?: string`（任意の補足）を持つ。

## verdict 決定ルール（参考）

AI が以下の基準で判定:

| verdict | 条件 |
|---|---|
| `recommended` | concerns が空または severity = low のみ、かつ highlights が 1 つ以上 |
| `neutral` | concerns が medium 含むが致命的でない、highlights あり |
| `caution` | concerns に medium が複数、または high が 1 つ |
| `skip` | `mediocre-food` や `tourist-oriented` が high、もしくは high concern が 2 つ以上 |

実装上は `verdict` を AI 出力の値そのまま信頼する（ルールはガイドライン）。

## タグ規約

- **書式**: 小文字 + ハイフン区切り（kebab-case）。例: `pasta`, `vegetarian-friendly`, `reservation-required`
- **言語**: 英語推奨（フィルタの一貫性のため）
- **MVP での UI 上の扱い**: 詳細画面に **表示するのみ**。MVP では絞り込みには使わない
- **入力検証**: Google Sheets の入力規則（カスタム数式 `=REGEXMATCH(...)`）で書式チェック

将来拡張: タグのタクソノミー化（よく使われるタグを閉じたリスト化）

## Google Sheets のカラム構成

Google Sheets の 1 行目をヘッダーとし、`id` 以外のフィールド名をそのまま使用する（`name`, `city`, `area`, `genre`, ...）。`id` は **シートには含めない**（ビルド時自動生成）。

`concerns` と `highlights` は配列なので、シートでは **JSON 文字列としてセルに格納**する（例: `[{"type":"family-run"}]`）。

入力規則（データ検証）の推奨:
- `city`: `Rome` / `Florence` / `Sicily` のプルダウン（MVP）
- `genre`: ドロップダウンで上記タクソノミーから選択
- `visited`: TRUE / FALSE
- `priceRange`: `€` / `€€` / `€€€` / `€€€€` のプルダウン
- `tags`: カスタム数式で `^[a-z0-9-, ]*$` を検証
- `source`: 上記出典タクソノミーのプルダウン
- `sourceTrust`: `high` / `medium` / `low` のプルダウン
- `verdict`: `recommended` / `neutral` / `caution` / `skip` のプルダウン
- `concerns`, `highlights`: 自由テキスト（JSON 形式、AI 出力をそのまま貼る想定）

## ID 生成ルール

- **ビルド時に自動生成**: `name` + `city` をハッシュ（短いハッシュ、例: SHA-1 の先頭 8 文字）
- 例: `rome-a1b2c3d4`（city を prefix にしてデバッグしやすく）
- 同じ name + city があれば同じ ID になる（冪等性）。スキーマ違反を未然に防ぐ
- 緯度経度の取得は **Google Maps の URL からコピー**（手作業。シートに `lat`, `lng` 列）

## サンプルデータ

実装エージェントが `data/restaurants.json` に 3〜5 件のサンプルを投入する想定。

## 更新履歴

- 2026-05-18: 初版作成（要件定義エージェント）
- 2026-05-18: レビュー指摘 D-S04 / I-014 対応で `country` を MVP から省略。D-S02 / I-012 対応で ID 生成をハッシュベース自動化。D-S01 / I-011 対応でタグ規約を追加
- 2026-05-18: D-016 〜 D-019 に基づき source / sourceTrust / verdict / concerns / highlights / lastAnalyzed フィールド追加。3 つの新タクソノミー（出典 10 種、concern 10 種、highlight 10 種）を定義
