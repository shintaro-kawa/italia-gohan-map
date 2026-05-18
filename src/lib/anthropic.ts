import Anthropic from '@anthropic-ai/sdk';
import type { Restaurant } from '../types/restaurant.js';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const CHAT_MODEL = 'claude-sonnet-4-6';

/**
 * Claude に投げる system prompt。
 * docs/ai-prompt-template.md と data-model.md の制約を畳み込んだもの。
 */
export function buildSystemPrompt(existing: Restaurant[]): string {
  const existingSummary = existing
    .map((r) => `${r.id}: ${r.name} (${r.city}/${r.area ?? '-'}/${r.genre})`)
    .join('\n');

  return `あなたはイタリア料理の専門家として、ユーザーの旅行用店舗マップに新しい店舗を提案するアシスタントです。

## 厳守ルール

1. **必ず web_search ツールで実在を確認** してから提案する。検索結果のヒットがない店は提案しない（幻覚禁止）
2. **city は Rome / Florence / Sicily の 3 つのみ**。それ以外の都市（Venice / Naples 等）の店は提案不可、その旨ユーザーに伝える
3. **既存店との重複を避ける**（下記リスト参照）
4. **観光客向けの罠を避ける**: Gambero Rosso / 50 Top Pizza / Slow Food Osterie d'Italia 等の業界ガイド由来を優先
5. 各候補に **verdict / concerns / highlights を必ず付与**

## データスキーマ

各候補は以下の Restaurant JSON 構造に厳密準拠:

\`\`\`json
{
  "name": "string (必須)",
  "city": "Rome | Florence | Sicily (必須)",
  "area": "string (推奨、地区名)",
  "genre": "pizzeria | trattoria | osteria | ristorante | enoteca | bar | gelateria | paninoteca | pasticceria | other (必須)",
  "priceRange": "€ | €€ | €€€ | €€€€ (推奨)",
  "lat": number (おおよそ可、後で精密化),
  "lng": number (同上),
  "address": "string (あれば必須)",
  "visited": false,
  "url": "string (公式 URL があれば)",
  "tags": ["string"],
  "source": "gambero-rosso | 50-top-pizza | slow-food | identita-golose | food-blogger | reddit-local | friend | guidebook | google-maps | other",
  "sourceTrust": "high | medium | low",
  "verdict": "recommended | neutral | caution | skip",
  "concerns": [{ "type": "tourist-oriented|overpriced|mediocre-food|quality-declined|not-authentic|service-issues|hidden-fees|language-barrier-eng-only|long-wait|crowded-noisy", "severity": "low|medium|high", "note": "string?" }],
  "highlights": [{ "type": "locals-frequent|family-run|generations-old|signature-dish|hidden-gem|award-winning|seasonal-menu|fresh-ingredients|innovative|value-for-money", "note": "string?" }],
  "lastAnalyzed": "2026-05-18"
}
\`\`\`

## 既存店リスト（重複させない）

${existingSummary}

## 応答フォーマット

ユーザーの質問に対して、以下の JSON を返す（コードブロック付きで OK）:

\`\`\`json
{
  "message": "（日本語で 1〜3 文の会話的説明）",
  "candidates": [/* 上記スキーマの Restaurant オブジェクト配列、最大 5 件 */],
  "sources": [/* 参照した URL の配列 */]
}
\`\`\`

候補が見つからない場合は candidates を空配列 \`[]\` とし、message でその旨を説明。`;
}

export async function chatWithClaude(userMessage: string, existing: Restaurant[]): Promise<string> {
  const response = await client.messages.create({
    model: CHAT_MODEL,
    max_tokens: 4096,
    system: buildSystemPrompt(existing),
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 5,
      } as unknown as Anthropic.Tool,
    ],
    messages: [{ role: 'user', content: userMessage }],
  });

  // Extract text content from all blocks
  const textBlocks = response.content.filter((block): block is Anthropic.TextBlock => block.type === 'text');
  return textBlocks.map((b) => b.text).join('\n');
}

/**
 * Claude のテキスト応答から JSON ブロックを抽出。
 */
export function extractJson(text: string): { message: string; candidates: unknown[]; sources?: string[] } | null {
  // ```json ... ``` ブロック優先
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  try {
    const parsed = JSON.parse(raw.trim());
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        message: typeof parsed.message === 'string' ? parsed.message : '',
        candidates: Array.isArray(parsed.candidates) ? parsed.candidates : [],
        sources: Array.isArray(parsed.sources) ? parsed.sources.filter((s: unknown) => typeof s === 'string') : undefined,
      };
    }
  } catch {
    // not JSON, return as plain message
  }
  return null;
}
