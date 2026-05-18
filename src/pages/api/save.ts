import type { APIRoute } from 'astro';
import { checkAuth } from '@/lib/auth';
import { appendRestaurant } from '@/lib/github';
import type { Restaurant } from '@/types/restaurant';

export const prerender = false;

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

export const POST: APIRoute = async ({ request }) => {
  const auth = checkAuth(request);
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.message }), {
      status: auth.status,
      headers: { 'content-type': 'application/json' },
    });
  }

  let body: { candidate?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const validated = validate(body.candidate);
  if (typeof validated === 'string') {
    return new Response(JSON.stringify({ error: validated }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const { id, commitSha } = await appendRestaurant(validated);
    return new Response(
      JSON.stringify({ ok: true, id, commitSha, note: 'Vercel will rebuild in 1-2 minutes' }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    const status = msg.includes('Duplicate') ? 409 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }
};
