/**
 * 旅程の時刻ポリシー: 「イベント現地の壁時計時刻」を `YYYY-MM-DDTHH:mm`
 * (タイムゾーンオフセット無し) で保存・表示する。
 *
 * 端末のタイムゾーンで UTC に変換して保存すると、旅行先で端末のタイム
 * ゾーンが変わった瞬間に表示がずれる (D-036 のバグ)。旅程の時刻は
 * 「どこで見ても 19:00 は 19:00」でなければならないので、Date による
 * タイムゾーン変換を一切通さない。
 *
 * updatedAt / deletedAt は同期の競合解決用の機械タイムスタンプなので、
 * 従来どおり UTC ISO (toISOString) のまま。このモジュールの対象外。
 */

const OFFSET_RE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/**
 * オフセット付きの旧データ (UTC 保存時代) を解釈するタイムゾーン。
 * 旅行先 (イタリア) の壁時計時刻に固定変換することで、現地で見えて
 * いる時刻のまま以後どの端末でも変わらなくなる。
 */
export const LEGACY_TIME_ZONE = 'Europe/Rome';

/** 保存値を壁時計時刻 `YYYY-MM-DDTHH:mm` に正規化する */
export function toWallClock(value: string): string {
  const s = value.trim();
  if (!s) return '';
  if (!OFFSET_RE.test(s)) return s.slice(0, 16);
  const d = new Date(s);
  if (!Number.isFinite(d.getTime())) return s.slice(0, 16);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: LEGACY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const get = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

/** 壁時計の日付部分 `YYYY-MM-DD` (日別グルーピングのキー) */
export function wallDateKey(value: string): string {
  return toWallClock(value).slice(0, 10);
}

/** 壁時計の時刻部分 `HH:mm` */
export function wallHm(value: string): string {
  return toWallClock(value).slice(11, 16);
}

/** 壁時計時刻の比較。`YYYY-MM-DDTHH:mm` は辞書順 = 時系列順 */
export function compareWallClock(a: string, b: string): number {
  const wa = toWallClock(a);
  const wb = toWallClock(b);
  return wa < wb ? -1 : wa > wb ? 1 : 0;
}

/** 開始日の前日 `YYYY-MM-DD` (ToDo 期限用)。壁時計の日付だけで計算する */
export function wallDateBefore(value: string): string {
  const key = wallDateKey(value);
  const d = new Date(`${key}T00:00:00Z`);
  if (!Number.isFinite(d.getTime())) return '';
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
