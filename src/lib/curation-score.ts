import type { Restaurant } from '../types/restaurant.js';

// 「おすすめ順」ソート用のキュレーションスコア (D-035)。
// rating データが存在しないため、キュレーション時に付与済みの
// verdict / sourceTrust / highlights / concerns から算出する。

const VERDICT_SCORE: Record<string, number> = {
  recommended: 20,
  neutral: 10,
  caution: -10,
  skip: -30,
};

const TRUST_SCORE: Record<string, number> = { high: 3, medium: 1, low: 0 };

const SEVERITY_PENALTY: Record<string, number> = { low: 1, medium: 2, high: 3 };

export function curationScore(r: Restaurant): number {
  let score = VERDICT_SCORE[r.verdict ?? ''] ?? 0;
  score += TRUST_SCORE[r.sourceTrust ?? ''] ?? 0;
  score += Math.min(r.highlights?.length ?? 0, 5);
  for (const c of r.concerns ?? []) {
    score -= SEVERITY_PENALTY[c.severity] ?? 1;
  }
  return score;
}
