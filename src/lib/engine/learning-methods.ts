/**
 * LearnOS 3.0 — 学科学习方法适配引擎
 * 
 * 不同学科 = 不同的最佳学习方式：
 * 
 * 语言类 (英语):     题海+图片+语境 → 不适合费曼
 * 编程类 (C++/Python): 项目实战+Debug → Learn by Building
 * 理论类 (物理/力学):  费曼复述+公式推导+图解分析
 * 财经类 (金融/经济):  案例讨论+费曼复述+场景分析  
 * 数学类 (高数/线代):  概念树+渐进变式+证明训练
 */

export type SubjectCategory = "language" | "programming" | "theory" | "finance" | "math" | "general";

export interface LearningMethod {
  id: string;
  name: string;
  description: string;
  icon: string;         // Lucide icon name
  suitableFor: SubjectCategory[];
  steps: MethodStep[];
}

export interface MethodStep {
  type: "explain" | "quiz" | "image" | "code" | "feynman" | "derive" | "case" | "practice" | "review";
  title: string;
  description: string;
  durationMin: number;
}

// ============================================================
// 学习方法库
// ============================================================
export const LEARNING_METHODS: LearningMethod[] = [
  // ---- 语言类方法 ----
  {
    id: "vocab-drill",
    name: "词汇闪卡+语境训练",
    description: "图片联想记忆 + 例句填空 + 听力辨音，三重刺激加深记忆",
    icon: "Image",
    suitableFor: ["language"],
    steps: [
      { type: "image", title: "图片联想", description: "展示单词对应的图片/场景，建立直观联系", durationMin: 3 },
      { type: "quiz", title: "语境填空", description: "在真实句子中填入单词，理解用法", durationMin: 5 },
      { type: "review", title: "间隔复习", description: "FSRS算法自动安排复习时间", durationMin: 2 },
    ],
  },
  {
    id: "grammar-drill",
    name: "语法实战训练",
    description: "规则→例题→改错→造句，从理解到输出",
    icon: "FileText",
    suitableFor: ["language"],
    steps: [
      { type: "explain", title: "规则讲解", description: "用公式化方式讲语法（如：If + 过去式, would + 动词原形）", durationMin: 3 },
      { type: "quiz", title: "选择题+改错", description: "5道选择+3道改错，即时反馈", durationMin: 8 },
      { type: "practice", title: "造句输出", description: "用该语法写3个原创句子", durationMin: 5 },
    ],
  },
  {
    id: "reading-visual",
    name: "图文阅读理解",
    description: "文章配图+长难句拆解+关键词提取，视觉化理解",
    icon: "BookOpen",
    suitableFor: ["language"],
    steps: [
      { type: "explain", title: "预览配图", description: "先看图片猜内容，激活背景知识", durationMin: 2 },
      { type: "quiz", title: "阅读理解", description: "3道题测试理解+长难句语法拆解", durationMin: 10 },
      { type: "practice", title: "关键词复述", description: "不看文章，用5个关键词复述内容", durationMin: 3 },
    ],
  },

  // ---- 编程类方法 ----
  {
    id: "code-build",
    name: "项目驱动学习",
    description: "知识点→最小可运行代码→小项目→代码审查，学完就能用",
    icon: "Code",
    suitableFor: ["programming"],
    steps: [
      { type: "explain", title: "概念+最小示例", description: "10行以内代码展示核心概念", durationMin: 3 },
      { type: "code", title: "动手编码", description: "完成一个微型项目（如：用类实现学生管理系统）", durationMin: 20 },
      { type: "review", title: "AI代码审查", description: "AI检查代码质量、命名、边界条件", durationMin: 3 },
    ],
  },
  {
    id: "debug-challenge",
    name: "Debug挑战",
    description: "AI给有Bug的代码，你来找出并修复——逆向训练",
    icon: "Bug",
    suitableFor: ["programming"],
    steps: [
      { type: "code", title: "找Bug", description: "分析代码，定位错误（语法/逻辑/内存）", durationMin: 8 },
      { type: "explain", title: "解释根因", description: "用文字解释Bug产生的原因", durationMin: 3 },
      { type: "practice", title: "写出修复", description: "提交正确的代码", durationMin: 5 },
    ],
  },

  // ---- 理论类方法 ----
  {
    id: "feynman-plus",
    name: "费曼+图解推导",
    description: "复述概念→AI找漏洞→画图解释→公式推导，深度理解",
    icon: "PenLine",
    suitableFor: ["theory", "math"],
    steps: [
      { type: "explain", title: "AI讲解", description: "300字精讲+关键公式+一个生活例子", durationMin: 5 },
      { type: "feynman", title: "费曼复述", description: "用自己的话解释+画示意图", durationMin: 5 },
      { type: "derive", title: "公式推导", description: "从基础公式一步步推导到目标公式", durationMin: 8 },
      { type: "quiz", title: "变式练习", description: "原题→简单变式→中等变式→复杂变式", durationMin: 10 },
    ],
  },
  {
    id: "diagram-analysis",
    name: "图解分析训练",
    description: "适用于受力分析、电路分析等需要读图的学科",
    icon: "Layout",
    suitableFor: ["theory"],
    steps: [
      { type: "image", title: "读图训练", description: "AI生成结构图/电路图，标注关键信息", durationMin: 3 },
      { type: "quiz", title: "分析作答", description: "基于图纸回答问题（如标受力方向）", durationMin: 8 },
      { type: "review", title: "AI核对", description: "AI比对标准答案，标注遗漏点", durationMin: 2 },
    ],
  },

  // ---- 财经类方法 ----
  {
    id: "case-feynman",
    name: "案例+费曼讨论",
    description: "真实案例→复述分析→AI追问→形成观点，培养商业思维",
    icon: "Briefcase",
    suitableFor: ["finance"],
    steps: [
      { type: "case", title: "案例阅读", description: "阅读真实商业案例（如雷曼兄弟破产）", durationMin: 5 },
      { type: "feynman", title: "费曼复述", description: "用自己的话解释案例中的关键决策和逻辑", durationMin: 5 },
      { type: "quiz", title: "AI追问", description: "AI连续追问：为什么？如果换成你会怎么做？", durationMin: 5 },
      { type: "practice", title: "形成观点", description: "写出自己的分析和建议", durationMin: 5 },
    ],
  },
  {
    id: "scenario-sim",
    name: "场景模拟决策",
    description: "AI构建投资场景，你做决策并解释理由",
    icon: "TrendingUp",
    suitableFor: ["finance"],
    steps: [
      { type: "case", title: "场景设定", description: "AI描述一个投资/经济场景", durationMin: 2 },
      { type: "quiz", title: "做出决策", description: "选择你的策略并解释理由", durationMin: 5 },
      { type: "review", title: "结果分析", description: "AI揭示可能的结果并分析你的决策", durationMin: 5 },
    ],
  },

  // ---- 通用方法 ----
  {
    id: "active-recall",
    name: "主动回忆",
    description: "学完后立即不看笔记复述——最有效的学习方法之一",
    icon: "Brain",
    suitableFor: ["language", "programming", "theory", "finance", "math", "general"],
    steps: [
      { type: "explain", title: "学习内容", description: "阅读并理解知识点", durationMin: 5 },
      { type: "practice", title: "闭卷回忆", description: "不看任何资料，写下你记住的一切", durationMin: 3 },
      { type: "review", title: "对照检查", description: "对比原文，标注遗漏和错误", durationMin: 2 },
    ],
  },
  {
    id: "compress",
    name: "知识压缩",
    description: "1000字→300字→100字→一句话，提炼核心",
    icon: "Minimize2",
    suitableFor: ["theory", "finance", "math", "general"],
    steps: [
      { type: "explain", title: "完整阅读", description: "阅读完整的知识点讲解", durationMin: 5 },
      { type: "practice", title: "压缩到300字", description: "用300字概括核心内容", durationMin: 5 },
      { type: "practice", title: "压缩到一句话", description: "用一句话（不超过30字）总结", durationMin: 3 },
    ],
  },
];

