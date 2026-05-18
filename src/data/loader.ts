import { createHash } from 'node:crypto';
import type {
  Concern,
  ConcernType,
  Highlight,
  HighlightType,
  Restaurant,
  Severity,
} from '@/types/restaurant';
import { CONCERN_TYPES, HIGHLIGHT_TYPES } from '@/types/restaurant';
import restaurantsJson from '../../data/restaurants.json';

const VALID_SEVERITY: ReadonlySet<Severity> = new Set<Severity>(['low', 'medium', 'high']);

function generateId(name: string, city: string): string {
  const hash = createHash('sha1').update(`${name}|${city}`).digest('hex').slice(0, 8);
  return `${city.toLowerCase()}-${hash}`;
}

function sanitizeConcerns(raw: unknown): Concern[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: Concern[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    const type = obj.type;
    const severity = obj.severity;
    if (typeof type !== 'string' || typeof severity !== 'string') continue;
    if (!CONCERN_TYPES.has(type as ConcernType)) {
      console.warn(`[loader] Unknown concern type "${type}", dropping`);
      continue;
    }
    if (!VALID_SEVERITY.has(severity as Severity)) {
      console.warn(`[loader] Invalid severity "${severity}", dropping`);
      continue;
    }
    out.push({
      type: type as ConcernType,
      severity: severity as Severity,
      note: typeof obj.note === 'string' && obj.note.trim() ? obj.note.trim() : undefined,
    });
  }
  return out.length > 0 ? out : undefined;
}

function sanitizeHighlights(raw: unknown): Highlight[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: Highlight[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    const type = obj.type;
    if (typeof type !== 'string') continue;
    if (!HIGHLIGHT_TYPES.has(type as HighlightType)) {
      console.warn(`[loader] Unknown highlight type "${type}", dropping`);
      continue;
    }
    out.push({
      type: type as HighlightType,
      note: typeof obj.note === 'string' && obj.note.trim() ? obj.note.trim() : undefined,
    });
  }
  return out.length > 0 ? out : undefined;
}

/**
 * D-024 以降: `data/restaurants.json` を source of truth として直接 import。
 * Sheets 連携は廃止済み（過去の fetchFromSheets は git 履歴を参照）。
 */
export async function getRestaurants(): Promise<Restaurant[]> {
  const data = restaurantsJson as Restaurant[];
  return data.map((r) => ({
    ...r,
    id: r.id || generateId(r.name, r.city),
    concerns: sanitizeConcerns(r.concerns),
    highlights: sanitizeHighlights(r.highlights),
  }));
}
