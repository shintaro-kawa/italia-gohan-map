import { createHash } from 'node:crypto';
import type { Todo, TodoCity } from '@/types/todo';
import { TODO_CITY_SET, compareTodos } from '@/types/todo';
import todosJson from '../../data/todos.json';

function generateId(title: string, createdAt: string): string {
  const hash = createHash('sha1').update(`${title}|${createdAt}`).digest('hex').slice(0, 8);
  return `todo-${hash}`;
}

function sanitize(item: unknown): Todo | null {
  if (!item || typeof item !== 'object') return null;
  const r = item as Record<string, unknown>;
  if (typeof r.title !== 'string' || !r.title.trim()) return null;

  const createdAt =
    typeof r.createdAt === 'string' && r.createdAt.trim()
      ? r.createdAt
      : new Date(0).toISOString();
  const updatedAt =
    typeof r.updatedAt === 'string' && r.updatedAt.trim()
      ? r.updatedAt
      : createdAt;

  const id =
    typeof r.id === 'string' && r.id.trim()
      ? r.id
      : generateId(r.title, createdAt);

  const city =
    typeof r.city === 'string' && TODO_CITY_SET.has(r.city as TodoCity)
      ? (r.city as TodoCity)
      : undefined;

  return {
    id,
    title: r.title.trim(),
    done: r.done === true,
    city,
    notes: typeof r.notes === 'string' ? r.notes : undefined,
    deadline: typeof r.deadline === 'string' && r.deadline.trim() ? r.deadline : undefined,
    createdAt,
    updatedAt,
    deletedAt: typeof r.deletedAt === 'string' && r.deletedAt.trim() ? r.deletedAt : undefined,
  };
}

export async function getTodos(): Promise<Todo[]> {
  const raw = todosJson as unknown[];
  const items: Todo[] = [];
  for (const r of raw) {
    const s = sanitize(r);
    if (s && !s.deletedAt) items.push(s);
  }
  return items.sort(compareTodos);
}
