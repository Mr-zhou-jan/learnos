// ========== 用户 ==========
export interface UserProfile {
  id: string; email: string; name: string | null;
  avatar: string | null; xp: number; level: number; streak: number;
}

// ========== 课程 ==========
export interface CourseInfo {
  id: string; name: string; description: string | null;
  icon: string | null; color: string | null;
}

// ========== 知识树节点 ==========
export interface KnowledgeTreeNode {
  id: string; courseId: string; parentId: string | null;
  title: string; description: string | null; orderIndex: number;
  children?: KnowledgeTreeNode[];
  masteryScore?: MasteryInfo | null;
}

// ========== 掌握度 ==========
export interface MasteryInfo {
  id: string; userId: string; knowledgeNodeId: string;
  score: number; accuracy: number | null;
  paraphraseScore: number | null; questionScore: number | null;
  exerciseScore: number | null; reviewScore: number | null;
  errorRate: number | null; updatedAt: string;
}

export type MasteryLevel = "low" | "medium" | "high";
export function getMasteryLevel(score: number): MasteryLevel {
  if (score >= 80) return "high";
  if (score >= 50) return "medium";
  return "low";
}

// ========== 学习记录 ==========
export interface LearningRecord {
  id: string; userId: string; knowledgeNodeId: string;
  duration: number; result: string | null;
  recordType: "study" | "feynman" | "exam" | "review"; createdAt: string;
}

// ========== 复习任务 ==========
export interface ReviewTask {
  id: string; userId: string; knowledgeNodeId: string;
  nextReviewTime: string; reviewCount: number;
  status: "pending" | "completed" | "skipped";
  ease: number | null; interval: number;
  knowledgeNode?: KnowledgeTreeNode;
}

// ========== 费曼训练 ==========
export interface FeynmanScoreResult {
  score: number; accuracy: number; completeness: number;
  logic: number; clarity: number;
  feedback: string; missingPoints: string[];
}

// ========== AI对话 ==========
export interface ChatMessage {
  role: "system" | "user" | "assistant"; content: string;
}

export interface ChatOptions {
  model?: string; temperature?: number;
  maxTokens?: number; socraticMode?: boolean;
}

// ========== 学习驾驶舱 ==========
export interface CockpitData {
  userId: string; totalXp: number; level: number; streak: number;
  weeklyStudyTime: number; masteredCount: number; totalNodes: number;
  weakNodes: WeakNode[]; errorDistribution: ErrorCategory[];
  recommendedNext: RecommendedStep[];
  masteryTrend: { date: string; avgScore: number }[];
  weeklyHeatmap: { day: string; minutes: number }[];
}

export interface WeakNode {
  nodeId: string; title: string; courseName: string;
  score: number; errorRate: number;
}

export interface ErrorCategory {
  category: string; count: number; color: string;
}

export interface RecommendedStep {
  nodeId: string; title: string; courseName: string;
  priority: "high" | "medium" | "low"; reason: string; score: number;
}

// ========== 游戏化 ==========
export const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0, 5: 500, 10: 2000, 20: 10000,
};
