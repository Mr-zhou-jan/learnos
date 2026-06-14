/**
 * 8维能力模型 — LearnOS VidKB-CET
 * 
 * 从答题记录计算各维度分数（0-100），包含维度名称、CET关联、权重。
 * 
 * 八个维度：
 *   LEX   — 词汇 (Lexical)
 *   GRAM  — 语法 (Grammatical)
 *   DISC  — 语篇 (Discourse)
 *   LIST  — 听力 (Listening)
 *   TRANS — 翻译 (Translation)
 *   WRITE — 写作 (Writing)
 *   SPEED — 速度 (Response Speed)
 *   META  — 元认知 (Metacognition)
 */

// ─── 类型定义 ────────────────────────────────────────────────

/** 八个能力维度的枚举标识 */
export type AbilityDimension = 'LEX' | 'GRAM' | 'DISC' | 'LIST' | 'TRANS' | 'WRITE' | 'SPEED' | 'META';

/** 维度元数据 */
export interface DimensionMeta {
  key: AbilityDimension;
  label: string;       // 中文名称
  labelEn: string;     // 英文名称
  weight: number;      // 在总分中的权重（8维之和=1）
  cetRelevance: {
    cet4: number;      // 0-1, CET-4 关联度
    cet6: number;      // 0-1, CET-6 关联度
  };
  description: string; // 维度描述
}

/** 所有八个维度的元数据映射表 */
export const DIMENSION_META_MAP: Record<AbilityDimension, DimensionMeta> = {
  LEX: {
    key: 'LEX',
    label: '词汇',
    labelEn: 'Lexical',
    weight: 0.16,
    cetRelevance: { cet4: 0.95, cet6: 0.85 },
    description: '词汇量、词义辨析、搭配、词形变化',
  },
  GRAM: {
    key: 'GRAM',
    label: '语法',
    labelEn: 'Grammatical',
    weight: 0.14,
    cetRelevance: { cet4: 0.90, cet6: 0.90 },
    description: '句型结构、时态、从句、语法规则',
  },
  DISC: {
    key: 'DISC',
    label: '语篇',
    labelEn: 'Discourse',
    weight: 0.12,
    cetRelevance: { cet4: 0.85, cet6: 0.95 },
    description: '段落理解、逻辑衔接、主旨归纳、推理判断',
  },
  LIST: {
    key: 'LIST',
    label: '听力',
    labelEn: 'Listening',
    weight: 0.15,
    cetRelevance: { cet4: 0.90, cet6: 0.90 },
    description: '语音辨识、听力理解、听写、听力速记',
  },
  TRANS: {
    key: 'TRANS',
    label: '翻译',
    labelEn: 'Translation',
    weight: 0.13,
    cetRelevance: { cet4: 0.80, cet6: 0.90 },
    description: '中英互译、语义转换、文化适配',
  },
  WRITE: {
    key: 'WRITE',
    label: '写作',
    labelEn: 'Writing',
    weight: 0.13,
    cetRelevance: { cet4: 0.80, cet6: 0.90 },
    description: '书面表达、结构组织、语言地道性',
  },
  SPEED: {
    key: 'SPEED',
    label: '速度',
    labelEn: 'Speed',
    weight: 0.07,
    cetRelevance: { cet4: 0.50, cet6: 0.60 },
    description: '答题速度、反应时间、信息处理效率',
  },
  META: {
    key: 'META',
    label: '元认知',
    labelEn: 'Metacognition',
    weight: 0.10,
    cetRelevance: { cet4: 0.40, cet6: 0.50 },
    description: '自我评估准确性、策略运用、错误反思',
  },
};

/** 所有维度列表（按定义顺序） */
export const ALL_DIMENSIONS: AbilityDimension[] = ['LEX', 'GRAM', 'DISC', 'LIST', 'TRANS', 'WRITE', 'SPEED', 'META'];

/** 单个维度的分数 */
export interface DimensionScore {
  dimension: AbilityDimension;
  score: number;       // 0-100
  confidence: number;  // 0-1, 样本量不足时降低置信度
  sampleSize: number;  // 该维度相关的答题记录数
}

