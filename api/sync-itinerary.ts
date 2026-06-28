import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchItineraryGist, updateItineraryGist } from '../src/lib/github-gist.js';
import { mergeItems } from '../src/lib/itinerary-merge.js';
import type { ItineraryItem, ItineraryType } from '../src/types/itinerary.js';
import { ITINERARY_TYPE_SET } from '../src/types/itinerary.js';

function validateWrite(input: unknown): ItineraryItem | string {
  if (!input || typeof input !== 'object') return 'item must be object';
  const r = input as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id.trim()) return 'id required';
  if (typeof r.updatedAt !== 'string' || !r.updatedAt.trim()) return 'updatedAt required';
  if (typeof r.deletedAt === 'string' && r.deletedAt.trim()) {
    // tombstone: type/title/startAt は省略可
    return {
      id: r.id.trim(),
      type: (typeof r.type === 'string' && ITINERARY_TYPE_SET.has(r.type as ItineraryType) ? r.type : 'generic') as ItineraryType,
      title: typeof r.title === 'string' ? r.title : '',
      startAt: typeof r.startAt === 'string' ? r.startAt : new Date(0).toISOString(),
      updatedAt: r.updatedAt,
      deletedAt: r.deletedAt,
    };
  }
  // 通常アイテム: 必須フィールドあり
  if (typeof r.type !== 'string' || !ITINERARY_TYPE_SET.has(r.type as ItineraryType)) return 'invalid type';
  if (typeof r.title !== 'string' || !r.title.trim()) return 'title required';
  if (typeof r.startAt !== 'string' || !r.startAt.trim()) return 'startAt required';

  const item: ItineraryItem = {
    id: r.id.trim(),
    type: r.type as ItineraryType,
    title: r.title.trim(),
    startAt: r.startAt,
    updatedAt: r.updatedAt,
  };
  if (typeof r.endAt === 'string' && r.endAt.trim()) item.endAt = r.endAt;
  if (r.location && typeof r.location === 'object') item.location = r.location as ItineraryItem['location'];
  if (r.details && typeof r.details === 'object' && !Array.isArray(r.details)) {
    item.details = r.details as ItineraryItem['details'];
  }
  if (typeof r.notes === 'string' && r.notes.trim()) item.notes = r.notes.trim();
  if (typeof r.amount === 'number' && Number.isFinite(r.amount) && r.amount >= 0) {
    item.amount = r.amount;
  }
  if (r.currency === 'EUR' || r.currency === 'JPY') {
    item.currency = r.currency;
  }
  if (typeof r.paidBy === 'string' && r.paidBy.trim()) {
    item.paidBy = r.paidBy.trim();
  }
  return item;
}

function authOk(req: VercelRequest): string | null {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return 'ADMIN_PASSWORD not configured on server';
  const given = (req.headers['x-admin-password'] ?? '') as string;
  if (!given) return 'Missing X-Admin-Password header';
  if (given !== expected) return 'Invalid password';
  return null;
}

function checkGistConfig(res: VercelResponse): boolean {
  if (!process.env.ITINERARY_GIST_ID) {
    res.status(503).json({
      error: 'ITINERARY_GIST_ID not configured. Run: node scripts/setup-itinerary-gist.mjs',
    });
    return false;
  }
  if (!process.env.GITHUB_TOKEN) {
    res.status(503).json({ error: 'GITHUB_TOKEN not configured on server' });
    return false;
  }
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authErr = authOk(req);
  if (authErr) return res.status(401).json({ error: authErr });
  if (!checkGistConfig(res)) return;

  try {
    if (req.method === 'GET') {
      const content = await fetchItineraryGist();
      return res.status(200).json({
        version: content.version,
        items: content.items,
        serverTimestamp: new Date().toISOString(),
      });
    }

    if (req.method === 'POST') {
      const body = req.body as { writes?: unknown } | undefined;
      const raw = body?.writes;
      if (!Array.isArray(raw)) {
        return res.status(400).json({ error: 'writes must be an array' });
      }
      const writes: ItineraryItem[] = [];
      const rejected: { index: number; reason: string }[] = [];
      raw.forEach((w, i) => {
        const v = validateWrite(w);
        if (typeof v === 'string') rejected.push({ index: i, reason: v });
        else writes.push(v);
      });

      const current = await fetchItineraryGist();
      const { next, applied, skipped } = mergeItems(current.items, writes);
      const updated = await updateItineraryGist(next);

      return res.status(200).json({
        version: updated.version,
        items: updated.items,
        applied,
        skipped,
        rejected,
        serverTimestamp: new Date().toISOString(),
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ error: msg });
  }
}
