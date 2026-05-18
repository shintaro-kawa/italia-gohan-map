# キュレーションサブチームの記録

このディレクトリは、店舗データ拡充ラウンドの **唯一の記録場所**。

## ファイル

- [curation-log.md](curation-log.md) — すべてのラウンド（R-001, R-002, ...）が時系列で蓄積される台帳

## 参考

- [../../agents/curation-planning-agent.md](../../agents/curation-planning-agent.md) — 計画 AG の指示書
- [../../agents/restaurant-research-agent.md](../../agents/restaurant-research-agent.md) — リサーチ AG の指示書
- [../../agents/curation-integration-agent.md](../../agents/curation-integration-agent.md) — 統合 AG の指示書
- [../curation-guide.md](../curation-guide.md) — 信頼ソースの一覧
- [../ai-prompt-template.md](../ai-prompt-template.md) — 評価用 Claude プロンプト

## 1 ラウンドの寿命

```
[ユーザーが要望]
   ↓
[計画 AG] R-NNN を curation-log.md に作成、ブリーフ書込み
   ↓
[ユーザー承認]
   ↓
[リサーチ AG] 同じ R-NNN ブロックに候補リストを追記
   ↓
[統合 AG] 同じ R-NNN ブロックに TSV + 確認事項 + 却下を追記
   ↓
[ユーザーが Sheets に貼る、Run workflow で反映]
   ↓
[統合 AG] R-NNN の状態を done に更新、サマリーを書く
```
