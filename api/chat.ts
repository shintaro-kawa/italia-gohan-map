import type { VercelRequest, VercelResponse } from '@vercel/node';
import { chatWithClaude, extractJson } from '../src/lib/anthropic.js';
import { fetchCurrentData } from '../src/lib/github.js';
import type { Restaurant } from '../src/types/restaurant.js';

const VALID_GENRES = new Set([
  'pizzeria', 'trattoria', 'osteria', 'ristorante', 'enoteca',
  'bar', 'gelateria', 'paninoteca', 'pasticceria', 'other',
]);
const VALID_CITIES = new Set(['Rome', 'Florence', 'Palermo', 'Taormina', 'Siracusa', 'Sicily']);
const VALID_ITINERARY_TYPES = new Set(['flight', 'hotel', 'train', 'attraction', 'restaurant', 'generic']);

/** 予約確認の貼り付けから抽出された旅程ドラフト (D-035)。登録は クライアント → /api/sync-itinerary。 */
function sanitizeItineraryDraft(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.title !== 'string' || !r.title.trim()) return null;
  if (typeof r.startAt !== 'string' || !r.startAt.trim()) return null;
  const out: Record<string, unknown> = {
    type: typeof r.type === 'string' && VALID_ITINERARY_TYPES.has(r.type) ? r.type : 'generic',
    title: r.title.trim(),
    startAt: r.startAt,
  };
  if (typeof r.endAt === 'string' && r.endAt.trim()) out.endAt = r.endAt;
  if (r.location && typeof r.location === 'object' && !Array.isArray(r.location)) out.location = r.location;
  if (typeof r.notes === 'string' && r.notes.trim()) out.notes = r.notes.trim();
  // 0 は「金額不明」の混入 (プロンプト例示への引っ張られ) なので除外
  if (typeof r.amount === 'number' && Number.isFinite(r.amount) && r.amount > 0) out.amount = r.amount;
  if (r.currency === 'EUR' || r.currency === 'JPY') out.currency = r.currency;
  return out;
}

function sanitizeCandidates(raw: unknown[]): Restaurant[] {
  const out: Restaurant[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    if (typeof r.name !== 'string' || !r.name.trim()) continue;
    if (typeof r.city !== 'string' || !VALID_CITIES.has(r.city)) continue;
    if (typeof r.genre !== 'string' || !VALID_GENRES.has(r.genre)) continue;
    const lat = Number(r.lat);
    const lng = Number(r.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    out.push({
      id: typeof r.id === 'string' ? r.id : '',
      name: r.name,
      city: r.city as Restaurant['city'],
      area: typeof r.area === 'string' ? r.area : undefined,
      genre: r.genre as Restaurant['genre'],
      priceRange: typeof r.priceRange === 'string' ? (r.priceRange as Restaurant['priceRange']) : undefined,
      lat,
      lng,
      address: typeof r.address === 'string' ? r.address : undefined,
      visited: false,
      url: typeof r.url === 'string' ? r.url : undefined,
      tags: Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === 'string') : undefined,
      source: typeof r.source === 'string' ? (r.source as Restaurant['source']) : undefined,
      sourceTrust: typeof r.sourceTrust === 'string' ? (r.sourceTrust as Restaurant['sourceTrust']) : undefined,
      verdict: typeof r.verdict === 'string' ? (r.verdict as Restaurant['verdict']) : undefined,
      concerns: Array.isArray(r.concerns) ? (r.concerns as Restaurant['concerns']) : undefined,
      highlights: Array.isArray(r.highlights) ? (r.highlights as Restaurant['highlights']) : undefined,
      lastAnalyzed: typeof r.lastAnalyzed === 'string' ? r.lastAnalyzed : new Date().toISOString().slice(0, 10),
    });
  }
  return out;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD not configured on server' });
  }
  const givenPassword = (req.headers['x-admin-password'] ?? '') as string;
  if (!givenPassword) return res.status(401).json({ error: 'Missing X-Admin-Password header' });
  if (givenPassword !== expectedPassword) return res.status(401).json({ error: 'Invalid password' });

  const body = req.body as { message?: string } | undefined;
  const userMessage = body?.message?.trim();
  if (!userMessage) {
    return res.status(400).json({ error: 'message required' });
  }

  try {
    const { data: existing } = await fetchCurrentData();
    const claudeText = await chatWithClaude(userMessage, existing);
    const parsed = extractJson(claudeText);
    if (!parsed) {
      return res.status(200).json({ message: claudeText, candidates: [], sources: [] });
    }
    const candidates = sanitizeCandidates(parsed.candidates);
    const itineraryDraft = sanitizeItineraryDraft(parsed.itineraryDraft);
    return res.status(200).json({
      message: parsed.message,
      candidates,
      sources: parsed.sources ?? [],
      ...(itineraryDraft ? { itineraryDraft } : {}),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ error: 'Internal error: ' + msg });
  }
}
