/** 艾宾浩斯遗忘曲线 + SM-2 算法: 1→3→7→15→30天 */
const INTERVALS = [1, 3, 7, 15, 30];

export function getNextInterval(reviewCount: number, ease = 2.5): number {
  if (reviewCount < INTERVALS.length) return INTERVALS[reviewCount];
  return Math.round(INTERVALS[INTERVALS.length - 1] * ease * (reviewCount - INTERVALS.length + 1));
}

export function getNextReviewTime(reviewCount: number, ease?: number): Date {
  const now = new Date();
  now.setDate(now.getDate() + getNextInterval(reviewCount, ease));
  return now;
}

export function updateEase(currentEase: number, quality: number): number {
  const newEase = currentEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  return Math.max(1.3, newEase);
}

export function sortByReviewPriority<T extends { nextReviewTime: Date; masteryScore?: number }>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    const aOverdue = Date.now() - a.nextReviewTime.getTime();
    const bOverdue = Date.now() - b.nextReviewTime.getTime();
    if (aOverdue > 0 && bOverdue <= 0) return -1;
    if (bOverdue > 0 && aOverdue <= 0) return 1;
    return (a.masteryScore ?? 50) - (b.masteryScore ?? 50);
  });
}
