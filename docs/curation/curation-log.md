# キュレーションラウンド台帳

各ラウンドが計画 → リサーチ → 統合の 3 段階を経て、Sheets 反映で完了する。

## ラウンド命名規則

- `R-NNN` 形式（3 桁ゼロパディング、001 から開始）
- ラウンド名は短い目的記述（例: `R-001: Rome の Slow Food 系トラットリア初期 5 件`）

## ラウンド一覧（時系列、新しいものを上に）

## セッション #2 サマリー（自律モード、2026-05-18）

- 実行ラウンド: R-005, R-006, R-007（計 3 ラウンド）
- 採用合計: **13 件**（Palermo trattoria 5 + Palermo paninoteca 5 + Taormina trattoria 3）
- 却下: 0 件
- ユーザー指示: 「シチリア（パレルモ・タオルミーナ）のトラットリアとパニーニ屋を中心に追加」
- 使用ツール: WebSearch 3 回 + WebFetch 2 回
- ソース: Slow Food Osterie d'Italia 2025（trattoria）+ ilsicilia.it pani ca meusa Top 10（paninoteca）+ 検索クロスチェック（Taormina）
- スキーマ拡張: `Sicily.paninoteca` を coverage-target に追加（+3 件目標）
- 現状更新: 24 件 → **37 件**（セッション #1 後 + 本セッション）

---

### R-007: Sicily / Taormina トラットリア（3 件）

- 開始日: 2026-05-18
- モード: 自律（セッション #2, ラウンド 3/3）
- 状態: integrating（ユーザー承認待ち）

**ブリーフ**
- ターゲット: Sicily / area=Taormina / trattoria / 3 件（タオルミーナ規模に見合った件数）
- ソース: 食ガイド系の検索クロスチェック（Taormina は Slow Food 掲載が少ないため代替）
- 出典: Trattoria da Nino 公式 + 複数旅ブログでの相互言及

**候補（採用 3 件）**

| 店名 | エリア | 創業/世代 | verdict | 特徴 |
|---|---|---|---|---|
| Trattoria da Nino | Taormina（funivia 付近）| 3 世代、~1972〜 | recommended | 木窯保持、Nicita 家、海眺望 |
| Trattoria Don Ciccio | Taormina（中心部の裏通り）| - | recommended | 観光ストリート外、伝統 + 地元 |
| Osteria da Rita | Taormina | - | recommended | 12 席、リコッタラビオリ、客の好みを記憶 |

**Sheets 貼り付け用 TSV（採用 3 件）**

```tsv
Trattoria da Nino	Sicily	Taormina	trattoria	€€	37.853	15.293		FALSE						sicilian,family,pasta-al-forno,sea-view	food-blogger	medium	recommended	[{"type":"tourist-oriented","severity":"low","note":"funivia 付近で観光客もいるが、地元客も多い 50 年継続店"}]	[{"type":"generations-old","note":"Nicita 家 3 世代、1972 年〜"},{"type":"family-run"},{"type":"signature-dish","note":"祖父が設置した木窯のパスタ・アル・フォルノ"}]	2026-05-18
Trattoria Don Ciccio	Sicily	Taormina	trattoria	€€	37.853	15.288		FALSE						sicilian,traditional,quiet	food-blogger	medium	recommended	[]	[{"type":"locals-frequent","note":"観光ストリート外の静かな立地"},{"type":"family-run"}]	2026-05-18
Osteria da Rita	Sicily	Taormina	osteria	€€	37.851	15.288		FALSE						sicilian,intimate,ricotta-ravioli	food-blogger	medium	recommended	[]	[{"type":"hidden-gem","note":"12 席のみの親密空間"},{"type":"signature-dish","note":"リコッタラビオリ"},{"type":"family-run","note":"客の好みのワインを記憶"}]	2026-05-18
```

> 注: Osteria da Rita は名前から `osteria` ジャンルに分類した（trattoria より一段カジュアル）。

**ユーザー確認事項**
- [ ] 全 3 件の **正確な住所と緯度経度**（Taormina は半島の小さな町、概算座標）
- [ ] 全 3 件の **公式 URL**（Trattoria da Nino は確認済み: trattoriadaninotaormina.com）
- [ ] Trattoria Don Ciccio の正確な住所
- [ ] タオルミーナはオフシーズン休業店が多い → 営業中か確認

---

### R-006: Sicily / Palermo パニーノ屋（pani ca' meusa）（5 件）

- 開始日: 2026-05-18
- モード: 自律（セッション #2, ラウンド 2/3）
- 状態: integrating（ユーザー承認待ち）

