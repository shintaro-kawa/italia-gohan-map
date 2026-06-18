import type { ItineraryItem } from '../types/itinerary.js';

export interface MergeResult {
  /** マージ結果の全アイテム (tombstone 含む) */
  next: ItineraryItem[];
  /** 反映された書き込みの id */
  applied: string[];
  /** 古いタイムスタンプで skip された書き込みの id と理由 */
  skipped: { id: string; reason: string }[];
}

/**
 * サーバー側の現在アイテム配列 (tombstone 含む) と、
 * クライアントから来た writes 配列をマージする。
 *
 * ルール: id ごとに updatedAt が新しい方を採用 (last-write-wins)。
 * 新規 id は無条件に追加。
 *
 * 純関数: 入力を mutate しない。
 *
 * 同タイムスタンプ (updatedAt が一致) は stale 扱い (strict `>` で比較)。
 * 同秒内の同時書き込みはサーバー優先。
 */
export function mergeItems(server: ItineraryItem[], writes: ItineraryItem[]): MergeResult {
  const byId = new Map<string, ItineraryItem>();
  for (const s of server) byId.set(s.id, s);

  const applied: string[] = [];
  const skipped: { id: string; reason: string }[] = [];

  for (const w of writes) {
    const existing = byId.get(w.id);
    if (!existing) {
      byId.set(w.id, w);
      applied.push(w.id);
      continue;
    }
    const wTime = new Date(w.updatedAt).getTime();
    const eTime = new Date(existing.updatedAt).getTime();
    if (!Number.isFinite(wTime) || !Number.isFinite(eTime)) {
      skipped.push({ id: w.id, reason: 'invalid-timestamp' });
      continue;
    }
    if (wTime > eTime) {
      byId.set(w.id, w);
      applied.push(w.id);
    } else {
      skipped.push({ id: w.id, reason: 'stale' });
    }
  }

  return { next: Array.from(byId.values()), applied, skipped };
}
