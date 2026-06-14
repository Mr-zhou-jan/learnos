/**
 * 知识单元类型 — LearnOS VidKB-CET
 * 
 * 四种知识单元类型：
 *   vocab    — 词汇（单词、短语、搭配）
 *   grammar  — 语法（规则、句型）
 *   concept  — 概念（抽象语言知识）
 *   discourse — 语篇（段落理解、衔接、推理）
 * 
 * 带 source_refs 时间戳追溯，难度 1-5，CET 标签，掌握度评分。
 */

// ─── 类型定义 ────────────────────────────────────────────────

/** 知识单元类型 */
export type KnowledgeUnitType = 'vocab' | 'grammar' | 'concept' | 'discourse';

/** CET 等级标签 */
export type CETTag = 'cet4' | 'cet6';

/** 知识单元难度（1-5） */
export type Difficulty = 1 | 2 | 3 | 4 | 5;

/** 视频源引用（带时间戳） */
export interface SourceRef {
  /** 视频 ID */
  video_id: string;
  /** 起始时间（毫秒） */
  start_ms: number;
  /** 结束时间（毫秒） */
  end_ms: number;
}

/** 知识单元基础字段 */
export interface KnowledgeUnitBase {
  /** 唯一标识 */
  id: string;
  /** 知识单元类型 */
  type: KnowledgeUnitType;
  /** 标题/词条 */
  title: string;
  /** 描述/释义 */
  description: string;
  /** 难度 1-5 */
  difficulty: Difficulty;
  /** CET 标签 */
  cet_tags: CETTag[];
  /** 知识点创建时间 ISO */
  created_at: string;
  /** 视频源引用（带时间戳追溯） */
  source_refs: SourceRef[];
}

/** 词汇类知识单元 */
export interface VocabKnowledgeUnit extends KnowledgeUnitBase {
  type: 'vocab';
  /** 单词本身 */
  word: string;
  /** 音标 */
  phonetic?: string;
  /** 词性 */
  part_of_speech?: string;
  /** 中文释义 */
  chinese_meaning: string;
  /** 例句 */
  example_sentences: string[];
  /** 同义词 */
  synonyms?: string[];
  /** 反义词 */
  antonyms?: string[];
  /** CET 考频 0-1 */
  cet_frequency?: number;
}

/** 语法类知识单元 */
export interface GrammarKnowledgeUnit extends KnowledgeUnitBase {
  type: 'grammar';
  /** 语法规则公式 */
  rule_pattern?: string;
  /** 语法类别（时态、从句、虚拟语气等） */
  grammar_category: string;
  /** 例句 */
  example_sentences: string[];
  /** 常见错误 */
  common_mistakes?: string[];
}

/** 概念类知识单元 */
export interface ConceptKnowledgeUnit extends KnowledgeUnitBase {
  type: 'concept';
  /** 概念范畴 */
  category: string;
  /** 关联知识点 ID */
  related_unit_ids?: string[];
  /** 解释性笔记 */
  explanatory_notes?: string;
}

/** 语篇类知识单元 */
export interface DiscourseKnowledgeUnit extends KnowledgeUnitBase {
  type: 'discourse';
  /** 语篇类型（议论文、记叙文、说明文等） */
  discourse_type: string;
  /** 逻辑连接词 */
  discourse_markers?: string[];
  /** 段落结构描述 */
  structure_description?: string;
}

/** 知识单元联合类型 */
export type KnowledgeUnit =
  | VocabKnowledgeUnit
  | GrammarKnowledgeUnit
  | ConceptKnowledgeUnit
  | DiscourseKnowledgeUnit;

/** 掌握度评分 */
export interface MasteryScore {
  /** 掌握度 0-100 */
  mastery_score: number;
  /** 最近答题时间 */
  last_practiced_at?: string;
  /** 总练习次数 */
  total_attempts: number;
  /** 正确次数 */
  correct_attempts: number;
  /** 置信度 0-1（基于样本量） */
  confidence: number;
}

/** 知识单元 + 掌握度的组合 */
export interface KnowledgeUnitWithMastery {
  unit: KnowledgeUnit;
  mastery: MasteryScore;
}

// ─── 计算函数 ────────────────────────────────────────────────

/**
 * 从练习记录计算知识单元的掌握度分数。
 * 
 * 算法：
 *  - 基础分 = 正确率 × 100
 *  - 时间衰减：最近练习越近、权重越高（EWMA 风格）
 *  - 置信度 = min(attempts / 5, 1)
 */
