# AI プロンプトテンプレート

イタリアの飲食店を「観光客向けの罠」「品質低下」などの懸念を踏まえて評価分類するためのプロンプト。Claude や ChatGPT に貼り付けて使う。

## 使い方

1. 下記「プロンプト本体」を全部コピー
2. AI チャットに貼り付け
3. 末尾の `<input>` ブロックを実際の店舗情報で置き換え
4. AI が返す JSON を Google Sheets の `concerns` / `highlights` / `verdict` カラムに貼る
5. `lastAnalyzed` に今日の日付を入れる

> Claude にも ChatGPT にも対応。日本語/英語どちらでも返答できるが、JSON 内のタイプ値は **必ず英語のスラグ** を使う。

---

## プロンプト本体（ここから下を全部コピー）

```
あなたはイタリア料理の専門家として、与えられた店舗情報を分析し、観光客向けの罠を避けたい個人旅行者向けに評価分類してください。

## 評価軸

### concerns（負のシグナル）
以下のタイプから該当するものだけを選び、severity（low/medium/high）と必要に応じて note を付ける。

- tourist-oriented: 観光客向けに最適化されている（地元客がほぼいない、英語メニュー前提、主要観光地のド真ん中で集客に頼っている等）
- overpriced: 価格に見合わない（料理の質や量に対して高すぎる）
- mediocre-food: 料理が平凡（特筆すべき味ではない、可もなく不可もなく）
- quality-declined: 昔は良かったが品質低下（古いレビューは高評価だが最近のレビューに低下の言及）
- not-authentic: 本場っぽくない（伝統的な調理から外れたフュージョン的、チェーン的）
- service-issues: サービスが粗雑・差別的（イタリア人と外国人で対応が違う、ぞんざい）
- hidden-fees: コペルト過大・チップ強要・メニュー外の追加料金
- language-barrier-eng-only: 英語メニューのみで地元客が来ない兆候
- long-wait: 待ち時間が品質に見合わない
- crowded-noisy: 混雑・騒音で味わえない

severity 判定基準:
- low: 軽微、許容範囲（例: 「混雑するが料理は本物」）
- medium: 認識して行くべき（例: 「予約必須、観光客比率高め」）
- high: 致命的（例: 「観光客向けに完全に最適化された罠」「明確に味が落ちた」）

### highlights（正のシグナル）
以下から該当するものを選び、必要に応じて note を付ける。

- locals-frequent: 地元客が多く通う
- family-run: 家族経営
- generations-old: 何世代も続く老舗
- signature-dish: 名物料理がある（note にメニュー名を入れる）
- hidden-gem: 評価控えめだが質が高い隠れた名店
- award-winning: Gambero Rosso / 50 Top Pizza / Slow Food などの受賞歴
- seasonal-menu: 季節メニューあり
- fresh-ingredients: 地元食材・新鮮さ重視
- innovative: 革新的な料理（伝統 + 工夫）
- value-for-money: 質の割に安い

### verdict（総合判定、4 段階）

- recommended: concerns が空または low のみ、かつ highlights が 1 つ以上
- neutral: concerns に medium 含むが致命的でない、highlights あり
- caution: concerns に medium が複数、または high が 1 つ
- skip: mediocre-food や tourist-oriented が high、もしくは high concern が 2 つ以上

## 出力形式

純粋な JSON のみを返してください。コードブロック（```）も説明文も不要。

スキーマ:
{
  "verdict": "recommended" | "neutral" | "caution" | "skip",
  "concerns": [
    { "type": "<上記タイプ>", "severity": "low" | "medium" | "high", "note": "<日本語の補足>" }
  ],
  "highlights": [
    { "type": "<上記タイプ>", "note": "<日本語の補足>" }
  ]
}

ルール:
- concerns / highlights が空なら `[]` を返す
- note は任意。明確な根拠がない場合は省略
- 該当しないタイプは無理に追加しない。「該当なし」が正解
- type の値は必ず英語のスラグ（日本語に翻訳しない）

## 出力例

例 1: 観光地の罠
{
  "verdict": "caution",
  "concerns": [
    { "type": "tourist-oriented", "severity": "high", "note": "ナヴォーナ広場で客引きあり" },
    { "type": "overpriced", "severity": "medium" },
    { "type": "mediocre-food", "severity": "medium", "note": "観光客向けに簡略化された味" }
  ],
  "highlights": []
}

例 2: 地元の優良店
{
  "verdict": "recommended",
  "concerns": [
    { "type": "long-wait", "severity": "low", "note": "ピーク時は要予約" }
  ],
  "highlights": [
    { "type": "family-run" },
    { "type": "locals-frequent" },
    { "type": "signature-dish", "note": "カチョエペペ" },
    { "type": "generations-old", "note": "1953 年創業" }
  ]
}

## 分析対象

以下の店舗情報に対して、上記スキーマで JSON を返してください。

<input>
店名: <ここに店名>
都市: <Rome / Florence / Sicily のいずれか>
エリア: <地区名、例: Trastevere>
ジャンル: <pizzeria / trattoria / osteria / ristorante / enoteca / bar / gelateria / paninoteca / pasticceria>
価格帯: <€ / €€ / €€€ / €€€€>
住所: <住所>
公式 URL: <あれば URL>

主要なレビュー断片（地元レビュー優先）:
"""
<ここに 2〜5 件のレビューや評論文を貼る。イタリア語可。古いレビューと最近のレビューを混ぜると quality-declined を判定しやすい>
"""

備考（任意）:
<受賞歴、知っている文脈、自分の予習メモなど>
</input>
```

---

## 入力例（実際に使うときの形）

実際に投入する `<input>` ブロックの例:

```
<input>
店名: Trattoria Da Enzo al 29
都市: Rome
エリア: Trastevere
ジャンル: trattoria
価格帯: €€
住所: Via dei Vascellari, 29, 00153 Roma RM
公式 URL: https://www.daenzoal29.com/

主要なレビュー断片:
"""
Cacio e pepe straordinaria, ma bisogna prenotare con anticipo. Locale piccolissimo.
（カチョエペペが素晴らしいが、事前予約必須。店は非常に小さい）

Sempre pieno di romani e turisti, l'atmosfera è autentica. Servizio veloce.
（ローマっ子と観光客で常に満員。雰囲気は本物。サービスは速い）

Da decenni una delle migliori trattorie di Trastevere. La carbonara è perfetta.
（数十年来トラステヴェレ最高のトラットリアの 1 つ。カルボナーラが完璧）
"""

備考: Gambero Rosso 掲載店、1980 年代から営業。
</input>
```

## トラブル時

### AI が説明文を付けてしまう

プロンプト末尾に追加: 「**JSON 以外は一切出力しないでください。** コードブロックも不要です。」

### type 値が日本語になっている

プロンプトに追加: 「type の値は **絶対に翻訳せず、上記の英語スラグそのまま** で返してください」

### 該当しないタイプを無理に詰めてくる

プロンプトに追加: 「**該当するものだけ** 選んでください。該当なしの場合は空配列で OK」

### 出力された JSON にバリデーション違反がある

`src/data/loader.ts` が未知のタイプを警告付きで無視するので、ビルドは止まらない。気になる場合は再生成。
