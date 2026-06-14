/**
 * LearnOS 3.0 — 核心算法引擎
 * FSRS v5 记忆调度 + Mastery Score 掌握度评估
 * 
 * 来源: Claude Code 实现的 Python 版本 → TypeScript 移植
 */

// ============================================================
// FSRS v5 参数
// ============================================================
export const FSRS_DEFAULT_PARAMS = {
  w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18],
  requestRetention: 0.9,
  maximumInterval: 36500,
};

export interface FSRSState {
  difficulty: number;    // D (0-1)
  stability: number;     // S (天)
  retrievability: number; // R (0-1)
}

export interface FSRSScheduleResult extends FSRSState {
  interval: number;       // 下次间隔(天)
  nextReviewAt: Date;     // 下次复习时间
}

/**
 * 计算可提取概率 R(t)
 * R(t) = (1 + 19 * t/S)^(-0.5)
 */
export function calculateRetrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + 19 * elapsedDays / stability, -0.5);
}

/**
 * 根据评分调整难度
 * rating: 1=Again 2=Hard 3=Good 4=Easy
 */
function adjustDifficulty(difficulty: number, rating: number): number {
  const changes: Record<number, number> = { 1: 0.15, 2: 0.05, 3: -0.05, 4: -0.15 };
  const delta = changes[rating] || 0;
  return Math.max(0, Math.min(1, difficulty + delta));
}

/**
 * 计算新的稳定性 S'
 */
function calculateNextStability(
  difficulty: number,
  stability: number,
  retrievability: number,
  rating: number,
  params = FSRS_DEFAULT_PARAMS
): number {
  const w = params.w;
  if (rating === 1) {
    // Again: 稳定性重置
    return Math.max(
      0.5,
      stability * Math.exp(w[7] * (11 - difficulty * 10) * Math.pow(stability, -w[8]) * (Math.exp((1 - retrievability) * w[9]) - 1))
    );
  }
  
  // Hard/Good/Easy: 稳定性增长
  const hardPenalty = rating === 2 ? w[6] : 1;
  const easyBonus = rating === 4 ? w[10] : 1;
  
  return stability * (
    1 +
    hardPenalty *
    Math.exp(w[7]) *
    (11 - difficulty * 10) *
    Math.pow(stability, -w[8]) *
    (Math.exp((1 - retrievability) * w[9]) - 1)
  ) * easyBonus;
}

/**
 * 核心调度函数
 */
export function fsrsSchedule(
  state: FSRSState,
  elapsedDays: number,
  rating: number // 1-4
): FSRSScheduleResult {
  const retrievability = calculateRetrievability(elapsedDays, state.stability);
  const difficulty = adjustDifficulty(state.difficulty, rating);
  const stability = calculateNextStability(
    difficulty,
    state.stability,
    retrievability,
    rating
  );
  
  const targetRetention = FSRS_DEFAULT_PARAMS.requestRetention;
  const interval = Math.min(
    FSRS_DEFAULT_PARAMS.maximumInterval,
    Math.max(1, Math.round(stability * (Math.pow(targetRetention, -2) - 1) / 19))
  );
  
  return {
    difficulty,
    stability,
    retrievability,
    interval,
    nextReviewAt: new Date(Date.now() + interval * 24 * 60 * 60 * 1000),
  };
}

// ============================================================
// Mastery Score 计算模型
// ============================================================

export interface MasteryInput {
  accuracy: number;   // 0-1 答题正确率
  recall: number;     // 0-1 主动回忆
  transfer: number;   // 0-1 迁移应用
  growth: number;     // 0-1 进步速度
}

export interface MasteryResult {
  score: number;      // 0-100
  level: string;      // S/A/B/C/D/F
  breakdown: {
    accuracy: number;
    recall: number;
    transfer: number;
    growth: number;
  };
}

const MASTERY_WEIGHTS = {
  accuracy: 0.30,
  recall: 0.25,
  transfer: 0.25,
  growth: 0.20,
};

const MASTERY_LEVELS: { min: number; label: string }[] = [
  { min: 95, label: "S" },
  { min: 85, label: "A" },
  { min: 75, label: "B" },
  { min: 65, label: "C" },
  { min: 50, label: "D" },
  { min: 0, label: "F" },
];

export function computeMastery(input: MasteryInput): MasteryResult {
  const score = Math.round(
    input.accuracy * MASTERY_WEIGHTS.accuracy * 100 +
    input.recall * MASTERY_WEIGHTS.recall * 100 +
    input.transfer * MASTERY_WEIGHTS.transfer * 100 +
    input.growth * MASTERY_WEIGHTS.growth * 100
  );
  
  const clampedScore = Math.max(0, Math.min(100, score));
  const level = MASTERY_LEVELS.find(l => clampedScore >= l.min)?.label || "F";
  
  return {
    score: clampedScore,
    level,
    breakdown: {
      accuracy: Math.round(input.accuracy * 100),
      recall: Math.round(input.recall * 100),
      transfer: Math.round(input.transfer * 100),
      growth: Math.round(input.growth * 100),
    },
  };
}

/**
 * 从原始数据计算
 */
export function computeMasteryFromRaw(
  correctTotal: number,
  totalQuestions: number,
  recallDaysSince: number,
  recallExpectedDays: number,
  recallHintsUsed: number,
  applicationScore: number,
  novelScenarioScore: number,
  synthesisScore: number,
  historyScores: number[]
): MasteryResult {
  // Accuracy
  const accuracy = totalQuestions > 0 ? correctTotal / totalQuestions : 0;
  
  // Recall: 指数衰减 + 提示惩罚
  const rawRecall = Math.exp(-recallDaysSince / Math.max(1, recallExpectedDays));
  const recallPenalty = recallHintsUsed * 0.2;
  const recall = Math.max(0, rawRecall - recallPenalty);
  
  // Transfer: 加权平均
  const transfer = applicationScore * 0.4 + novelScenarioScore * 0.35 + synthesisScore * 0.25;
  
  // Growth: 线性回归斜率 → sigmoid
  let growth = 0.5;
  if (historyScores.length >= 2) {
    const n = historyScores.length;
    const xMean = (n - 1) / 2;
    const yMean = historyScores.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (i - xMean) * (historyScores[i] - yMean);
      den += (i - xMean) ** 2;
    }
    const slope = den > 0 ? num / den : 0;
    growth = 1 / (1 + Math.exp(-slope * 5));
  }
  
  return computeMastery({ accuracy, recall, transfer, growth });
}