export function computeMasteryScore(
  attempts: { correct: boolean; timestamp: string }[],
  currentTime?: string
): MasteryScore {
  const now = currentTime ? new Date(currentTime).getTime() : Date.now();
  const MIN_ATTEMPTS = 5;

  if (attempts.length === 0) {
    return {
      mastery_score: 0,
      total_attempts: 0,
      correct_attempts: 0,
      confidence: 0,
    };
  }

  // 按时间降序排列（最新的在前）
  const sorted = [...attempts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const totalAttempts = sorted.length;
  const correctAttempts = sorted.filter(a => a.correct).length;

  // EWMA 加权：越近的尝试权重越大
  // 衰减因子 α = 0.3，权重 = α * (1-α)^i
  const alpha = 0.3;
  let weightedSum = 0;
  let weightTotal = 0;

  for (let i = 0; i < sorted.length; i++) {
    const weight = alpha * Math.pow(1 - alpha, i);
    weightedSum += (sorted[i].correct ? 1 : 0) * weight;
    weightTotal += weight;
  }

  // 归一化加权分
  const weightedCorrectRate = weightTotal > 0 ? weightedSum / weightTotal : 0;

  // 时间衰减因子：最近一次练习距离现在
  const lastPracticedTime = new Date(sorted[0].timestamp).getTime();
  const daysSinceLastPractice = (now - lastPracticedTime) / (1000 * 60 * 60 * 24);
  // 超过30天开始衰减，到90天衰减至0.5
  const timeDecay = Math.max(0.5, 1 - Math.max(0, daysSinceLastPractice - 30) / 120);

  // 综合掌握度
  const mastery_score = Math.round(weightedCorrectRate * 100 * timeDecay);

  const confidence = Math.min(totalAttempts / MIN_ATTEMPTS, 1);

  return {
    mastery_score: Math.max(0, Math.min(100, mastery_score)),
    last_practiced_at: sorted[0].timestamp,
    total_attempts: totalAttempts,
    correct_attempts: correctAttempts,
    confidence: Math.round(confidence * 1000) / 1000,
  };
}

/**
 * 批量计算多个知识单元的掌握度。
 * attemptsMap: unitId → 练习记录列表
 */
export function computeAllMasteryScores(
  attemptsMap: Record<string, { correct: boolean; timestamp: string }[]>
): Record<string, MasteryScore> {
  const result: Record<string, MasteryScore> = {};
  for (const [unitId, attempts] of Object.entries(attemptsMap)) {
    result[unitId] = computeMasteryScore(attempts);
  }
  return result;
}

/**
 * 获取知识单元的中文类型名称
 */
export function getUnitTypeLabel(type: KnowledgeUnitType): string {
  const labels: Record<KnowledgeUnitType, string> = {
    vocab: '词汇',
    grammar: '语法',
    concept: '概念',
    discourse: '语篇',
  };
  return labels[type];
}

/**
 * 获取所有知识单元类型列表
 */
export function getAllUnitTypes(): KnowledgeUnitType[] {
  return ['vocab', 'grammar', 'concept', 'discourse'];
}

/**
 * 根据源引用获取视频时间范围字符串（格式化显示）
 */
export function formatSourceTimeRange(ref: SourceRef): string {
  const startSec = (ref.start_ms / 1000).toFixed(1);
  const endSec = (ref.end_ms / 1000).toFixed(1);
  return `${ref.video_id} [${startSec}s - ${endSec}s]`;
}

/**
 * 创建知识单元的工厂函数
 */
export function createKnowledgeUnit(
  type: KnowledgeUnitType,
  base: Omit<KnowledgeUnitBase, 'type' | 'created_at'>,
  extra?: Record<string, any>
): KnowledgeUnit {
  const common: KnowledgeUnitBase = {
    ...base,
    type,
    created_at: new Date().toISOString(),
  };

  switch (type) {
    case 'vocab':
      return {
        ...common,
        type: 'vocab',
        word: extra?.word ?? base.title,
        chinese_meaning: extra?.chinese_meaning ?? '',
        example_sentences: extra?.example_sentences ?? [],
        ...extra,
      } as VocabKnowledgeUnit;

    case 'grammar':
      return {
        ...common,
        type: 'grammar',
        grammar_category: extra?.grammar_category ?? '',
        example_sentences: extra?.example_sentences ?? [],
        ...extra,
      } as GrammarKnowledgeUnit;

    case 'concept':
      return {
        ...common,
        type: 'concept',
        category: extra?.category ?? '',
        ...extra,
      } as ConceptKnowledgeUnit;

    case 'discourse':
      return {
        ...common,
        type: 'discourse',
        discourse_type: extra?.discourse_type ?? '',
        ...extra,
      } as DiscourseKnowledgeUnit;
  }
}

/**
 * 判断知识单元是否包含某个 CET 标签
 */
export function hasCETTag(unit: KnowledgeUnit, tag: CETTag): boolean {
  return unit.cet_tags.includes(tag);
}

/**
 * 按难度过滤知识单元
 */
export function filterByDifficulty(
  units: KnowledgeUnit[],
  minDifficulty: Difficulty,
  maxDifficulty: Difficulty
): KnowledgeUnit[] {
  return units.filter(u => u.difficulty >= minDifficulty && u.difficulty <= maxDifficulty);
}
