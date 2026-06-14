import type { VercelRequest, VercelResponse } from '@vercel/node';
import { upsertItineraryItem, deleteItineraryItem } from '../src/lib/github-itinerary.js';
import type { ItineraryItem, ItineraryType } from '../src/types/itinerary.js';

const VALID_TYPES = new Set<ItineraryType>([
  'flight',
  'hotel',
  'train',
  'attraction',
  'restaurant',
  'generic',
]);

function validate(input: unknown): ItineraryItem | string {
  if (!input || typeof input !== 'object') return 'item must be an object';
  const r = input as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id.trim()) return 'id required';
  if (typeof r.type !== 'string' || !VALID_TYPES.has(r.type as ItineraryType)) return 'invalid type';
  if (typeof r.title !== 'string' || !r.title.trim()) return 'title required';
  if (typeof r.startAt !== 'string' || !r.startAt.trim()) return 'startAt required';

  const cleaned: ItineraryItem = {
    id: r.id.trim(),
    type: r.type as ItineraryType,
    title: r.title.trim(),
    startAt: r.startAt,
  };
  if (typeof r.endAt === 'string' && r.endAt.trim()) cleaned.endAt = r.endAt;
  if (r.location && typeof r.location === 'object') {
    cleaned.location = r.location as ItineraryItem['location'];
  }
  if (r.details && typeof r.details === 'object' && !Array.isArray(r.details)) {
    cleaned.details = r.details as ItineraryItem['details'];
  }
  if (typeof r.notes === 'string' && r.notes.trim()) cleaned.notes = r.notes.trim();
  return cleaned;
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

  const body = req.body as { action?: string; item?: unknown } | undefined;
  const action = body?.action;
  if (action !== 'upsert' && action !== 'delete') {
    return res.status(400).json({ error: 'action must be "upsert" or "delete"' });
  }

  if (action === 'delete') {
    const raw = body.item as { id?: string } | undefined;
    const id = typeof raw?.id === 'string' ? raw.id.trim() : '';
    if (!id) return res.status(400).json({ error: 'id required for delete' });
    try {
      const { commitSha } = await deleteItineraryItem(id);
      return res.status(200).json({ ok: true, id, commitSha });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      const status = msg.includes('No itinerary item') ? 404 : 500;
      return res.status(status).json({ error: msg });
    }
  }

  const validated = validate(body?.item);
  if (typeof validated === 'string') {
    return res.status(400).json({ error: validated });
  }

  try {
    const { commitSha, id } = await upsertItineraryItem(validated);
    return res.status(200).json({ ok: true, id, commitSha });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ error: msg });
  }
}
