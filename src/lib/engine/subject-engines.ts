/**
 * LearnOS 3.0 — Subject Engine Layer
 * 
 * 学科适配层：每个学科有专属的学习引擎
 * 英语: 词汇/语法/阅读/听力/写作/口语
 * 数学: 概念树/解题教练/变式生成器
 * 物理: 公式网络/推导训练
 * 编程: Learn by Building 项目驱动
 */

export type SubjectType = "english" | "math" | "cpp" | "physics" | "mechanics" | "general";

export interface SubjectEngine {
  type: SubjectType;
  name: string;
  
  // 知识点学习策略
  getLearningStrategy(nodeType: string): LearningStrategy;
  
  // 练习生成
  generatePractice(knowledgeNodeId: string, difficulty: number): Promise<PracticeTask>;
  
  // 评分
  evaluateResponse(task: PracticeTask, userResponse: any): Promise<EvaluationResult>;
}

export interface LearningStrategy {
  steps: LearningStep[];
  estimatedMinutes: number;
}

export interface LearningStep {
  type: "explain" | "example" | "practice" | "recall" | "apply" | "review";
  title: string;
  description: string;
  durationMin: number;
}

export interface PracticeTask {
  id: string;
  type: string;  // quiz/fill/code/write/speak/derive
  content: any;  // Subject-specific content
  difficulty: number;
}

export interface EvaluationResult {
  score: number;
  feedback: string;
  weaknesses: string[];
  nextAction: string;
}

// ============================================================
// English Engine
// ============================================================
export class EnglishEngine implements SubjectEngine {
  type: SubjectType = "english";
  name = "英语学习引擎";

  getLearningStrategy(nodeType: string): LearningStrategy {
    const strategies: Record<string, LearningStrategy> = {
      vocabulary: {
        steps: [
          { type: "explain", title: "词义讲解", description: "展示单词释义、音标、词根词缀", durationMin: 3 },
          { type: "example", title: "例句理解", description: "在3个真实语境例句中理解用法", durationMin: 5 },
          { type: "recall", title: "主动回忆", description: "不看屏幕，默写单词和释义", durationMin: 3 },
          { type: "apply", title: "造句输出", description: "用该词造2个原创句子", durationMin: 5 },
          { type: "review", title: "间隔复习", description: "1/3/7/15天后自动复习", durationMin: 2 },
        ],
        estimatedMinutes: 18,
      },
      grammar: {
        steps: [
          { type: "explain", title: "语法规则", description: "简洁讲解语法规则+公式", durationMin: 5 },
          { type: "practice", title: "练习巩固", description: "5道选择题+2道改错题", durationMin: 10 },
          { type: "apply", title: "写作应用", description: "用该语法写3个句子", durationMin: 5 },
        ],
        estimatedMinutes: 20,
      },
      reading: {
        steps: [
          { type: "explain", title: "预览文章", description: "快速浏览标题、段落首句", durationMin: 2 },
          { type: "practice", title: "阅读理解", description: "完成3道理解题+长难句拆解", durationMin: 10 },
          { type: "recall", title: "关键词回忆", description: "不看文章回忆关键信息", durationMin: 3 },
        ],
        estimatedMinutes: 15,
      },
      default: {
        steps: [
          { type: "explain", title: "学习内容", description: "阅读并理解知识点", durationMin: 5 },
          { type: "practice", title: "练习", description: "完成相关练习", durationMin: 10 },
        ],
        estimatedMinutes: 15,
      },
    };
    return strategies[nodeType] || strategies.default;
  }

  async generatePractice(nodeId: string, difficulty: number): Promise<PracticeTask> {
    return {
      id: `eng-${Date.now()}`,
      type: "quiz",
      content: { nodeId, difficulty, questionType: "multiple_choice" },
      difficulty,
    };
  }

  async evaluateResponse(task: PracticeTask, response: any): Promise<EvaluationResult> {
    return {
      score: response.correct ? 100 : 0,
      feedback: response.correct ? "正确！" : "需要加强练习",
      weaknesses: response.correct ? [] : ["需要更多语境练习"],
      nextAction: response.correct ? "继续下一个知识点" : "重新学习并再试一次",
    };
  }
}

// ============================================================
// Math Engine
// ============================================================
export class MathEngine implements SubjectEngine {
  type: SubjectType = "math";
  name = "数学学习引擎";

