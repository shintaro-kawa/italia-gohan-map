import Anthropic from '@anthropic-ai/sdk';
import type { Restaurant } from '../types/restaurant.js';

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  _client = new Anthropic({ apiKey });
  return _client;
}

export const CHAT_MODEL = 'claude-sonnet-4-6';

/**
 * Claude に投げる system prompt。
 * docs/ai-prompt-template.md と data-model.md の制約を畳み込んだもの。
 */
export function buildSystemPrompt(existing: Restaurant[]): string {
  const existingSummary = existing
    .map((r) => `${r.id}: ${r.name} (${r.city}/${r.area ?? '-'}/${r.genre})`)
    .join('\n');

  return `あなたはイタリア旅行アプリのアシスタントです。応答の前に必ず **モード判定** を行う:

## モード判定（最優先・厳守）

ユーザーのメッセージが **予約確認の貼り付け**（レストラン予約・ホテル・航空券・列車などの確認メール本文、WhatsApp 通知、予約サイトの確認文）である場合は、**モード A（予約取り込み）** で応答する。それ以外（店探しの質問・相談）は **モード B（店舗提案）**。

## モード A: 予約取り込み

貼られた予約から旅程アイテムを抽出し、**以下の JSON のみ** を返す（前置き・解説・表は不要）:

\`\`\`json
{
  "message": "（抽出内容の 1〜2 文サマリ、日本語）",
  "itineraryDraft": {
    "type": "flight | hotel | train | attraction | restaurant | generic",
    "title": "string (例: Ristorante Da Nino 予約 2名)",
    "startAt": "ISO 8601 現地時刻 (例: 2026-09-14T12:00:00)",
    "endAt": "ISO 8601 (チェックアウト・到着時刻があれば)",
    "location": { "name": "string?", "address": "string?", "from": "string?", "to": "string?" },
    "notes": "予約番号・人数・条件など本文から読み取れた補足 (日本語で簡潔に)",
    "amount": 0,
    "currency": "EUR | JPY"
  }
}
\`\`\`

- **モード B のルールは一切適用しない**: 都市制限なし（Letojanni・Catania・Dubai 等どこでも OK）、web_search 不要、既存店リストとの重複チェック不要
- 日付に年がなければ 2026 年と解釈。時刻は現地時刻のまま（タイムゾーン変換しない）
- 読み取れないフィールドは**省略**する（憶測で埋めない）。amount は金額が明記されている場合のみ

## モード B: 店舗提案

あなたはイタリア料理の専門家として、ユーザーの旅行用店舗マップに新しい店舗を提案する。

### 厳守ルール（モード B のみ）

1. **必ず web_search ツールで実在を確認** してから提案する。検索結果のヒットがない店は提案しない（幻覚禁止）
2. **city は Rome / Florence / Palermo / Taormina / Siracusa の 5 つのみ**。それ以外の都市（Venice / Naples / Catania 等）の店は提案不可、その旨ユーザーに伝える。`Sicily` 値は legacy エントリ専用で新規には使わない
3. **既存店との重複を避ける**（下記リスト参照）
4. **観光客向けの罠を避ける**: Gambero Rosso / 50 Top Pizza / Slow Food Osterie d'Italia 等の業界ガイド由来を優先
5. 各候補に **verdict / concerns / highlights を必ず付与**

## データスキーマ

各候補は以下の Restaurant JSON 構造に厳密準拠:

\`\`\`json
{
  "name": "string (必須)",
  "city": "Rome | Florence | Palermo | Taormina | Siracusa (必須)",
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

## 応答フォーマット（モード B）

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
  const response = await getClient().messages.create({
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
export function extractJson(
  text: string,
): { message: string; candidates: unknown[]; sources?: string[]; itineraryDraft?: unknown } | null {
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
        itineraryDraft:
          parsed.itineraryDraft && typeof parsed.itineraryDraft === 'object' && !Array.isArray(parsed.itineraryDraft)
            ? parsed.itineraryDraft
            : undefined,
      };
    }
  } catch {
    // not JSON, return as plain message
  }
  return null;
}
