export type ItineraryType =
  | 'flight'
  | 'hotel'
  | 'train'
  | 'attraction'
  | 'restaurant'
  | 'generic';

export const ITINERARY_TYPES: ReadonlyArray<{
  value: ItineraryType;
  label: string;
  emoji: string;
}> = [
  { value: 'flight', label: '飛行機', emoji: '✈️' },
  { value: 'hotel', label: '宿泊', emoji: '🏨' },
  { value: 'train', label: '列車・交通', emoji: '🚄' },
  { value: 'attraction', label: '観光・博物館', emoji: '🏛️' },
  { value: 'restaurant', label: 'レストラン予約', emoji: '🍝' },
  { value: 'generic', label: 'その他', emoji: '📌' },
];

export interface ItineraryLocation {
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  from?: string;
  to?: string;
}

export interface ItineraryItem {
  id: string;
  type: ItineraryType;
  title: string;
  startAt: string;
  endAt?: string;
  location?: ItineraryLocation;
  details?: Record<string, string | number | boolean | null>;
  notes?: string;
  /** ISO 8601、最終更新タイムスタンプ。同期競合解決に使用。 */
  updatedAt: string;
  /** ISO 8601、論理削除のトゥームストーン。削除アイテムは物理削除せず deletedAt を立てて Gist に残す。 */
  deletedAt?: string;
}

export const ITINERARY_TYPE_SET = new Set<ItineraryType>(
  ITINERARY_TYPES.map((t) => t.value),
);

export function itineraryTypeMeta(type: ItineraryType): { label: string; emoji: string } {
  const t = ITINERARY_TYPES.find((x) => x.value === type);
  return t ? { label: t.label, emoji: t.emoji } : { label: type, emoji: '📌' };
}

export interface ItinerarySensitive {
  confirmationNumber?: string;
  bookingReference?: string;
  seatNumber?: string;
  roomNumber?: string;
  checkInCode?: string;
  ticketUrl?: string;
  attachmentUrl?: string;
  privateNotes?: string;
}

export function formatItineraryDateTime(iso: string, locale = 'ja-JP'): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function itineraryDateKey(iso: string): string {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return iso.slice(0, 10);
  }
}

export function compareItineraryItems(a: ItineraryItem, b: ItineraryItem): number {
  return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
}
