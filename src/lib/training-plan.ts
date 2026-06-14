import { getScoreTarget, type ScoreTargetData, getTrainingRecords } from "@/lib/use-training-memory";

export interface DailyTarget {
  module: string; label: string; icon: string; route: string;
  dailyCount: number; unit: string;
  priority: "high" | "medium" | "low";
  reason: string; color: string;
}

export interface TrainingPlan {
  level: string; targetScore: number; estimatedCurrentScore: number | null;
  hasTrainingData: boolean; hasEnoughData: boolean;
  scoreGap: number; dailyTargets: DailyTarget[]; totalDailyMinutes: number;
  weakModules: string[]; strongModules: string[]; summary: string;
  moduleRecentPct: Record<string, number>;
  recentDays: number;
}

/** 计算含时间衰减的模块加权正确率（最近7天权重更高） */
function weightedRecentPct(module: string): { pct: number; total: number; recentDays: number } {
  const records = getTrainingRecords(module);
  if (records.length === 0) return { pct: 0, total: 0, recentDays: 0 };

  const now = Date.now();
  const DAY = 86400000;
  let weightedCorrect = 0;
  let weightedTotal = 0;
  const trainedDays = new Set<string>();

  for (const r of records) {
    const ageDays = (now - new Date(r.date).getTime()) / DAY;
    const weight = Math.exp(-ageDays / 7); // 7天半衰期
    weightedCorrect += (r.isCorrect ? 1 : 0) * weight;
    weightedTotal += weight;
    trainedDays.add(r.date.slice(0, 10));
  }

  return {
    pct: weightedTotal > 0 ? weightedCorrect / weightedTotal : 0,
    total: records.length,
    recentDays: trainedDays.size,
  };
}

