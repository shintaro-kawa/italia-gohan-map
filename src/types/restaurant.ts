export type Genre =
  | 'pizzeria'
  | 'trattoria'
  | 'osteria'
  | 'ristorante'
  | 'enoteca'
  | 'bar'
  | 'gelateria'
  | 'paninoteca'
  | 'pasticceria'
  | 'other';

export const GENRES: ReadonlyArray<{ value: Genre; label: string }> = [
  { value: 'pizzeria', label: 'ピッツェリア' },
  { value: 'trattoria', label: 'トラットリア' },
  { value: 'osteria', label: 'オステリア' },
  { value: 'ristorante', label: 'リストランテ' },
  { value: 'enoteca', label: 'エノテカ' },
  { value: 'bar', label: 'バール' },
  { value: 'gelateria', label: 'ジェラテリア' },
  { value: 'paninoteca', label: 'パニノテカ' },
  { value: 'pasticceria', label: 'パスティッチェリア' },
  { value: 'other', label: 'その他' },
];

export type City = 'Rome' | 'Florence' | 'Sicily';

export const CITIES: ReadonlyArray<{ value: City; label: string }> = [
  { value: 'Rome', label: 'ローマ' },
  { value: 'Florence', label: 'フィレンツェ' },
  { value: 'Sicily', label: 'シチリア' },
];

export const CITY_CENTERS: Record<City, [number, number]> = {
  Rome: [41.9028, 12.4964],
  Florence: [43.7696, 11.2558],
  Sicily: [37.6, 14.0152],
};

export type PriceRange = '€' | '€€' | '€€€' | '€€€€';

export type VisitFilter = 'all' | 'visited' | 'unvisited';

export type Source =
  | 'gambero-rosso'
  | '50-top-pizza'
  | 'slow-food'
  | 'identita-golose'
  | 'food-blogger'
  | 'reddit-local'
  | 'friend'
  | 'guidebook'
  | 'google-maps'
  | 'other';

export type SourceTrust = 'high' | 'medium' | 'low';

export const SOURCES: ReadonlyArray<{ value: Source; label: string; defaultTrust: SourceTrust }> = [
  { value: 'gambero-rosso', label: 'Gambero Rosso', defaultTrust: 'high' },
  { value: '50-top-pizza', label: '50 Top Pizza', defaultTrust: 'high' },
  { value: 'slow-food', label: 'Slow Food', defaultTrust: 'high' },
  { value: 'identita-golose', label: 'Identità Golose', defaultTrust: 'high' },
  { value: 'food-blogger', label: '食ブログ', defaultTrust: 'medium' },
  { value: 'reddit-local', label: 'Reddit (ローカル)', defaultTrust: 'medium' },
  { value: 'friend', label: '友人推薦', defaultTrust: 'medium' },
  { value: 'guidebook', label: 'ガイドブック', defaultTrust: 'medium' },
  { value: 'google-maps', label: 'Google Maps', defaultTrust: 'low' },
  { value: 'other', label: 'その他', defaultTrust: 'low' },
];

export type Verdict = 'recommended' | 'neutral' | 'caution' | 'skip';

export const VERDICTS: ReadonlyArray<{ value: Verdict; label: string; emoji: string }> = [
  { value: 'recommended', label: '推奨', emoji: '🟢' },
  { value: 'neutral', label: '普通', emoji: '⚪' },
  { value: 'caution', label: '要注意', emoji: '🟡' },
  { value: 'skip', label: '非推奨', emoji: '🔴' },
];

export type ConcernType =
  | 'tourist-oriented'
  | 'overpriced'
  | 'mediocre-food'
  | 'quality-declined'
  | 'not-authentic'
  | 'service-issues'
  | 'hidden-fees'
  | 'language-barrier-eng-only'
  | 'long-wait'
  | 'crowded-noisy';

export const CONCERN_LABELS: Record<ConcernType, string> = {
  'tourist-oriented': '観光客向け',
  overpriced: '割高',
  'mediocre-food': '味が平凡',
  'quality-declined': '品質低下',
  'not-authentic': '本場感薄い',
  'service-issues': 'サービス難',
  'hidden-fees': '隠れ料金',
  'language-barrier-eng-only': '英語前提',
  'long-wait': '待ち時間長',
  'crowded-noisy': '混雑騒音',
};

export type Severity = 'low' | 'medium' | 'high';

export const SEVERITY_RANK: Record<Severity, number> = { low: 1, medium: 2, high: 3 };

export interface Concern {
  type: ConcernType;
  severity: Severity;
  note?: string;
}

export type HighlightType =
  | 'locals-frequent'
  | 'family-run'
  | 'generations-old'
  | 'signature-dish'
  | 'hidden-gem'
  | 'award-winning'
  | 'seasonal-menu'
  | 'fresh-ingredients'
  | 'innovative'
  | 'value-for-money';

export const HIGHLIGHT_LABELS: Record<HighlightType, string> = {
  'locals-frequent': '地元客多い',
  'family-run': '家族経営',
  'generations-old': '老舗',
  'signature-dish': '名物料理',
  'hidden-gem': '隠れた名店',
  'award-winning': '受賞歴',
  'seasonal-menu': '季節メニュー',
  'fresh-ingredients': '地元食材',
  innovative: '革新的',
  'value-for-money': 'コスパ良',
};

export interface Highlight {
  type: HighlightType;
  note?: string;
}

export const CONCERN_TYPES = new Set<ConcernType>(Object.keys(CONCERN_LABELS) as ConcernType[]);
export const HIGHLIGHT_TYPES = new Set<HighlightType>(Object.keys(HIGHLIGHT_LABELS) as HighlightType[]);

export interface Restaurant {
  id: string;
  name: string;
  city: City;
  area?: string;
  genre: Genre;
  priceRange?: PriceRange;
  lat: number;
  lng: number;
  address?: string;
  visited: boolean;
  visitDate?: string;
  rating?: number;
  comment?: string;
  url?: string;
  tags?: string[];
  source?: Source;
  sourceTrust?: SourceTrust;
  verdict?: Verdict;
  concerns?: Concern[];
  highlights?: Highlight[];
  lastAnalyzed?: string;
}

export function genreLabel(genre: Genre): string {
  return GENRES.find((g) => g.value === genre)?.label ?? genre;
}

export function cityLabel(city: City): string {
  return CITIES.find((c) => c.value === city)?.label ?? city;
}

export function sourceLabel(source: Source): string {
  return SOURCES.find((s) => s.value === source)?.label ?? source;
}

export function verdictMeta(verdict: Verdict): { label: string; emoji: string } {
  const v = VERDICTS.find((x) => x.value === verdict);
  return v ? { label: v.label, emoji: v.emoji } : { label: verdict, emoji: '' };
}

export function topConcern(concerns: Concern[] | undefined): Concern | undefined {
  if (!concerns || concerns.length === 0) return undefined;
  return [...concerns].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])[0];
}

export function topHighlight(highlights: Highlight[] | undefined): Highlight | undefined {
  return highlights && highlights.length > 0 ? highlights[0] : undefined;
}
