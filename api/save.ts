import type { VercelRequest, VercelResponse } from '@vercel/node';
import { appendRestaurant } from '../src/lib/github.js';
import type { Restaurant } from '../src/types/restaurant.js';

const VALID_GENRES = new Set([
  'pizzeria', 'trattoria', 'osteria', 'ristorante', 'enoteca',
  'bar', 'gelateria', 'paninoteca', 'pasticceria', 'other',
]);
const VALID_CITIES = new Set(['Rome', 'Florence', 'Sicily']);

function validate(input: unknown): Restaurant | string {
  if (!input || typeof input !== 'object') return 'candidate must be an object';
  const r = input as Record<string, unknown>;
  if (typeof r.name !== 'string' || !r.name.trim()) return 'name required';
  if (typeof r.city !== 'string' || !VALID_CITIES.has(r.city)) return 'invalid city';
  if (typeof r.genre !== 'string' || !VALID_GENRES.has(r.genre)) return 'invalid genre';
  const lat = Number(r.lat);
  const lng = Number(r.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return 'invalid lat/lng';
  return {
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
  };
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

  const body = req.body as { candidate?: unknown } | undefined;
  const validated = validate(body?.candidate);
  if (typeof validated === 'string') {
    return res.status(400).json({ error: validated });
  }

  try {
    const { id, commitSha } = await appendRestaurant(validated);
    return res.status(200).json({ ok: true, id, commitSha, note: 'Vercel will rebuild in 1-2 minutes' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    const status = msg.includes('Duplicate') ? 409 : 500;
    return res.status(status).json({ error: msg });
  }
}