// ============================================================
// 学科分类映射
// ============================================================
export function classifySubject(name: string): SubjectCategory {
  const lower = name.toLowerCase();
  if (/英语|英文|cet|四级|六级|雅思|托福|日语|韩语|外语/.test(lower)) return "language";
  if (/c\+\+|python|java|编程|代码|前端|后端|算法|数据结构|rust|go|js|typescript/.test(lower)) return "programming";
  if (/高数|数学|线性代数|概率|微积分|离散/.test(lower)) return "math";
  if (/物理|力学|电磁|光学|热学|化学|生物/.test(lower)) return "theory";
  if (/互换性|公差|测量|标准|规范/.test(lower)) return "general";
  if (/金融|投资|财经|经济|股票|基金|理财|会计|财务/.test(lower)) return "finance";
  return "general";
}

/** 计算型学科出计算题而非概念题 */
export function isCalcSubject(name: string): boolean {
  const c = classifySubject(name);
  return c === "math" || c === "theory";
}

/** 生成计算型Prompt：题目必须是计算题，不要概念解释 */
export function getCalcPrompt(node: { title: string; description: string }, difficulty: string): string {
  const d = difficulty === "easy" ? "基础" : difficulty === "medium" ? "中等" : "困难";
  return `出1道${d}计算题。必须是计算/应用题（不要出"什么是X"这类概念解释题）。4选项含典型错误答案。解析用中文写详细计算步骤。JSON:{"question":"[题目]","options":["A.","B.","C.","D."],"correctIndex":0,"difficulty":"${difficulty}","explanation":"[详细步骤]"}`;
}

/**
 * 为学科推荐最佳学习方法
 */
export function recommendMethods(category: SubjectCategory, count: number = 3): LearningMethod[] {
  const suitable = LEARNING_METHODS.filter(m => m.suitableFor.includes(category));
  
  // Sort: put category-specific methods first
  const specific = suitable.filter(m => m.suitableFor.length <= 3);
  const general = suitable.filter(m => m.suitableFor.length > 3);
  
  return [...specific, ...general].slice(0, count);
}

/**
 * 获取学科推荐描述
 */
export function getSubjectApproach(category: SubjectCategory): string {
  const approaches: Record<SubjectCategory, string> = {
    language: "🎯 语言学习重在「输入+输出」循环。我们采用图片联想+语境填空+听力训练的方式，而非死记硬背。你会看到配图、做改错题、在真实语境中使用词汇。",
    programming: "💻 编程学习的关键是「动手写」。每个知识点配一个微型项目，Bug驱动学习——AI给你有问题的代码，你来找错修复。学完就能用。",
    theory: "📐 理论学科需要「理解+推导」。费曼复述确保你真正理解概念，渐进式变式训练让你从简单题做到复杂题，公式推导帮你建立知识网络。",
    finance: "💼 财经学习重在「案例分析+观点形成」。真实商业案例+费曼复述+AI追问，培养你的商业判断力。场景模拟让你在安全环境中练习决策。",
    math: "📊 数学学习需要「概念树+阶梯练习」。从基础概念开始，AI自动生成4级难度变式，让你循序渐进。证明训练帮你建立严密的逻辑思维。",
    general: "📚 综合采用主动回忆+知识压缩+间隔复习的科学学习方法。",
  };
  return approaches[category];
}
