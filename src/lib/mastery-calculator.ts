/** 掌握度 = 正确率×40% + 复述×25% + 提问×15% + 练习×10% + 复习×10% */

interface MasteryInput {
  accuracy: number; paraphraseScore: number; questionScore: number;
  exerciseScore: number; reviewScore: number;
}

const W = { accuracy: 0.40, paraphrase: 0.25, question: 0.15, exercise: 0.10, review: 0.10 };

export function calculateMasteryScore(input: MasteryInput): number {
  const score = input.accuracy * W.accuracy + input.paraphraseScore * W.paraphrase
    + input.questionScore * W.question + input.exerciseScore * W.exercise + input.reviewScore * W.review;
  return Math.round(Math.min(100, Math.max(0, score)));
}

export function calculateErrorRate(total: number, correct: number): number {
  return total === 0 ? 0 : Math.round(((total - correct) / total) * 100);
}

export function needsUrgentReview(score: number, lastReview: Date): boolean {
  const daysSince = (Date.now() - lastReview.getTime()) / (1000 * 60 * 60 * 24);
  return score < 40 || (score < 60 && daysSince > 7);
}
