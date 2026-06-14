import { createHash } from 'node:crypto';
import type { ItineraryItem, ItineraryType } from '@/types/itinerary';
import { ITINERARY_TYPE_SET, compareItineraryItems } from '@/types/itinerary';
import itineraryJson from '../../data/itinerary.json';

function generateId(type: string, title: string, startAt: string): string {
  const hash = createHash('sha1').update(`${type}|${title}|${startAt}`).digest('hex').slice(0, 8);
  return `${type}-${hash}`;
}

function sanitize(item: unknown): ItineraryItem | null {
  if (!item || typeof item !== 'object') return null;
  const r = item as Record<string, unknown>;
  if (typeof r.type !== 'string' || !ITINERARY_TYPE_SET.has(r.type as ItineraryType)) return null;
  if (typeof r.title !== 'string' || !r.title.trim()) return null;
  if (typeof r.startAt !== 'string' || !r.startAt.trim()) return null;

  const id =
    typeof r.id === 'string' && r.id.trim()
      ? r.id
      : generateId(r.type, r.title, r.startAt);

  return {
    id,
    type: r.type as ItineraryType,
    title: r.title.trim(),
    startAt: r.startAt,
    endAt: typeof r.endAt === 'string' ? r.endAt : undefined,
    location: typeof r.location === 'object' && r.location ? (r.location as ItineraryItem['location']) : undefined,
    details: typeof r.details === 'object' && r.details ? (r.details as ItineraryItem['details']) : undefined,
    notes: typeof r.notes === 'string' ? r.notes : undefined,
  };
}

export async function getItinerary(): Promise<ItineraryItem[]> {
  const raw = itineraryJson as unknown[];
  const items: ItineraryItem[] = [];
  for (const r of raw) {
    const s = sanitize(r);
    if (s) items.push(s);
  }
  return items.sort(compareItineraryItems);
}