  getLearningStrategy(nodeType: string): LearningStrategy {
    return {
      steps: [
        { type: "explain", title: "概念理解", description: "用直观方式解释概念+公式推导", durationMin: 5 },
        { type: "example", title: "例题演示", description: "AI分步演示解题过程", durationMin: 5 },
        { type: "practice", title: "渐进练习", description: "原题→简单变式→中等变式→复杂变式", durationMin: 15 },
        { type: "recall", title: "主动推导", description: "不看公式，独立推导一遍", durationMin: 5 },
      ],
      estimatedMinutes: 30,
    };
  }

  async generatePractice(nodeId: string, difficulty: number): Promise<PracticeTask> {
    return {
      id: `math-${Date.now()}`,
      type: "derive",
      content: { nodeId, difficulty, variants: ["原题", "简单变式", "中等变式", "复杂变式"] },
      difficulty,
    };
  }

  async evaluateResponse(task: PracticeTask, response: any): Promise<EvaluationResult> {
    return {
      score: 70,
      feedback: "思路正确，注意步骤完整性",
      weaknesses: ["符号书写"],
      nextAction: "尝试困难变式",
    };
  }
}

// ============================================================
// C++ Engine
// ============================================================
export class CppEngine implements SubjectEngine {
  type: SubjectType = "cpp";
  name = "C++学习引擎";

  getLearningStrategy(nodeType: string): LearningStrategy {
    return {
      steps: [
        { type: "explain", title: "概念+代码", description: "概念讲解+最小可运行代码示例", durationMin: 5 },
        { type: "example", title: "项目场景", description: "展示该知识在实际项目中的应用", durationMin: 3 },
        { type: "practice", title: "动手编码", description: "完成一个小项目/功能模块", durationMin: 20 },
        { type: "review", title: "代码审查", description: "AI审查代码质量并给出建议", durationMin: 5 },
      ],
      estimatedMinutes: 33,
    };
  }

  async generatePractice(nodeId: string, difficulty: number): Promise<PracticeTask> {
    return {
      id: `cpp-${Date.now()}`,
      type: "code",
      content: { nodeId, difficulty, projectIdea: "学生管理系统" },
      difficulty,
    };
  }

  async evaluateResponse(task: PracticeTask, response: any): Promise<EvaluationResult> {
    return {
      score: 80,
      feedback: "代码功能正确，建议优化命名和添加注释",
      weaknesses: ["变量命名", "缺少边界检查"],
      nextAction: "重构代码并添加单元测试",
    };
  }
}

// ============================================================
// Engine Registry
// ============================================================
const engineRegistry: Map<SubjectType, SubjectEngine> = new Map();

export function registerEngine(engine: SubjectEngine) {
  engineRegistry.set(engine.type, engine);
}

export function getEngine(type: SubjectType): SubjectEngine | undefined {
  return engineRegistry.get(type);
}

// Register default engines
registerEngine(new EnglishEngine());
registerEngine(new MathEngine());
registerEngine(new CppEngine());

// Physics engine placeholder
registerEngine({
  type: "physics",
  name: "物理引擎",
  getLearningStrategy: () => ({
    steps: [
      { type: "explain", title: "公式理解", description: "理解物理公式的推导和物理意义", durationMin: 5 },
      { type: "practice", title: "定量计算", description: "代入数值进行实际计算", durationMin: 10 },
      { type: "recall", title: "推导训练", description: "独立推导公式", durationMin: 5 },
    ],
    estimatedMinutes: 20,
  }),
  generatePractice: async () => ({ id: "phy", type: "derive", content: {}, difficulty: 0.5 }),
  evaluateResponse: async () => ({ score: 75, feedback: "", weaknesses: [], nextAction: "" }),
});

// Mechanics engine placeholder
registerEngine({
  type: "mechanics",
  name: "工程力学引擎",
  getLearningStrategy: () => ({
    steps: [
      { type: "explain", title: "受力分析", description: "学习受力分析方法和步骤", durationMin: 5 },
      { type: "practice", title: "画图训练", description: "AI生成结构图，标注受力", durationMin: 15 },
    ],
    estimatedMinutes: 20,
  }),
  generatePractice: async () => ({ id: "mec", type: "diagram", content: {}, difficulty: 0.5 }),
  evaluateResponse: async () => ({ score: 70, feedback: "", weaknesses: [], nextAction: "" }),
});