/** 完整的八维能力画像 */
export interface AbilityProfile {
  dimensions: Record<AbilityDimension, DimensionScore>;
  overallScore: number;      // 加权总分 0-100
  overallConfidence: number; // 总体置信度 0-1
  totalAnswers: number;      // 总答题数
  updatedAt: string;         // ISO 时间戳
}

/** 答题记录输入 */
export interface AnswerRecord {
  /** 题目关联的维度（可多个） */
  dimensions: AbilityDimension[];
  /** 本题得分 0-1 */
  score: number;
  /** 答题耗时（秒） */
  timeSpentSec: number;
  /** 学生自评置信度 0-1（可选，用于META维度） */
  selfEvalConfidence?: number;
  /** 答题时间戳 */
  timestamp: string;
}

// ─── 计算函数 ────────────────────────────────────────────────

/**
 * 从答题记录列表计算完整的八维能力画像。
 *
 * 算法说明：
 *  - 每个维度分数 = 该维度相关题目的加权平均分 × 100
 *  - 速度维度：基于答题时间的反向映射（越快分越高）
 *  - 元认知维度：基于自评与实际得分的偏差
 *  - 置信度 = min(sampleSize / MIN_SAMPLES, 1)，样本越少置信越低
 */
export function computeAbilityProfile(records: AnswerRecord[]): AbilityProfile {
  const MIN_SAMPLES = 5; // 每个维度至少5题才达到满置信度

  // 初始化累加器
  const accumulators: Record<AbilityDimension, {
    totalScore: number;
    count: number;
    metaDeviations: number[];  // |自评 - 实际| 偏差列表
    speedTimes: number[];      // 耗时列表（秒）
  }> = {} as any;

  for (const dim of ALL_DIMENSIONS) {
    accumulators[dim] = { totalScore: 0, count: 0, metaDeviations: [], speedTimes: [] };
  }

  // 遍历所有记录
  for (const record of records) {
    for (const dim of record.dimensions) {
      const acc = accumulators[dim];
      acc.totalScore += record.score;
      acc.count += 1;

      // 收集 META 偏差数据
      if (record.selfEvalConfidence !== undefined) {
        acc.metaDeviations.push(Math.abs(record.selfEvalConfidence - record.score));
      }

      // 收集 SPEED 耗时数据
      if (dim === 'SPEED' || record.dimensions.includes('SPEED')) {
        acc.speedTimes.push(record.timeSpentSec);
      }
    }

    // 全局收集速度数据（每条记录的速度维度用耗时衡量）
    accumulators['SPEED'].speedTimes.push(record.timeSpentSec);

    // 全局收集元认知数据
    if (record.selfEvalConfidence !== undefined) {
      accumulators['META'].metaDeviations.push(
        Math.abs(record.selfEvalConfidence - record.score)
      );
    }
  }

  // 计算各维度分数
  const dimensions = {} as Record<AbilityDimension, DimensionScore>;

  for (const dim of ALL_DIMENSIONS) {
    const acc = accumulators[dim];
    let score: number;
    let confidence: number;

    switch (dim) {
      case 'SPEED': {
        // 速度分数：基于平均答题时间，假设理想时间=30秒，容忍上限=120秒
        if (acc.speedTimes.length === 0) {
          score = 50; // 无数据默认中等
          confidence = 0;
        } else {
          const avgTime = acc.speedTimes.reduce((s, t) => s + t, 0) / acc.speedTimes.length;
          // 映射：30s→100, 60s→70, 90s→40, 120s→10
          score = Math.max(0, Math.min(100, 100 - ((avgTime - 30) / 90) * 100));
          score = Math.round(score * 10) / 10;
          confidence = Math.min(acc.speedTimes.length / MIN_SAMPLES, 1);
        }
        break;
      }

      case 'META': {
        // 元认知分数：基于自评偏差，偏差越小分数越高
        if (acc.metaDeviations.length === 0) {
          score = 50;
          confidence = 0;
        } else {
          const avgDeviation = acc.metaDeviations.reduce((s, d) => s + d, 0) / acc.metaDeviations.length;
          // 映射：偏差0→100, 偏差0.5→50, 偏差1→0
          score = Math.max(0, Math.min(100, 100 - avgDeviation * 100));
          score = Math.round(score * 10) / 10;
          confidence = Math.min(acc.metaDeviations.length / MIN_SAMPLES, 1);
        }
        break;
      }

      default: {
        // 常规维度：平均分 × 100
        if (acc.count === 0) {
          score = 50;
          confidence = 0;
        } else {
          score = Math.round((acc.totalScore / acc.count) * 1000) / 10;
          score = Math.max(0, Math.min(100, score));
          confidence = Math.min(acc.count / MIN_SAMPLES, 1);
        }
        break;
      }
    }

    dimensions[dim] = {
      dimension: dim,
      score,
      confidence,
      sampleSize: dim === 'SPEED' ? acc.speedTimes.length
        : dim === 'META' ? acc.metaDeviations.length
        : acc.count,
    };
  }

  // 加权总分
  let overallScore = 0;
  let totalWeight = 0;
  for (const dim of ALL_DIMENSIONS) {
    const meta = DIMENSION_META_MAP[dim];
    overallScore += dimensions[dim].score * meta.weight;
    totalWeight += meta.weight;
  }
  overallScore = Math.round((overallScore / totalWeight) * 10) / 10;

  // 总体置信度（各维度置信度按权重平均）
  let overallConfidence = 0;
  for (const dim of ALL_DIMENSIONS) {
    overallConfidence += dimensions[dim].confidence * DIMENSION_META_MAP[dim].weight;
  }
  overallConfidence = Math.round(overallConfidence * 1000) / 1000;

  return {
    dimensions,
    overallScore,
    overallConfidence,
    totalAnswers: records.length,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 获取 CET-4 专项分数（加权计算 CET-4 关联度高的维度）
 */
export function getCET4Score(profile: AbilityProfile): number {
  let score = 0;
  let totalRelevance = 0;
  for (const dim of ALL_DIMENSIONS) {
    const relevance = DIMENSION_META_MAP[dim].cetRelevance.cet4;
    score += profile.dimensions[dim].score * relevance;
    totalRelevance += relevance;
  }
  return totalRelevance > 0 ? Math.round((score / totalRelevance) * 10) / 10 : 0;
}

/**
 * 获取 CET-6 专项分数
 */
export function getCET6Score(profile: AbilityProfile): number {
  let score = 0;
  let totalRelevance = 0;
  for (const dim of ALL_DIMENSIONS) {
    const relevance = DIMENSION_META_MAP[dim].cetRelevance.cet6;
    score += profile.dimensions[dim].score * relevance;
    totalRelevance += relevance;
  }
  return totalRelevance > 0 ? Math.round((score / totalRelevance) * 10) / 10 : 0;
}

/**
 * 获取雷达图数据（方便前端绘制能力雷达图）
 */
export interface RadarDataPoint {
  dimension: AbilityDimension;
  label: string;
  score: number;
  fullMark: number; // 满分100
}

export function getRadarData(profile: AbilityProfile): RadarDataPoint[] {
  return ALL_DIMENSIONS.map(dim => ({
    dimension: dim,
    label: DIMENSION_META_MAP[dim].label,
    score: profile.dimensions[dim].score,
    fullMark: 100,
  }));
}

/**
 * 创建空的初始画像（所有维度默认50分，置信度0）
 */
export function createEmptyProfile(): AbilityProfile {
  const dimensions = {} as Record<AbilityDimension, DimensionScore>;
  for (const dim of ALL_DIMENSIONS) {
    dimensions[dim] = {
      dimension: dim,
      score: 50,
      confidence: 0,
      sampleSize: 0,
    };
  }
  return {
    dimensions,
    overallScore: 50,
    overallConfidence: 0,
    totalAnswers: 0,
    updatedAt: new Date().toISOString(),
  };
}
