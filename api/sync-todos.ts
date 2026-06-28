import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchTodosGist, updateTodosGist } from '../src/lib/github-gist.js';
import { mergeTodos } from '../src/lib/todos-merge.js';
import type { Todo, TodoCity } from '../src/types/todo.js';
import { TODO_CITY_SET } from '../src/types/todo.js';

function validateWrite(input: unknown): Todo | string {
  if (!input || typeof input !== 'object') return 'item must be object';
  const r = input as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id.trim()) return 'id required';
  if (typeof r.updatedAt !== 'string' || !r.updatedAt.trim()) return 'updatedAt required';

  // tombstone: title 省略可
  if (typeof r.deletedAt === 'string' && r.deletedAt.trim()) {
    return {
      id: r.id.trim(),
      title: typeof r.title === 'string' ? r.title : '',
      done: r.done === true,
      city:
        typeof r.city === 'string' && TODO_CITY_SET.has(r.city as TodoCity)
          ? (r.city as TodoCity)
          : undefined,
      createdAt: typeof r.createdAt === 'string' ? r.createdAt : r.updatedAt,
      updatedAt: r.updatedAt,
      deletedAt: r.deletedAt,
    };
  }

  if (typeof r.title !== 'string' || !r.title.trim()) return 'title required';
  if (typeof r.createdAt !== 'string' || !r.createdAt.trim()) return 'createdAt required';

  const todo: Todo = {
    id: r.id.trim(),
    title: r.title.trim(),
    done: r.done === true,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
  if (typeof r.city === 'string' && TODO_CITY_SET.has(r.city as TodoCity)) {
    todo.city = r.city as TodoCity;
  }
  if (typeof r.notes === 'string' && r.notes.trim()) todo.notes = r.notes.trim();
  if (typeof r.deadline === 'string' && r.deadline.trim()) todo.deadline = r.deadline;
  if (typeof r.amount === 'number' && Number.isFinite(r.amount) && r.amount >= 0) {
    todo.amount = r.amount;
  }
  if (r.currency === 'EUR' || r.currency === 'JPY') {
    todo.currency = r.currency;
  }
  if (typeof r.paidBy === 'string' && r.paidBy.trim()) {
    todo.paidBy = r.paidBy.trim();
  }
  return todo;
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
      error:
        'ITINERARY_GIST_ID not configured (shared between itinerary and todos sync). ' +
        'Run: node scripts/setup-itinerary-gist.mjs',
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
      const content = await fetchTodosGist();
      return res.status(200).json({
        version: content.version,
        todos: content.todos,
        serverTimestamp: new Date().toISOString(),
      });
    }

    if (req.method === 'POST') {
      const body = req.body as { writes?: unknown } | undefined;
      const raw = body?.writes;
      if (!Array.isArray(raw)) {
        return res.status(400).json({ error: 'writes must be an array' });
      }
      const writes: Todo[] = [];
      const rejected: { index: number; reason: string }[] = [];
      raw.forEach((w, i) => {
        const v = validateWrite(w);
        if (typeof v === 'string') rejected.push({ index: i, reason: v });
        else writes.push(v);
      });

      const current = await fetchTodosGist();
      const { next, applied, skipped } = mergeTodos(current.todos, writes);
      const updated = await updateTodosGist(next);

      return res.status(200).json({
        version: updated.version,
        todos: updated.todos,
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
