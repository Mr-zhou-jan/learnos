/**
 * 单元测试 — 8维能力模型 & 知识单元类型
 * 
 * 测试覆盖：
 *   - computeAbilityProfile: 空输入、单题、多题、加权总分
 *   - getCET4Score / getCET6Score
 *   - getRadarData / createEmptyProfile
 *   - computeMasteryScore: 空记录、单条、EWMA加权、时间衰减
 *   - createKnowledgeUnit 工厂函数（四种类型）
 *   - filterByDifficulty / hasCETTag
 *   - formatSourceTimeRange
 */

import {
  computeAbilityProfile,
  getCET4Score,
  getCET6Score,
  getRadarData,
  createEmptyProfile,
  DIMENSION_META_MAP,
  ALL_DIMENSIONS,
  type AnswerRecord,
  type AbilityProfile,
  type DimensionScore,
} from '../ability-model';

import {
  computeMasteryScore,
  computeAllMasteryScores,
  createKnowledgeUnit,
  getUnitTypeLabel,
  getAllUnitTypes,
  formatSourceTimeRange,
  filterByDifficulty,
  hasCETTag,
  type KnowledgeUnit,
  type KnowledgeUnitType,
  type MasteryScore,
  type VocabKnowledgeUnit,
  type GrammarKnowledgeUnit,
  type ConceptKnowledgeUnit,
  type DiscourseKnowledgeUnit,
} from '../knowledge-unit';

// ─── 辅助函数 ────────────────────────────────────────────────

function assertNear(actual: number, expected: number, epsilon = 0.01, msg?: string): void {
  if (Math.abs(actual - expected) > epsilon) {
    throw new Error(msg || `Expected ${expected} (within ${epsilon}), got ${actual}`);
  }
}