export function computeTrainingPlan(): TrainingPlan | null {
  const st = getScoreTarget();
  if (!st) return null;

  const { level, targetScore, selfAssessment } = st;
  const { listening, reading, writingTranslation } = selfAssessment;

  const assessToPct = (v: number) => [0, 0.25, 0.45, 0.65, 0.80, 0.92][v] || 0.5;
  const moduleMaxScores = { listening: 248, reading: 248, writingTranslation: 213 };

  // 获取含时间衰减的加权正确率
  const listeningWP = weightedRecentPct("listening");
  const readingWP = weightedRecentPct("reading");
  const matchingWP = weightedRecentPct("matching");
  const clozeWP = weightedRecentPct("cloze");
  const writingWP = weightedRecentPct("writing");
  const translationWP = weightedRecentPct("translation");

  const totalTrained = listeningWP.total + readingWP.total + matchingWP.total +
    clozeWP.total + writingWP.total + translationWP.total;
  const hasTrainingData = totalTrained > 0;
  const hasEnoughData = totalTrained >= 10;

  // 近N天训练天数
  const allDays = new Set<string>();
  for (const m of ["listening","reading","matching","cloze","writing","translation"]) {
    for (const r of getTrainingRecords(m)) allDays.add(r.date.slice(0, 10));
  }
  const recentDays = allDays.size;

  let estimatedScore: number | null;
  if (!hasTrainingData) {
    estimatedScore = null; // 无数据 → 不显示估分
  } else if (!hasEnoughData) {
    // 数据不足 → 自评为主(0.6) + 训练为辅(0.4)
    const readingTotal = readingWP.total + matchingWP.total + clozeWP.total;
    const rPct = readingTotal > 0
      ? (readingWP.pct * readingWP.total + matchingWP.pct * matchingWP.total + clozeWP.pct * clozeWP.total) / readingTotal
      : assessToPct(reading);
    const lPct = listeningWP.total > 0 ? listeningWP.pct : assessToPct(listening);
    const wtTotal = writingWP.total + translationWP.total;
    const wtPct = wtTotal > 0
      ? (writingWP.pct * writingWP.total + translationWP.pct * translationWP.total) / wtTotal
      : assessToPct(writingTranslation);

    estimatedScore = Math.round(
      moduleMaxScores.listening * (lPct * 0.4 + assessToPct(listening) * 0.6) +
      moduleMaxScores.reading * (rPct * 0.4 + assessToPct(reading) * 0.6) +
      moduleMaxScores.writingTranslation * (wtPct * 0.4 + assessToPct(writingTranslation) * 0.6)
    );
  } else {
    // 数据充足 → 训练为主(0.8) + 自评为辅(0.2)
    const readingTotal = readingWP.total + matchingWP.total + clozeWP.total;
    const rPct = readingTotal > 0
      ? (readingWP.pct * readingWP.total + matchingWP.pct * matchingWP.total + clozeWP.pct * clozeWP.total) / readingTotal
      : assessToPct(reading);
    const lPct = listeningWP.total > 0 ? listeningWP.pct : assessToPct(listening);
    const wtTotal = writingWP.total + translationWP.total;
    const wtPct = wtTotal > 0
      ? (writingWP.pct * writingWP.total + translationWP.pct * translationWP.total) / wtTotal
      : assessToPct(writingTranslation);

    estimatedScore = Math.round(
      moduleMaxScores.listening * (lPct * 0.8 + assessToPct(listening) * 0.2) +
      moduleMaxScores.reading * (rPct * 0.8 + assessToPct(reading) * 0.2) +
      moduleMaxScores.writingTranslation * (wtPct * 0.8 + assessToPct(writingTranslation) * 0.2)
    );
  }

  const rawGap = estimatedScore !== null ? targetScore - estimatedScore : targetScore;
  const scoreGap = hasTrainingData ? rawGap : targetScore;

  // 模块近期正确率
  const moduleRecentPct: Record<string, number> = {
    listening: Math.round(listeningWP.pct * 100),
    reading: Math.round(readingWP.pct * 100),
    matching: Math.round(matchingWP.pct * 100),
    cloze: Math.round(clozeWP.pct * 100),
    writing: Math.round(writingWP.pct * 100),
    translation: Math.round(translationWP.pct * 100),
  };

  const weakModules: string[] = [];
  const strongModules: string[] = [];
  if (listening <= 2) weakModules.push("听力");
  else if (listening >= 4) strongModules.push("听力");
  if (reading <= 2) weakModules.push("阅读");
  else if (reading >= 4) strongModules.push("阅读");
  if (writingTranslation <= 2) weakModules.push("写作翻译");
  else if (writingTranslation >= 4) strongModules.push("写作翻译");

  // 实际训练数据修正弱项/强项
  if (hasEnoughData) {
    if (listeningWP.pct < 0.4 && !weakModules.includes("听力")) weakModules.push("听力");
    else if (listeningWP.pct > 0.75 && !strongModules.includes("听力")) strongModules.push("听力");
    const readAvg = (readingWP.pct + matchingWP.pct + clozeWP.pct) / 3;
    if (readAvg < 0.4 && !weakModules.includes("阅读")) weakModules.push("阅读");
    else if (readAvg > 0.75 && !strongModules.includes("阅读")) strongModules.push("阅读");
    const wtAvg = (writingWP.pct + translationWP.pct) / 2;
    if (wtAvg < 0.4 && !weakModules.includes("写作翻译")) weakModules.push("写作翻译");
    else if (wtAvg > 0.75 && !strongModules.includes("写作翻译")) strongModules.push("写作翻译");
  }

  const dailyTargets: DailyTarget[] = [
    {
      module: "listening", label: "听力训练", icon: "🎧", route: "/english/listening",
      dailyCount: listening <= 2 ? 15 : listening <= 3 ? 10 : 5, unit: "题",
      priority: listening <= 2 ? "high" : listening >= 4 ? "low" : "medium",
      reason: listening <= 2 ? "弱项优先攻克" : listening >= 4 ? "保持语感" : "稳步提升",
      color: listening <= 2 ? "red" : listening >= 4 ? "emerald" : "amber",
    },
    {
      module: "reading", label: "阅读理解", icon: "📖", route: "/english/reading",
      dailyCount: reading <= 2 ? 3 : reading <= 3 ? 2 : 1, unit: "篇",
      priority: reading <= 2 ? "high" : reading >= 4 ? "low" : "medium",
      reason: reading <= 2 ? "弱项优先攻克" : reading >= 4 ? "保持手感" : "稳步提升",
      color: reading <= 2 ? "red" : reading >= 4 ? "emerald" : "amber",
    },
    {
      module: "cloze", label: "选词填空", icon: "📝", route: "/english/cloze",
      dailyCount: reading <= 2 ? 2 : reading <= 3 ? 1 : 1, unit: "篇",
      priority: reading <= 2 ? "high" : reading >= 4 ? "low" : "medium",
      reason: reading <= 2 ? "配合阅读训练" : "定期练习",
      color: reading <= 2 ? "red" : reading >= 4 ? "emerald" : "amber",
    },
    {
      module: "matching", label: "段落匹配", icon: "🔗", route: "/english/matching",
      dailyCount: reading <= 2 ? 2 : reading <= 3 ? 1 : 1, unit: "篇",
      priority: "medium", reason: "配合阅读训练", color: "amber",
    },
    {
      module: "writing", label: "作文训练", icon: "✍️", route: "/english/writing",
      dailyCount: 1, unit: "篇",
      priority: writingTranslation <= 2 ? "high" : "medium",
      reason: writingTranslation <= 2 ? "弱项需要多写多练" : "每周2-3篇保持",
      color: writingTranslation <= 2 ? "red" : "amber",
    },
    {
      module: "translation", label: "翻译训练", icon: "🌐", route: "/english/translation",
      dailyCount: writingTranslation <= 2 ? 2 : writingTranslation <= 3 ? 1 : 1, unit: "段",
      priority: writingTranslation <= 2 ? "high" : "medium",
      reason: writingTranslation <= 2 ? "弱项需要多练" : "每周2-3段保持",
      color: writingTranslation <= 2 ? "red" : "amber",
    },
    {
      module: "vocab", label: "词汇背诵", icon: "📚", route: "/english/vocab",
      dailyCount: Math.round(20 + (3 - Math.min(listening, reading, writingTranslation)) * 10),
      unit: "词",
      priority: Math.min(listening, reading, writingTranslation) <= 2 ? "high" : "medium",
      reason: `目标${targetScore}分需要扎实词汇基础`,
      color: "blue",
    },
  ];

  const totalDailyMinutes = Math.round(
    dailyTargets.filter((t) => t.priority === "high").length * 15 +
    dailyTargets.filter((t) => t.priority === "medium").length * 10 +
    dailyTargets.filter((t) => t.priority === "low").length * 5
  );

  let summary: string;
  if (!hasTrainingData) {
    summary = `尚未开始训练，无法估分。先完成诊断题开始针对性训练，每天约 ${totalDailyMinutes} 分钟。`;
  } else if (!hasEnoughData) {
    summary = `训练数据不足（仅${totalTrained}题），估分仅供参考。继续练习以获取更准确的评估。`;
  } else if (scoreGap > 100) {
    summary = `当前估分 ${estimatedScore}（基于${totalTrained}题/${recentDays}天训练），差距 ${scoreGap} 分。每天约 ${totalDailyMinutes} 分钟，重点攻克${weakModules.join("和")}。`;
  } else if (scoreGap > 30) {
    summary = `当前估分 ${estimatedScore}，差距 ${scoreGap} 分。加强${weakModules.join("和")}训练，每天约 ${totalDailyMinutes} 分钟。`;
  } else if (scoreGap > 0) {
    summary = `当前估分 ${estimatedScore}，接近目标！再提升 ${scoreGap} 分。每天约 ${totalDailyMinutes} 分钟保持。`;
  } else {
    summary = `当前估分 ${estimatedScore}，已超目标！稳固${strongModules.join("和")}优势，每天约 ${totalDailyMinutes} 分钟。`;
  }

  return {
    level, targetScore, estimatedCurrentScore: estimatedScore, hasTrainingData, hasEnoughData,
    scoreGap, dailyTargets, totalDailyMinutes, weakModules, strongModules, summary,
    moduleRecentPct, recentDays,
  };
}

export function getTodayRecommendation() {
  const plan = computeTrainingPlan();
  if (!plan) return null;
  const byModule: Record<string, DailyTarget> = {};
  for (const t of plan.dailyTargets) byModule[t.module] = t;
  return {
    listening: byModule.listening, reading: byModule.reading,
    writing: byModule.writing, translation: byModule.translation,
    vocab: byModule.vocab, match: byModule.matching, cloze: byModule.cloze,
    totalMinutes: plan.totalDailyMinutes,
    priorityModule: plan.weakModules[0] || "听力",
    hasTarget: true,
  };
}
