# カバレッジ目標

このファイルは **キュレーション計画 AG（オーケストレーター）** が読み、現状とのギャップを計算してラウンドを生成する。

## 目標値（中規模）

| 都市 | 合計 | trattoria | pizzeria | gelateria | pasticceria | ristorante | bar / enoteca | osteria |
|---|---|---|---|---|---|---|---|---|
| **Rome** | 20 | 8 | 5 | 3 | 1 | 2 | 1 | - |
| **Florence** | 18 | 6 | 2 | 3 | 3 | 2 | 2 | - |
| **Sicily** | 21 | 5 | 5 | 2 | 4 | 1 | 1 | + paninoteca 3 |
| **総計** | **56** | 19 | 12 | 8 | 8 | 5 | 4 | - |

## ラウンド設定

| 項目 | 値 |
|---|---|
| `max_per_round` | 5 |
| `max_rounds_per_session` | 5 |
| `min_source_diversity` | 1 ラウンドで同一 source は最大 3 件まで |
| `min_area_diversity` | 同じエリアばかりにならないよう、1 ラウンドでエリアを最大 2 種類 |
| `overflow_warning` | あるカテゴリが target の +200% を超えたら警告 |
| `user_directive_override` | ユーザーが area やジャンルを具体指定したら、target を一時上書き |

## ギャップ計算ルール

オーケストレーターは以下を毎ラウンド計算:

1. 現状（Sheets + JSON フォールバック）の都市 × ジャンル別件数を集計
2. 目標との差分（不足数）を計算
3. 不足の大きい組み合わせから優先的にラウンドを生成
4. 既存の `concerns` を見て `skip` 多発の組み合わせは目標を見直す（ユーザー相談）

## 停止条件

オーケストレーターは以下のいずれかでセッション終了:

| 条件 | 動作 |
|---|---|
| 全カテゴリが目標達成 | 「完了」サマリーをユーザーに提示、計画 AG を待機 |
| `max_rounds_per_session` 到達 | 「セッション上限到達、続けますか?」とユーザー確認 |
| 候補枯渇（ある組み合わせで 0 件しか出ない）| その組み合わせをスキップして次の不足カテゴリへ |
| Web ツールエラー連続 3 回 | エラー報告して停止 |

## 目標見直しの履歴

| 日付 | 変更 | 理由 |
|---|---|---|
| 2026-05-18 | 初版作成（中規模） | D-022 で「中：各都市 15〜25」を採用 |
| 2026-05-18 | Sicily に paninoteca 3 件追加 | ユーザー要望（Palermo / Taormina 街角文化を反映） |

## 現状（最終更新を毎ラウンドで更新）

```
2026-05-18 セッション #1 終了時点（TSV 反映後想定）:
  Rome:    2 + R-001 (3 trattoria) + R-002 (5 pizzeria) = 10 / 20  gap = 10
    trattoria 1→4 (target 8, gap 4)
    pizzeria  1→6 (target 5, OVER +1)
    gelateria 0   (target 3, gap 3)
    ristorante 0  (target 2, gap 2)
    osteria 0     (target -, ok)
    bar 0         (target 1, gap 1)
    pasticceria 0 (target 1, gap 1)
  Florence: 2 + R-003 (5 trattoria) = 7 / 18  gap = 11
    trattoria 1→6 (target 6, TARGET MET)
    gelateria 1   (target 3, gap 2)
    pasticceria 0 (target 3, gap 3)
    ristorante 0  (target 2, gap 2)
    bar 0         (target 2, gap 2)
    pizzeria 0    (target 2, gap 2)
  Sicily:   2 + R-004 (5 pizzeria) + R-005 (5 trattoria Palermo) + R-006 (5 paninoteca Palermo) + R-007 (2 trattoria + 1 osteria Taormina) = 20 / 21  gap = 1
    pizzeria 1→6 (target 5, OVER +1)
    pasticceria 1 (target 4, gap 3)
    trattoria 0→7 (target 5, OVER +2)
    paninoteca 0→5 (target 3, OVER +2)
    osteria 0→1 (target -, 増設可)
    gelateria 0 (target 2, gap 2)
    bar 0 (target 1, gap 1)
    ristorante 0 (target 1, gap 1)
  ────────────────────────────────────────
  合計: 37 / 59  gap = 22  (元 6 → 37、進捗 +31)
```

> 注: 上記は **ユーザーが R-001〜R-007 の TSV を Sheets に貼り付け済み** の想定。実際の値は Sheets 反映後に再集計。
>
> 観察: Sicily.trattoria + paninoteca は目標オーバー（ユーザー要望でブースト）。残ギャップ大は `Florence.pasticceria` (3) / `Florence.gelateria` (2) / `Rome.gelateria` (3) / `Sicily.pasticceria` (3)。スイーツ系の補強が次の最適候補。

## セッション #3 後（2026-05-18、user_directive_override で +30 件）

```
最新:
  Rome:     25 / 20 (OVER +5)
    trattoria 4, pizzeria 6, gelateria 4, pasticceria 3, osteria 2, ristorante 1, enoteca 5
    → enoteca と gelateria で目標超過
  Florence: 22 / 18 (OVER +4)
    trattoria 6, pizzeria 4, gelateria 4, bar 2, enoteca 1, paninoteca 2, ristorante 2, osteria 1
    → 全ジャンルバランスよく充足
  Sicily:   20 / 21 (gap = 1)
    pizzeria 6, trattoria 7, paninoteca 5, pasticceria 1, osteria 1
    → pasticceria が gap 3、gelateria が gap 2 残存
  ────────────────────────────────────────
  合計: 67 / 59  全体目標 + 8 件超達成
```

> 観察: Rome と Florence は目標を超えて充実。次に伸ばすなら **Sicily.pasticceria / gelateria** か、**他都市追加**（Venice, Naples, Bologna 等）の方向。