function assertEquals<T>(actual: T, expected: T, msg?: string): void {
  if (actual !== expected) {
    throw new Error(msg || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertTrue(cond: boolean, msg?: string): void {
  if (!cond) throw new Error(msg || 'Expected true');
}

// ─── 8维能力模型测试 ─────────────────────────────────────────

function test_createEmptyProfile(): void {
  const profile = createEmptyProfile();
  
  assertEquals(profile.overallScore, 50);
  assertEquals(profile.overallConfidence, 0);
  assertEquals(profile.totalAnswers, 0);
  
  // 所有八维都存在
  for (const dim of ALL_DIMENSIONS) {
    const ds: DimensionScore = profile.dimensions[dim];
    assertEquals(ds.dimension, dim);
    assertEquals(ds.score, 50);
    assertEquals(ds.confidence, 0);
  }
  
  console.log('PASS: test_createEmptyProfile');
}

function test_computeAbilityProfile_empty(): void {
  const profile = computeAbilityProfile([]);
  
  assertEquals(profile.totalAnswers, 0);
  assertEquals(profile.overallScore, 50); // 所有维度默认50分
  assertEquals(profile.overallConfidence, 0);
  
  for (const dim of ALL_DIMENSIONS) {
    assertEquals(profile.dimensions[dim].score, 50);
    assertEquals(profile.dimensions[dim].confidence, 0);
  }
  
  console.log('PASS: test_computeAbilityProfile_empty');
}

function test_computeAbilityProfile_singleRecord(): void {
  const records: AnswerRecord[] = [
    {
      dimensions: ['LEX', 'GRAM'],
      score: 0.8,
      timeSpentSec: 45,
      timestamp: '2025-06-01T10:00:00Z',
    },
  ];

  const profile = computeAbilityProfile(records);
  
  assertEquals(profile.totalAnswers, 1);
  
  // LEX 和 GRAM 应该有分数
  assertNear(profile.dimensions['LEX'].score, 80); // 0.8 * 100 = 80
  assertNear(profile.dimensions['GRAM'].score, 80);
  
  // 未涉及的维度应为默认50
  assertEquals(profile.dimensions['DISC'].score, 50);
  
  // 置信度：只有1题，低于 MIN_SAMPLES=5
  assertEquals(profile.dimensions['LEX'].confidence, 0.2); // 1/5
  assertEquals(profile.dimensions['GRAM'].confidence, 0.2);
  
  console.log('PASS: test_computeAbilityProfile_singleRecord');
}

function test_computeAbilityProfile_multipleRecords(): void {
  const records: AnswerRecord[] = [
    { dimensions: ['LEX'], score: 0.9, timeSpentSec: 20, timestamp: '2025-06-01T10:00:00Z' },
    { dimensions: ['LEX'], score: 0.7, timeSpentSec: 25, timestamp: '2025-06-01T11:00:00Z' },
    { dimensions: ['GRAM'], score: 0.6, timeSpentSec: 40, timestamp: '2025-06-01T12:00:00Z' },
    { dimensions: ['GRAM'], score: 0.8, timeSpentSec: 35, timestamp: '2025-06-01T13:00:00Z' },
    { dimensions: ['LEX', 'GRAM'], score: 1.0, timeSpentSec: 30, timestamp: '2025-06-01T14:00:00Z' },
  ];

  const profile = computeAbilityProfile(records);
  
  assertEquals(profile.totalAnswers, 5);
  
  // LEX: (0.9 + 0.7 + 1.0) / 3 = 0.8667 → 86.7
  assertNear(profile.dimensions['LEX'].score, 86.7, 0.1);
  assertEquals(profile.dimensions['LEX'].sampleSize, 3);
  
  // GRAM: (0.6 + 0.8 + 1.0) / 3 = 0.8 → 80.0
  assertNear(profile.dimensions['GRAM'].score, 80.0, 0.1);
  assertEquals(profile.dimensions['GRAM'].sampleSize, 3);
  
  // 置信度: 3/5 = 0.6
  assertNear(profile.dimensions['LEX'].confidence, 0.6);
  
  console.log('PASS: test_computeAbilityProfile_multipleRecords');
}

function test_computeAbilityProfile_speed(): void {
  // 快速答题
  const fastRecords: AnswerRecord[] = [
    { dimensions: ['LEX'], score: 0.8, timeSpentSec: 15, timestamp: '2025-06-01T10:00:00Z' },
    { dimensions: ['LEX'], score: 0.8, timeSpentSec: 20, timestamp: '2025-06-01T11:00:00Z' },
    { dimensions: ['LEX'], score: 0.8, timeSpentSec: 25, timestamp: '2025-06-01T12:00:00Z' },
    { dimensions: ['LEX'], score: 0.8, timeSpentSec: 30, timestamp: '2025-06-01T13:00:00Z' },
    { dimensions: ['LEX'], score: 0.8, timeSpentSec: 35, timestamp: '2025-06-01T14:00:00Z' },
  ];

  const fastProfile = computeAbilityProfile(fastRecords);
  // 平均耗时 = 25s，映射：100 - ((25-30)/90)*100 ≈ 105.56，clamp至100
  assertTrue(fastProfile.dimensions['SPEED'].score >= 95, 'Fast answers should give high SPEED score');
  
  // 慢速答题
  const slowRecords: AnswerRecord[] = [
    { dimensions: ['LEX'], score: 0.8, timeSpentSec: 90, timestamp: '2025-06-01T10:00:00Z' },
    { dimensions: ['LEX'], score: 0.8, timeSpentSec: 95, timestamp: '2025-06-01T11:00:00Z' },
    { dimensions: ['LEX'], score: 0.8, timeSpentSec: 100, timestamp: '2025-06-01T12:00:00Z' },
    { dimensions: ['LEX'], score: 0.8, timeSpentSec: 105, timestamp: '2025-06-01T13:00:00Z' },
    { dimensions: ['LEX'], score: 0.8, timeSpentSec: 110, timestamp: '2025-06-01T14:00:00Z' },
  ];

  const slowProfile = computeAbilityProfile(slowRecords);
  assertTrue(slowProfile.dimensions['SPEED'].score < 40, 'Slow answers should give low SPEED score');
  
  console.log('PASS: test_computeAbilityProfile_speed');
}

function test_computeAbilityProfile_meta(): void {
  const records: AnswerRecord[] = [
    { dimensions: ['LEX'], score: 0.8, timeSpentSec: 30, selfEvalConfidence: 0.8, timestamp: '2025-06-01T10:00:00Z' },
    { dimensions: ['LEX'], score: 0.6, timeSpentSec: 30, selfEvalConfidence: 0.7, timestamp: '2025-06-01T11:00:00Z' },
    { dimensions: ['LEX'], score: 0.9, timeSpentSec: 30, selfEvalConfidence: 0.85, timestamp: '2025-06-01T12:00:00Z' },
    { dimensions: ['LEX'], score: 0.7, timeSpentSec: 30, selfEvalConfidence: 0.75, timestamp: '2025-06-01T13:00:00Z' },
    { dimensions: ['LEX'], score: 0.5, timeSpentSec: 30, selfEvalConfidence: 0.5, timestamp: '2025-06-01T14:00:00Z' },
  ];

  const profile = computeAbilityProfile(records);
  // 自评偏差很小 → 高分
  assertTrue(profile.dimensions['META'].score >= 85, 'Accurate self-eval should give high META score');
  
  // 故意偏差大的记录
  const badMetaRecords: AnswerRecord[] = [
    { dimensions: ['LEX'], score: 0.2, timeSpentSec: 30, selfEvalConfidence: 0.9, timestamp: '2025-06-01T10:00:00Z' },
    { dimensions: ['LEX'], score: 0.1, timeSpentSec: 30, selfEvalConfidence: 0.9, timestamp: '2025-06-01T11:00:00Z' },
    { dimensions: ['LEX'], score: 0.3, timeSpentSec: 30, selfEvalConfidence: 0.8, timestamp: '2025-06-01T12:00:00Z' },
    { dimensions: ['LEX'], score: 0.1, timeSpentSec: 30, selfEvalConfidence: 0.9, timestamp: '2025-06-01T13:00:00Z' },
    { dimensions: ['LEX'], score: 0.2, timeSpentSec: 30, selfEvalConfidence: 0.9, timestamp: '2025-06-01T14:00:00Z' },
  ];

  const badProfile = computeAbilityProfile(badMetaRecords);
  assertTrue(badProfile.dimensions['META'].score < 50, 'Inaccurate self-eval should give low META score');
  
  console.log('PASS: test_computeAbilityProfile_meta');
}

function test_weightedOverallScore(): void {
  // 验证权重之和为 1
  let totalWeight = 0;
  for (const dim of ALL_DIMENSIONS) {
    totalWeight += DIMENSION_META_MAP[dim].weight;
  }
  assertNear(totalWeight, 1.0, 0.01, 'Weights should sum to 1');
  
  // 所有维度满分 → 总分 100
  const perfectRecords: AnswerRecord[] = [];
  for (let i = 0; i < 10; i++) {
    for (const dim of ALL_DIMENSIONS) {
      perfectRecords.push({
        dimensions: [dim],
        score: 1.0,
        timeSpentSec: 30,
        selfEvalConfidence: 1.0,
        timestamp: `2025-06-01T${String(i).padStart(2, '0')}:00:00Z`,
      });
    }
  }
  
  const perfectProfile = computeAbilityProfile(perfectRecords);
  assertTrue(perfectProfile.overallScore > 90, 'All-perfect records should give high overall score');
  
  console.log('PASS: test_weightedOverallScore');
}

function test_CETScores(): void {
  const profile = createEmptyProfile();
  
  const cet4 = getCET4Score(profile);
  const cet6 = getCET6Score(profile);
  
  // 默认50分 * 加权 → 约50
  assertNear(cet4, 50, 1);
  assertNear(cet6, 50, 1);
  
  console.log('PASS: test_CETScores');
}

function test_radarData(): void {
  const profile = createEmptyProfile();
  const radar = getRadarData(profile);
  
  assertEquals(radar.length, 8);
  
  for (const point of radar) {
    assertEquals(point.fullMark, 100);
    assertEquals(point.score, 50);
    assertTrue(ALL_DIMENSIONS.includes(point.dimension));
    assertTrue(point.label.length > 0);
  }
  
  console.log('PASS: test_radarData');
}

// ─── 知识单元测试 ─────────────────────────────────────────────

function test_computeMasteryScore_empty(): void {
  const score: MasteryScore = computeMasteryScore([]);
  
  assertEquals(score.mastery_score, 0);
  assertEquals(score.total_attempts, 0);
  assertEquals(score.correct_attempts, 0);
  assertEquals(score.confidence, 0);
  
  console.log('PASS: test_computeMasteryScore_empty');
}

function test_computeMasteryScore_allCorrect(): void {
  const attempts = [
    { correct: true, timestamp: '2025-06-05T10:00:00Z' },
    { correct: true, timestamp: '2025-06-04T10:00:00Z' },
    { correct: true, timestamp: '2025-06-03T10:00:00Z' },
    { correct: true, timestamp: '2025-06-02T10:00:00Z' },
    { correct: true, timestamp: '2025-06-01T10:00:00Z' },
  ];

  const score = computeMasteryScore(attempts, '2025-06-06T10:00:00Z');
  
  assertEquals(score.total_attempts, 5);
  assertEquals(score.correct_attempts, 5);
  assertEquals(score.confidence, 1.0); // 5次达到满置信
  assertTrue(score.mastery_score >= 80, 'All correct should score high');
  
  console.log('PASS: test_computeMasteryScore_allCorrect');
}

function test_computeMasteryScore_allWrong(): void {
  const attempts = [
    { correct: false, timestamp: '2025-06-05T10:00:00Z' },
    { correct: false, timestamp: '2025-06-04T10:00:00Z' },
    { correct: false, timestamp: '2025-06-03T10:00:00Z' },
  ];

  const score = computeMasteryScore(attempts, '2025-06-06T10:00:00Z');
  
  assertEquals(score.correct_attempts, 0);
  assertEquals(score.mastery_score, 0);
  
  console.log('PASS: test_computeMasteryScore_allWrong');
}

function test_computeMasteryScore_ewmaWeighting(): void {
  // 最近一次正确 > 最近一次错误 → 加权分偏向正确
  const attemptsRecencyCorrect = [
    { correct: true, timestamp: '2025-06-05T10:00:00Z' },  // 最近：正确
    { correct: false, timestamp: '2025-06-01T10:00:00Z' }, // 较早：错误
  ];

  const scoreCorrectRecent = computeMasteryScore(attemptsRecencyCorrect, '2025-06-06T10:00:00Z');
  
  // 最近错误
  const attemptsRecencyWrong = [
    { correct: false, timestamp: '2025-06-05T10:00:00Z' }, // 最近：错误
    { correct: true, timestamp: '2025-06-01T10:00:00Z' },  // 较早：正确
  ];

  const scoreWrongRecent = computeMasteryScore(attemptsRecencyWrong, '2025-06-06T10:00:00Z');
  
  assertTrue(scoreCorrectRecent.mastery_score > scoreWrongRecent.mastery_score,
    'Recent correct should yield higher score than recent wrong');
  
  console.log('PASS: test_computeMasteryScore_ewmaWeighting');
}

function test_computeMasteryScore_timeDecay(): void {
  // 很久以前的完美记录
  const oldAttempts = [
    { correct: true, timestamp: '2025-01-01T10:00:00Z' },
    { correct: true, timestamp: '2024-12-25T10:00:00Z' },
  ];

  const oldScore = computeMasteryScore(oldAttempts, '2025-07-01T10:00:00Z');
  
  // 最近的完美记录
  const recentAttempts = [
    { correct: true, timestamp: '2025-06-30T10:00:00Z' },
    { correct: true, timestamp: '2025-06-29T10:00:00Z' },
  ];

  const recentScore = computeMasteryScore(recentAttempts, '2025-07-01T10:00:00Z');
  
  assertTrue(recentScore.mastery_score > oldScore.mastery_score,
    'Recent practice should yield higher score than old practice');
  
  console.log('PASS: test_computeMasteryScore_timeDecay');
}

function test_computeAllMasteryScores(): void {
  const attemptsMap = {
    'unit-1': [
      { correct: true, timestamp: '2025-06-05T10:00:00Z' },
      { correct: true, timestamp: '2025-06-04T10:00:00Z' },
    ],
    'unit-2': [
      { correct: false, timestamp: '2025-06-05T10:00:00Z' },
    ],
  };

  const scores = computeAllMasteryScores(attemptsMap);
  
  assertEquals(Object.keys(scores).length, 2);
  assertTrue(scores['unit-1'].mastery_score > scores['unit-2'].mastery_score);
  
  console.log('PASS: test_computeAllMasteryScores');
}

function test_createKnowledgeUnit_vocab(): void {
  const unit = createKnowledgeUnit('vocab', {
    id: 'v1',
    title: 'abandon',
    description: '放弃；抛弃',
    difficulty: 3,
    cet_tags: ['cet4', 'cet6'],
    source_refs: [{ video_id: 'vid-001', start_ms: 12000, end_ms: 18000 }],
  }, {
    word: 'abandon',
    chinese_meaning: '放弃；抛弃',
    example_sentences: ['They had to abandon the plan.'],
    part_of_speech: 'verb',
  });

  assertEquals(unit.type, 'vocab');
  assertEquals(unit.id, 'v1');
  assertEquals(unit.difficulty, 3);
  assertEquals(unit.cet_tags.length, 2);
  assertTrue(unit.cet_tags.includes('cet4'));
  
  const vocab = unit as VocabKnowledgeUnit;
  assertEquals(vocab.word, 'abandon');
  assertEquals(vocab.example_sentences.length, 1);
  
  console.log('PASS: test_createKnowledgeUnit_vocab');
}

function test_createKnowledgeUnit_grammar(): void {
  const unit = createKnowledgeUnit('grammar', {
    id: 'g1',
    title: '虚拟语气',
    description: '表示与事实相反的假设',
    difficulty: 4,
    cet_tags: ['cet4', 'cet6'],
    source_refs: [{ video_id: 'vid-002', start_ms: 5000, end_ms: 15000 }],
  }, {
    grammar_category: '语气',
    rule_pattern: 'If + 主语 + 过去完成时, 主语 + would have + 过去分词',
    example_sentences: ['If I had known, I would have come.'],
  });

  assertEquals(unit.type, 'grammar');
  
  const grammar = unit as GrammarKnowledgeUnit;
  assertEquals(grammar.grammar_category, '语气');
  assertTrue(grammar.rule_pattern!.length > 0);
  
  console.log('PASS: test_createKnowledgeUnit_grammar');
}

function test_createKnowledgeUnit_concept(): void {
  const unit = createKnowledgeUnit('concept', {
    id: 'c1',
    title: '英语思维',
    description: '中英思维方式差异',
    difficulty: 5,
    cet_tags: ['cet6'],
    source_refs: [{ video_id: 'vid-003', start_ms: 0, end_ms: 30000 }],
  }, {
    category: '跨文化',
    related_unit_ids: ['v1', 'g1'],
  });

  assertEquals(unit.type, 'concept');
  
  const concept = unit as ConceptKnowledgeUnit;
  assertEquals(concept.category, '跨文化');
  assertEquals(concept.related_unit_ids!.length, 2);
  
  console.log('PASS: test_createKnowledgeUnit_concept');
}

function test_createKnowledgeUnit_discourse(): void {
  const unit = createKnowledgeUnit('discourse', {
    id: 'd1',
    title: '议论文结构',
    description: '议论文的论点-论据-结论结构',
    difficulty: 3,
    cet_tags: ['cet4', 'cet6'],
    source_refs: [{ video_id: 'vid-004', start_ms: 10000, end_ms: 25000 }],
  }, {
    discourse_type: '议论文',
    discourse_markers: ['firstly', 'however', 'therefore'],
  });

  assertEquals(unit.type, 'discourse');
  
  const discourse = unit as DiscourseKnowledgeUnit;
  assertEquals(discourse.discourse_type, '议论文');
  assertTrue(discourse.discourse_markers!.length > 0);
  
  console.log('PASS: test_createKnowledgeUnit_discourse');
}

function test_getUnitTypeLabel(): void {
  assertEquals(getUnitTypeLabel('vocab'), '词汇');
  assertEquals(getUnitTypeLabel('grammar'), '语法');
  assertEquals(getUnitTypeLabel('concept'), '概念');
  assertEquals(getUnitTypeLabel('discourse'), '语篇');
  
  console.log('PASS: test_getUnitTypeLabel');
}

function test_getAllUnitTypes(): void {
  const types = getAllUnitTypes();
  assertEquals(types.length, 4);
  assertTrue(types.includes('vocab'));
  assertTrue(types.includes('grammar'));
  assertTrue(types.includes('concept'));
  assertTrue(types.includes('discourse'));
  
  console.log('PASS: test_getAllUnitTypes');
}

function test_formatSourceTimeRange(): void {
  const ref = { video_id: 'vid-001', start_ms: 12345, end_ms: 23456 };
  const formatted = formatSourceTimeRange(ref);
  
  assertEquals(formatted, 'vid-001 [12.3s - 23.5s]');
  
  console.log('PASS: test_formatSourceTimeRange');
}

function test_filterByDifficulty(): void {
  const units: KnowledgeUnit[] = [
    createKnowledgeUnit('vocab', {
      id: 'v1', title: 'easy', description: '', difficulty: 1, cet_tags: ['cet4'], source_refs: [],
    }),
    createKnowledgeUnit('vocab', {
      id: 'v2', title: 'medium', description: '', difficulty: 3, cet_tags: ['cet4'], source_refs: [],
    }),
    createKnowledgeUnit('vocab', {
      id: 'v3', title: 'hard', description: '', difficulty: 5, cet_tags: ['cet6'], source_refs: [],
    }),
  ];

  const easyMedium = filterByDifficulty(units, 1, 3);
  assertEquals(easyMedium.length, 2);
  
  const hardOnly = filterByDifficulty(units, 4, 5);
  assertEquals(hardOnly.length, 1);
  assertEquals(hardOnly[0].id, 'v3');
  
  console.log('PASS: test_filterByDifficulty');
}

function test_hasCETTag(): void {
  const unit = createKnowledgeUnit('vocab', {
    id: 'v1', title: 'test', description: '', difficulty: 1,
    cet_tags: ['cet4'], source_refs: [],
  });
  
  assertTrue(hasCETTag(unit, 'cet4'));
  assertTrue(!hasCETTag(unit, 'cet6'));
  
  console.log('PASS: test_hasCETTag');
}

function test_sourceRefsIntegrity(): void {
  // 验证 source_refs 时间戳追溯完整性
  const unit = createKnowledgeUnit('grammar', {
    id: 'g-test',
    title: 'Source Test',
    description: 'Testing source refs',
    difficulty: 2,
    cet_tags: ['cet4'],
    source_refs: [
      { video_id: 'vid-a', start_ms: 1000, end_ms: 5000 },
      { video_id: 'vid-b', start_ms: 20000, end_ms: 35000 },
    ],
  });
  
  assertEquals(unit.source_refs.length, 2);
  assertEquals(unit.source_refs[0].video_id, 'vid-a');
  assertTrue(unit.source_refs[0].start_ms < unit.source_refs[0].end_ms);
  assertTrue(unit.source_refs[1].end_ms > unit.source_refs[1].start_ms);
  
  console.log('PASS: test_sourceRefsIntegrity');
}

// ─── 运行所有测试 ────────────────────────────────────────────

function runAllTests(): void {
  console.log('\n===== 8维能力模型测试 =====\n');
  test_createEmptyProfile();
  test_computeAbilityProfile_empty();
  test_computeAbilityProfile_singleRecord();
  test_computeAbilityProfile_multipleRecords();
  test_computeAbilityProfile_speed();
  test_computeAbilityProfile_meta();
  test_weightedOverallScore();
  test_CETScores();
  test_radarData();

  console.log('\n===== 知识单元类型测试 =====\n');
  test_computeMasteryScore_empty();
  test_computeMasteryScore_allCorrect();
  test_computeMasteryScore_allWrong();
  test_computeMasteryScore_ewmaWeighting();
  test_computeMasteryScore_timeDecay();
  test_computeAllMasteryScores();
  test_createKnowledgeUnit_vocab();
  test_createKnowledgeUnit_grammar();
  test_createKnowledgeUnit_concept();
  test_createKnowledgeUnit_discourse();
  test_getUnitTypeLabel();
  test_getAllUnitTypes();
  test_formatSourceTimeRange();
  test_filterByDifficulty();
  test_hasCETTag();
  test_sourceRefsIntegrity();

  console.log('\n===== 全部测试通过! =====\n');
}

runAllTests();
