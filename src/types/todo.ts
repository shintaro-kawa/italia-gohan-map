export type TodoCity = 'Rome' | 'Florence' | 'Palermo' | 'Taormina' | 'Sicily' | '全般';

export const TODO_CITIES: ReadonlyArray<{ value: TodoCity; label: string }> = [
  { value: 'Rome', label: 'ローマ' },
  { value: 'Florence', label: 'フィレンツェ' },
  { value: 'Palermo', label: 'パレルモ' },
  { value: 'Taormina', label: 'タオルミーナ' },
  { value: 'Sicily', label: 'シチリア' },
  { value: '全般', label: '全般' },
];

export const TODO_CITY_SET = new Set<TodoCity>(TODO_CITIES.map((c) => c.value));

export function isTodoCity(v: unknown): v is TodoCity {
  return typeof v === 'string' && TODO_CITY_SET.has(v as TodoCity);
}

export interface Todo {
  id: string;
  title: string;
  done: boolean;
  city?: TodoCity;
  notes?: string;
  /** ISO 日付 (例: "2026-07-15")、時刻なし */
  deadline?: string;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601、同期競合解決に使用 */
  updatedAt: string;
  /** ISO 8601、論理削除のトゥームストーン */
  deletedAt?: string;
}

export function todoCityLabel(city?: TodoCity): string {
  if (!city) return '全般';
  return TODO_CITIES.find((c) => c.value === city)?.label ?? city;
}

/**
 * 期限の緊急度を判定。
 * - overdue: 期限が今日より前
 * - soon: 期限が今日から 7 日以内
 * - normal: 期限が 8〜30 日以内
 * - far: 期限が 30 日より先
 * - none: 期限なし
 */
export type DeadlineUrgency = 'overdue' | 'soon' | 'normal' | 'far' | 'none';

export function deadlineUrgency(deadline: string | undefined, today: Date = new Date()): DeadlineUrgency {
  if (!deadline) return 'none';
  const d = new Date(deadline);
  if (!Number.isFinite(d.getTime())) return 'none';
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.floor((target - startOfToday) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 7) return 'soon';
  if (diffDays <= 30) return 'normal';
  return 'far';
}

/**
 * 並び替えキー: 未完了が上、期限超過 > 期限近い > 期限なし > 新着順、完了済は下。
 *
 * 安全性: 不正なタイムスタンプ文字列 (NaN) は最も古い (= Infinity) として扱い、
 * 最終的に id の lexicographic で全順序を保証 (sort 安定性のため)。
 */
export function compareTodos(a: Todo, b: Todo): number {
  if (a.done !== b.done) return a.done ? 1 : -1;

  const safeTs = (s: string | undefined): number => {
    if (!s) return Number.POSITIVE_INFINITY;
    const t = new Date(s).getTime();
    return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
  };

  if (a.done && b.done) {
    const aU = safeTs(a.updatedAt);
    const bU = safeTs(b.updatedAt);
    if (aU !== bU) return bU - aU;
    return a.id.localeCompare(b.id);
  }

  const aHas = !!a.deadline;
  const bHas = !!b.deadline;
  if (aHas && bHas) {
    const aT = safeTs(a.deadline);
    const bT = safeTs(b.deadline);
    if (aT !== bT) return aT - bT;
  } else if (aHas !== bHas) {
    return aHas ? -1 : 1;
  }

  const aC = safeTs(a.createdAt);
  const bC = safeTs(b.createdAt);
  if (aC !== bC) return bC - aC;
  return a.id.localeCompare(b.id);
}