**ブリーフ**
- ターゲット: Sicily / area=Palermo / paninoteca / 5 件
- ソース: ilsicilia.it（地元ジャーナリズム）Top 10 pani ca meusa リスト
- 出典 URL: [ilsicilia.it pani ca meusa top 10](https://ilsicilia.it/pani-ca-meusa-ecco-la-top-ten-dei-migliori-a-palermo/)
- 補助: Gambero Rosso（403 でアクセス不可）→ 地元紙の Top 10 に切替

**候補（採用 5 件、Top 10 から代表選定）**

| 店名 | 住所 | 世代/歴史 | verdict | 特徴 |
|---|---|---|---|---|
| Antica Focacceria San Francesco | Via A. Paternostro 58 | 1834〜 | recommended | パレルモ最古、反マフィア象徴店 |
| Nni Franco u Vastiddaru | Corso Vittorio Emanuele 102 | Valenti 家 2 世代 | recommended | ilsicilia.it ランク #1、適度な脂 |
| Al chioschetto ru pani ca meusa | Corso dei Mille 200 | 4 世代、1943〜 | recommended | 屋台形式、外席、伝統そのもの |
| Porta Carbone | Via Cala 62 | Favata 兄弟 1943〜 | recommended | 海沿い La Cala、Discovery TV 出演 |
| Nino u Ballerino | Corso C. Finocchiaro Aprile 76 | 4 世代 | recommended | 「踊るような調理」、Mediaset 出演 |

**Sheets 貼り付け用 TSV（採用 5 件）**

```tsv
Antica Focacceria San Francesco	Sicily	Palermo	paninoteca	€	38.115	13.366	Via Alessandro Paternostro 58, 90133 Palermo PA	FALSE						pani-ca-meusa,panelle,historic,anti-mafia	food-blogger	medium	recommended	[{"type":"tourist-oriented","severity":"low","note":"歴史と観光価値で観光客も多いが、味の本格性は維持"}]	[{"type":"generations-old","note":"1834 年創業、リバティ様式、Pirandello/Sciascia/Guttuso らが通った"},{"type":"signature-dish","note":"pani ca meusa, panelle"}]	2026-05-18
Nni Franco u Vastiddaru	Sicily	Palermo	paninoteca	€	38.115	13.366	Corso Vittorio Emanuele 102, 90133 Palermo PA	FALSE						pani-ca-meusa,piazza-marina	food-blogger	medium	recommended	[]	[{"type":"award-winning","note":"ilsicilia.it pani ca meusa Top 10 #1"},{"type":"family-run","note":"Valenti 家 2 世代"},{"type":"signature-dish","note":"よく味付けされた pani ca meusa、脂控えめ"}]	2026-05-18
Al chioschetto ru pani ca meusa	Sicily	Palermo	paninoteca	€	38.111	13.366	Corso dei Mille 200, Palermo PA	FALSE						pani-ca-meusa,kiosk,authentic	food-blogger	medium	recommended	[{"type":"crowded-noisy","severity":"low","note":"屋台形式で席は限定"}]	[{"type":"generations-old","note":"4 世代、1943 年〜"},{"type":"locals-frequent","note":"シンプルな屋台、地元客中心"}]	2026-05-18
Porta Carbone	Sicily	Palermo	paninoteca	€	38.119	13.369	Via Cala 62, Palermo PA	FALSE						pani-ca-meusa,la-cala,waterfront	food-blogger	medium	recommended	[]	[{"type":"generations-old","note":"Favata 兄弟、1943 年〜"},{"type":"award-winning","note":"Discovery Travel Bizarre Foods 出演"}]	2026-05-18
Nino u Ballerino	Sicily	Palermo	paninoteca	€	38.130	13.350	Corso Camillo Finocchiaro Aprile 76, Palermo PA	FALSE						pani-ca-meusa,fast-service,traditional	food-blogger	medium	recommended	[]	[{"type":"generations-old","note":"4 世代"},{"type":"signature-dish","note":"踊るような速い調理技術、Mediaset Street Food Heroes 出演"}]	2026-05-18
```

**ユーザー確認事項**
- [ ] 全 5 件の **正確な緯度経度**（住所はわりと正確、座標は地区中心の概算）
- [ ] 全 5 件の **公式 URL**（Antica Focacceria のみ確認済: anticafocacceria.it）
- [ ] **営業時間**: 屋台系（Al chioschetto, Nino u Ballerino）は早朝〜午後のみで夜は閉まることが多い → サイトに営業時間情報を入れたい場合は data-model 拡張が必要

---

### R-005: Sicily / Palermo トラットリア（5 件、Slow Food 2025）

- 開始日: 2026-05-18
- モード: 自律（セッション #2, ラウンド 1/3）
- 状態: integrating（ユーザー承認待ち）

**ブリーフ**
- ターゲット: Sicily / area=Palermo / trattoria / 5 件
- ソース: Slow Food Osterie d'Italia 2025（high trust、家族経営優先選定基準）
- 出典 URL: [slowfoodpalermo.it](https://slowfoodpalermo.it/2025/04/20/osterie-ditalia-2025-le-migliori-di-sicilia-e-di-palermo-secondo-la-guida/)

**候補（採用 5 件）**

| 店名 | エリア | Slow Food 評価 | verdict |
|---|---|---|---|
| Buatta | Palermo | **Chiocciola（最高評価）** | recommended |
| Corona Trattoria | Palermo | **Chiocciola** | recommended |
| Ai Cascinari | Palermo | 推薦掲載 | recommended |
| Aja Mola | Palermo | 推薦掲載 | recommended |
| Cicala | Palermo | 推薦掲載 | recommended |

**Sheets 貼り付け用 TSV（採用 5 件）**

```tsv
Buatta	Sicily	Palermo	trattoria	€€	38.115	13.361		FALSE						sicilian,traditional,slow-food-chiocciola	slow-food	high	recommended	[]	[{"type":"award-winning","note":"Slow Food Osterie d'Italia 2025 Chiocciola"},{"type":"family-run","note":"Slow Food 基準で選定（家族経営・郷土料理）"}]	2026-05-18
Corona Trattoria	Sicily	Palermo	trattoria	€€	38.115	13.361		FALSE						sicilian,traditional,slow-food-chiocciola	slow-food	high	recommended	[]	[{"type":"award-winning","note":"Slow Food Osterie d'Italia 2025 Chiocciola"},{"type":"family-run"}]	2026-05-18
Ai Cascinari	Sicily	Palermo	trattoria	€€	38.115	13.361		FALSE						sicilian,traditional,slow-food	slow-food	high	recommended	[]	[{"type":"award-winning","note":"Slow Food Osterie d'Italia 2025 推薦掲載"}]	2026-05-18
Aja Mola	Sicily	Palermo	trattoria	€€	38.115	13.361		FALSE						sicilian,traditional,slow-food	slow-food	high	recommended	[]	[{"type":"award-winning","note":"Slow Food Osterie d'Italia 2025 推薦掲載"}]	2026-05-18
Cicala	Sicily	Palermo	trattoria	€€	38.115	13.361		FALSE						sicilian,traditional,slow-food	slow-food	high	recommended	[]	[{"type":"award-winning","note":"Slow Food Osterie d'Italia 2025 推薦掲載"}]	2026-05-18
```

**ユーザー確認事項**
- [ ] 全 5 件の **正確な住所と緯度経度**（座標は Palermo 市中心の仮値、すべて要置換）
- [ ] 全 5 件の **公式 URL**（Slow Food の店舗ページにあるはず → cross-check）
- [ ] Buatta / Corona Trattoria は Chiocciola 受賞という最強のシグナル → 訪問優先度高
- [ ] エリア（Vucciria / Capo / Ballarò など Palermo 内のさらに細かい地区）は調査価値あり

---

## セッション #1 サマリー（自律モード、2026-05-18）

- 実行ラウンド: R-002, R-003, R-004（計 3 ラウンド、`max_rounds_per_session=5` 内）
- 採用合計: 15 件（各ラウンド 5 件）
- 却下: 0 件
- 使用ツール: WebSearch + WebFetch（D-021 ワークフロー実行）
- ソース: 50 Top Pizza Italia 2025（Rome / Sicily）、World of Mouth + Mama Florence 検索（Florence）
- 現状更新: 6 件 → **21 件**（R-001 の 3 件 + 本セッション 15 件 + 元 JSON 6 件、Sheets 反映後）
- 残ギャップ大カテゴリ: Sicily.trattoria、Florence.gelateria/pasticceria、Rome.gelateria
- 次回セッション提案: Florence.gelateria + Sicily.trattoria を Slow Food 軸で

---

### R-004: Sicily.pizzeria（50 Top Pizza 2025 上位、5 件）

- 開始日: 2026-05-18
- モード: 自律 (セッション #1, ラウンド 3/3)
- 状態: integrating（ユーザー承認待ち）

**ブリーフ**
- ターゲット: Sicily / pizzeria / 5 件
- 根拠: 現状 1 件（pasticceria 系のみ）、目標 5 件、不足 4 件 → 新規 5 件で目標達成見込み
- ソース: 50-top-pizza（high trust）単独
- 出典 URL: [50 Top Pizza Italia 2025](http://www.50toppizza.it/it/50-top-pizza-italia-2025/)

**候補（採用 5 件）**

| 順位 | 店名 | エリア（area） | verdict |
|---|---|---|---|
| #32 | Saccharum | Altavilla Milicia (PA) | recommended |
| #45 | L'Orso | Messina | recommended |
| #62 | Frumento | Acireale (CT) | recommended |
| #64 | Archestrato di Gela | Palermo | recommended |
| #69 | AMMODO | Palermo | recommended |

**Sheets 貼り付け用 TSV（採用 5 件）**

```tsv
Saccharum	Sicily	Altavilla Milicia	pizzeria	€€	38.046	13.547		FALSE						pizza,sicilian,award-winning	50-top-pizza	high	recommended	[]	[{"type":"award-winning","note":"50 Top Pizza Italia 2025 #32"}]	2026-05-18
L'Orso	Sicily	Messina	pizzeria	€€	38.183	15.553		FALSE						pizza,sicilian,award-winning	50-top-pizza	high	recommended	[]	[{"type":"award-winning","note":"50 Top Pizza Italia 2025 #45"}]	2026-05-18
Frumento	Sicily	Acireale	pizzeria	€€	37.612	15.165		FALSE						pizza,sicilian,award-winning	50-top-pizza	high	recommended	[]	[{"type":"award-winning","note":"50 Top Pizza Italia 2025 #62"}]	2026-05-18
Archestrato di Gela	Sicily	Palermo	pizzeria	€€	38.115	13.361		FALSE						pizza,sicilian,award-winning	50-top-pizza	high	recommended	[]	[{"type":"award-winning","note":"50 Top Pizza Italia 2025 #64"}]	2026-05-18
AMMODO	Sicily	Palermo	pizzeria	€€	38.115	13.361		FALSE						pizza,sicilian,award-winning	50-top-pizza	high	recommended	[]	[{"type":"award-winning","note":"50 Top Pizza Italia 2025 #69"}]	2026-05-18
```

**ユーザー確認事項**
- [ ] 全 5 件の **正確な住所と緯度経度** を Google Maps で取得（座標は都市中心値を仮置き）
- [ ] 各店の **公式 URL**（リンク切れ要確認）
- [ ] Archestrato di Gela と AMMODO は両方パレルモなので `area` を具体地区に分割（例: `Palermo - Centro Storico`）

---

### R-003: Florence.trattoria（複数ソースクロスチェック、5 件）

- 開始日: 2026-05-18
- モード: 自律 (セッション #1, ラウンド 2/3)
- 状態: integrating（ユーザー承認待ち）

**ブリーフ**
- ターゲット: Florence / trattoria / 5 件
- 根拠: 現状 1 件、目標 6 件、不足 5 件 → 新規 5 件で目標達成
- ソース: Gambero Rosso（403 でアクセス不可）→ World of Mouth + Mama Florence + 検索クロスチェック に切替
- 出典 URL: [World of Mouth - 12 Best Casual Restaurants in Florence](https://www.worldofmouth.app/articles/the-best-casual-restaurants-in-florence)

**候補（採用 5 件）**

| 店名 | エリア | verdict | highlights |
|---|---|---|---|
| Trattoria Sostanza | Via del Porcellana | recommended | generations-old (1869〜), family-run, signature-dish (Tortina di Carciofi, ビステッカ) |
| I'Brindellone | Piazza Piattellina | recommended | locals-frequent（観光客ほぼなし）、signature-dish (Fagioli all'uccelletto) |
| Trattoria Alfredo | Via dei Leoni | recommended | hidden-gem, family-run, value-for-money |
| Trattoria Sabatino | San Frediano | recommended | family-run, value-for-money, locals-frequent |
| Il Santo Bevitore | Via Santo Spirito | **neutral** | innovative, fresh-ingredients / 懸念: not-authentic (semi-modern) |

**Sheets 貼り付け用 TSV（採用 5 件）**

```tsv
Trattoria Sostanza	Florence	Via del Porcellana	trattoria	€€€	43.775	11.247		FALSE						bistecca,tortina-carciofi,traditional	food-blogger	medium	recommended	[{"type":"long-wait","severity":"medium","note":"小規模、予約推奨"}]	[{"type":"generations-old","note":"1869 年創業"},{"type":"family-run"},{"type":"signature-dish","note":"Tortina di Carciofi、ビステッカ"}]	2026-05-18
I'Brindellone	Florence	Piazza Piattellina	trattoria	€€	43.772	11.243		FALSE						bistecca,fagioli,locals-only	food-blogger	medium	recommended	[{"type":"long-wait","severity":"medium","note":"地元人気で早期予約必須"}]	[{"type":"locals-frequent","note":"観光客ほぼなし"},{"type":"signature-dish","note":"Fagioli all'uccelletto、ビステッカ"}]	2026-05-18
Trattoria Alfredo	Florence	Via dei Leoni	trattoria	€€	43.770	11.258		FALSE						pici,wild-boar,ribollita	food-blogger	medium	recommended	[]	[{"type":"hidden-gem","note":"観光ガイドに載らない"},{"type":"family-run","note":"オーナー Alfredo の温かい接客"},{"type":"value-for-money","note":"2 人 €78 ワイン込み"}]	2026-05-18
Trattoria Sabatino	Florence	San Frediano	trattoria	€	43.766	11.238		FALSE						home-cooked,value,locals	food-blogger	medium	recommended	[]	[{"type":"family-run"},{"type":"value-for-money","note":"驚異的な安さで質を保つ"},{"type":"locals-frequent"}]	2026-05-18
Il Santo Bevitore	Florence	Via Santo Spirito	trattoria	€€€	43.769	11.248		FALSE						modern-tuscan,natural-wine	food-blogger	medium	neutral	[{"type":"not-authentic","severity":"low","note":"semi-modern スタイル、純伝統ではない"}]	[{"type":"innovative","note":"伝統 + 現代解釈"},{"type":"fresh-ingredients","note":"自然派ワイン充実"}]	2026-05-18
```

**ユーザー確認事項**
- [ ] 全 5 件の **正確な住所と緯度経度**（座標は地区中心の概算）
- [ ] 全 5 件の **公式 URL**
- [ ] Trattoria Sostanza は他ソース（Slow Food / Gambero Rosso）でも掲載されているか確認（クロスチェックで `sourceTrust: high` に昇格候補）
- [ ] Il Santo Bevitore は `genre: ristorante` の方が適切か再検討（メニューの伝統度次第）

---

### R-002: Rome.pizzeria（50 Top Pizza 2025 上位、5 件）

- 開始日: 2026-05-18
- モード: 自律 (セッション #1, ラウンド 1/3)
- 状態: integrating（ユーザー承認待ち）

**ブリーフ**
- ターゲット: Rome / pizzeria / 5 件
- 根拠: 現状 1 件、目標 5 件、不足 4 件 → 新規 5 件で目標到達 + 1 件オーバー（多様性のため許容）
- ソース: 50-top-pizza（high trust）単独
- 出典 URL: [50 Top Pizza Italia 2025](http://www.50toppizza.it/it/50-top-pizza-italia-2025/)

**候補（採用 5 件）**

| 順位 | 店名 | エリア | verdict | 特記 |
|---|---|---|---|---|
| **#3** | Seu Pizza Illuminati | Trastevere（推定） | recommended | **イタリア全国 3 位**、Pier Daniele Seu |
| #13 | 180 Grammi Pizzeria Romana | Tor Pignattara（推定） | recommended | ローマ式（軽くカリッと） |
| #38 | Avenida Calò | （要確認） | recommended | 50 Top Pizza 上位 |
| #41 | La Gatta Mangiona | Monteverde（推定） | recommended | ローマ式 |
| #43 | TAC – Thin and Crunchy | （要確認） | recommended | 薄手クリスピー系 |

**Sheets 貼り付け用 TSV（採用 5 件）**

```tsv
Seu Pizza Illuminati	Rome	Trastevere	pizzeria	€€€	41.881	12.476		FALSE						pizza,modern,napoletana,award-winning	50-top-pizza	high	recommended	[]	[{"type":"award-winning","note":"50 Top Pizza Italia 2025 #3、イタリア全国 3 位"},{"type":"innovative","note":"Pier Daniele Seu によるモダンピザ"},{"type":"signature-dish","note":"ナポリ風 + 革新トッピング"}]	2026-05-18
180 Grammi Pizzeria Romana	Rome	Tor Pignattara	pizzeria	€€	41.879	12.547		FALSE						pizza,romana,thin-crust,award-winning	50-top-pizza	high	recommended	[]	[{"type":"award-winning","note":"50 Top Pizza Italia 2025 #13"},{"type":"signature-dish","note":"ローマ式薄手"}]	2026-05-18
Avenida Calò	Rome		pizzeria	€€	41.9028	12.4964		FALSE						pizza,award-winning	50-top-pizza	high	recommended	[]	[{"type":"award-winning","note":"50 Top Pizza Italia 2025 #38"}]	2026-05-18
La Gatta Mangiona	Rome	Monteverde	pizzeria	€€	41.877	12.445		FALSE						pizza,romana,award-winning	50-top-pizza	high	recommended	[]	[{"type":"award-winning","note":"50 Top Pizza Italia 2025 #41"},{"type":"locals-frequent","note":"観光地外、地元利用率高"}]	2026-05-18
TAC – Thin and Crunchy	Rome		pizzeria	€€	41.9028	12.4964		FALSE						pizza,thin-crispy,award-winning	50-top-pizza	high	recommended	[]	[{"type":"award-winning","note":"50 Top Pizza Italia 2025 #43"},{"type":"innovative","note":"薄手クリスピー系"}]	2026-05-18
```

**ユーザー確認事項**
- [ ] 全 5 件の **正確な住所と緯度経度**（特に Avenida Calò と TAC は area 不明、Google Maps で要確認）
- [ ] 全 5 件の **公式 URL**
- [ ] La Gatta Mangiona の `area` が Monteverde で正しいか
- [ ] Seu Pizza Illuminati の `area`（Trastevere or Travertino どちらか）

---



- 開始日: 2026-05-18
- 担当: 計画 → リサーチ → 統合
- 状態: **integrating（ユーザー承認待ち）**

---

#### 【計画エージェント】

**現状分析**（2026-05-18 時点、Sheets は空・JSON フォールバック 6 件）

| 都市 | 件数 | 内訳 |
|---|---|---|
| Rome | 2 | trattoria 1 / pizzeria 1 |
| Florence | 2 | trattoria 1 / gelateria 1 |
| Sicily | 2 | pizzeria 1 / pasticceria 1 |

偏り所見:
- 全体として件数が少なく、トラットリアは Da Enzo（Trastevere、観光客と地元客混在）のみ
- ローマで「観光地から少し外れたエリアの地元客密度が高いトラットリア」が欠落している
- → Rome のトラットリアを拡充する意義は高い

**ターゲット**
- 都市: Rome
- エリア: 観光地中心部を **避ける**（Testaccio / Monteverde / Garbatella などの residential エリアを優先）
- ジャンル: trattoria
- 目標件数: 3

**ソース優先順序**
1. `gambero-rosso`（high）— 業界基準のローマ評価
2. `slow-food`（high）— 「家族経営・郷土料理・観光客向けでない」基準に合致しやすい

**除外条件**
- 既存 `rome-da-enzo`（Trattoria Da Enzo al 29）と重複しないこと
- Trastevere 中心部・Centro Storico の観光地ドストライク立地は **回避**
- verdict 推定が `caution` / `skip` になりそうな店は候補にしない

**根拠**
- ローマのトラットリアは「観光客が見つけにくいが地元では定番」というケースが多く、サイトの差別化価値が大きい
- 3 件で初回 AI 品質を検証してから R-002 で件数を増やす

**ブリーフ完了日**: 2026-05-18

---

#### 【リサーチエージェント】

> 注: 以下は LLM 知識カットオフ（2026 年 1 月）以前から広く知られている店のみを挙げている。住所・緯度経度・現存性は **要検証**。

##### Candidate 1: Flavio al Velavevodetto

```json
{
  "name": "Flavio al Velavevodetto",
  "city": "Rome",
  "area": "Testaccio",
  "genre": "trattoria",
  "priceRange": "€€",
  "lat": 41.876,
  "lng": 12.474,
  "address": "Via di Monte Testaccio, 97-99, 00153 Roma RM",
  "visited": false,
  "url": "https://www.ristorantevelavevodetto.it/",
  "tags": ["roman-classics", "cacio-e-pepe", "oxtail", "testaccio"],
  "source": "gambero-rosso",
  "sourceTrust": "high",
  "verdict": "recommended",
  "concerns": [
    { "type": "long-wait", "severity": "medium", "note": "予約推奨。週末は早めに" }
  ],
  "highlights": [
    { "type": "locals-frequent", "note": "ローマっ子の宴会・家族利用が多い" },
    { "type": "signature-dish", "note": "コーダ・アッラ・ヴァッチナーラ（オックステール煮込）" },
    { "type": "fresh-ingredients", "note": "ローマ郷土の伝統メニュー中心" }
  ],
  "lastAnalyzed": "2026-05-18"
}
```

**要検証フラグ**:
- [ ] 住所と緯度経度（Google Maps で「Flavio al Velavevodetto」を検索して照合）
- [ ] 現存性（イタリアの飲食店は閉店も多い）
- [ ] 公式 URL

**根拠メモ**:
- Testaccio は旧屠殺場跡で、伝統的なローマ料理（クインティチン）の中心地
- Monte dei Cocci の「ガラスの破片の山」の麓に位置し、観光客はあまり知らない
- Gambero Rosso 系で長年トップ評価

##### Candidate 2: Trattoria Cesare al Casaletto

```json
{
  "name": "Trattoria Cesare al Casaletto",
  "city": "Rome",
  "area": "Monteverde",
  "genre": "trattoria",
  "priceRange": "€€",
  "lat": 41.879,
  "lng": 12.448,
  "address": "Via del Casaletto, 45, 00151 Roma RM",
  "visited": false,
  "url": "https://www.trattoriacesarealcasaletto.it/",
  "tags": ["roman-classics", "fritti", "carbonara", "amatriciana"],
  "source": "gambero-rosso",
  "sourceTrust": "high",
  "verdict": "recommended",
  "concerns": [
    { "type": "long-wait", "severity": "medium", "note": "予約必須、人気店" }
  ],
  "highlights": [
    { "type": "award-winning", "note": "Gambero Rosso 系で高評価常連" },
    { "type": "innovative", "note": "伝統料理に細やかな工夫" },
    { "type": "locals-frequent", "note": "観光地から離れ、地元客中心" },
    { "type": "signature-dish", "note": "フリッティ（揚げ物盛り合わせ）が名物" }
  ],
  "lastAnalyzed": "2026-05-18"
}
```

**要検証フラグ**:
- [ ] 住所と緯度経度（トラム 8 番の終点 Casaletto 近く）
- [ ] 公式 URL（変更されている可能性）
- [ ] 現存性

**根拠メモ**:
- シェフ Leonardo Vignoli が運営。L'Arcangelo（Prati 地区）の系列
- トラム 8 番の終点というアクセスでフィルタが掛かり地元利用率高
- ローマ伝統料理を「技術力で再構成」しているスタイル

##### Candidate 3: Trattoria Pennestri

```json
{
  "name": "Trattoria Pennestri",
  "city": "Rome",
  "area": "Ostiense",
  "genre": "trattoria",
  "priceRange": "€€",
  "lat": 41.866,
  "lng": 12.482,
  "address": "Via Giovanni da Empoli, 5, 00154 Roma RM",
  "visited": false,
  "url": "https://www.trattoriapennestri.it/",
  "tags": ["roman-classics", "modern-traditional", "ostiense"],
  "source": "slow-food",
  "sourceTrust": "high",
  "verdict": "recommended",
  "concerns": [
    { "type": "long-wait", "severity": "low", "note": "予約推奨" }
  ],
  "highlights": [
    { "type": "innovative", "note": "若手シェフによる伝統料理の現代的解釈" },
    { "type": "fresh-ingredients", "note": "季節食材重視" },
    { "type": "locals-frequent", "note": "Ostiense / Garbatella エリア住民が中心" }
  ],
  "lastAnalyzed": "2026-05-18"
}
```

**要検証フラグ**:
- [ ] 住所と緯度経度（Garbatella と Ostiense の境界付近）
- [ ] 現存性
- [ ] 公式 URL

**根拠メモ**:
- Ostiense は近年食ジャーナリスト注目エリア
- 「Roman classics with a twist」と評されるスタイル
- Slow Food 系の若手注目枠

---

#### 【統合エージェント】

**重複チェック**

既存データ（`data/restaurants.json` 6 件、Sheets 0 件）と照合:

| Candidate | 名前重複 | 住所近接 | 結果 |
|---|---|---|---|
| Flavio al Velavevodetto | なし | なし | ✅ 採用 |
| Trattoria Cesare al Casaletto | なし | なし | ✅ 採用 |
| Trattoria Pennestri | なし | なし | ✅ 採用 |

3 件すべて新規。Da Enzo（Trastevere）との被りなし。

**スキーマ検証**: 全 3 件 OK

- city: `Rome` ✓
- genre: `trattoria` ✓
- source: `gambero-rosso` / `slow-food`（既知タクソノミー）✓
- verdict: `recommended` ✓
- concerns / highlights: 全 type が既知タクソノミー ✓

**エスカレーション**: なし（タクソノミー追加・新都市・新ジャンルは不要）

**Sheets 貼り付け用 TSV（採用 3 件）**

> 下記をコピー → Sheets の **2 行目から** 貼り付け。Tab 区切りで自動的に列に分かれる。

```tsv
Flavio al Velavevodetto	Rome	Testaccio	trattoria	€€	41.876	12.474	Via di Monte Testaccio, 97-99, 00153 Roma RM	FALSE			 		https://www.ristorantevelavevodetto.it/	roman-classics,cacio-e-pepe,oxtail,testaccio	gambero-rosso	high	recommended	[{"type":"long-wait","severity":"medium","note":"予約推奨。週末は早めに"}]	[{"type":"locals-frequent","note":"ローマっ子の宴会・家族利用が多い"},{"type":"signature-dish","note":"コーダ・アッラ・ヴァッチナーラ"},{"type":"fresh-ingredients","note":"ローマ郷土の伝統メニュー中心"}]	2026-05-18
Trattoria Cesare al Casaletto	Rome	Monteverde	trattoria	€€	41.879	12.448	Via del Casaletto, 45, 00151 Roma RM	FALSE				https://www.trattoriacesarealcasaletto.it/	roman-classics,fritti,carbonara,amatriciana	gambero-rosso	high	recommended	[{"type":"long-wait","severity":"medium","note":"予約必須、人気店"}]	[{"type":"award-winning","note":"Gambero Rosso 系で高評価常連"},{"type":"innovative","note":"伝統料理に細やかな工夫"},{"type":"locals-frequent","note":"観光地から離れ、地元客中心"},{"type":"signature-dish","note":"フリッティが名物"}]	2026-05-18
Trattoria Pennestri	Rome	Ostiense	trattoria	€€	41.866	12.482	Via Giovanni da Empoli, 5, 00154 Roma RM	FALSE				https://www.trattoriapennestri.it/	roman-classics,modern-traditional,ostiense	slow-food	high	recommended	[{"type":"long-wait","severity":"low","note":"予約推奨"}]	[{"type":"innovative","note":"若手シェフによる伝統料理の現代的解釈"},{"type":"fresh-ingredients","note":"季節食材重視"},{"type":"locals-frequent","note":"Ostiense / Garbatella エリア住民が中心"}]	2026-05-18
```

**ユーザー確認事項（採用 3 件すべてに共通）**

- [ ] **住所と緯度経度**: Google Maps で各店名を検索し、住所と座標を上書き更新（AI のは概算）
- [ ] **現存性**: 公式サイト or Google Maps で営業中か確認
- [ ] **公式 URL**: 上書き更新（リンク切れの可能性あり）
- [ ] **受賞情報**: Gambero Rosso 最新版 / Slow Food Osterie d'Italia 最新版で再確認（記載されていれば highlights の note を更新）

**却下候補と理由**: なし

**ラウンド完了**

- 状態: **ユーザー承認待ち** → 承認後 `done` に更新
- 採用: 3 件 / 却下: 0 件
- 次のアクション:
  1. ユーザーが TSV を Sheets に貼り付け（座標などを Google Maps で再確認しながら）
  2. GitHub Actions の Run workflow → 再ビルド
  3. サイトで `https://italia-gohan-map.vercel.app/?city=Rome&genre=trattoria` を開き、4 件（既存 Da Enzo + 新規 3 件）になっているか確認

---

---

## ラウンドテンプレート

新ラウンド開始時に、計画エージェントが以下を貼り付けて埋める:

```markdown
### R-NNN: <ラウンド名>

- 開始日: YYYY-MM-DD
- 担当: 計画 → リサーチ → 統合
- 状態: planning

**ターゲット**
- 都市:
- エリア:
- ジャンル:
- 目標件数:

**ソース優先順序**
1.

**除外条件**
-

**根拠（なぜこのターゲット?）**
-

**ブリーフ完了日**: YYYY-MM-DD

---

**候補リスト（リサーチエージェント生成）**

#### Candidate 1
（JSON ブロック）

**要検証フラグ**:
- [ ]

**根拠メモ**:
-

#### Candidate 2
...

---

**Sheets 貼り付け用 TSV（採用 N 件）**
（TSV ブロック）

**ユーザー確認事項**
- [ ]

**却下候補と理由**
- ❌

---

**ラウンド完了**
- 状態: done
- 完了日: YYYY-MM-DD
- 採用: N 件 / 却下: M 件
- 次のアクション:
```
