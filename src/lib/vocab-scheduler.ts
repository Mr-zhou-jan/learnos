/**
 * 词汇调度器 — 基于艾宾浩斯遗忘曲线的单词复习系统
 *
 * 核心逻辑：
 *  - 新词每天学习 N 个（用户可配置）
 *  - 复习按 1→3→7→15→30 天间隔推进
 *  - 答错 → 当天队尾重新出现，直到当天答对
 *  - 答对 → 推进到下一间隔
 *  - 连续 5 次答对（30天间隔后）→ 标记为"已掌握"
 */

import { userKey } from "./user-store";

export type VocabMode = "handwrite" | "spell" | "mixed";
export type WordStatus = "new" | "learning" | "review" | "mastered";

export interface VocabSettings {
  bank: "cet4" | "cet6";
  dailyNewWords: number;
  dailyMaxReview: number;
  mode: VocabMode;
}

export interface WordProgress {
  word: string;
  status: WordStatus;
  reviewCount: number;
  nextReviewTime: string;
  streak: number;
  totalWrong: number;
  lastPracticedAt: string;
  ease: number;
  passedToday: boolean;
}

/** 单词来源追踪 */
export interface WordSource {
  date: string;
  module: string;
  question: string;
  /** 包含该词的原始句子 */
  sentence: string;
  /** 训练记录ID（用于跳转到历史记录对应位置） */
  recordId: string;
}

export interface VocabProgressData {
  settings: VocabSettings;
  words: Record<string, WordProgress>;
  totalLearned: number;
  totalMastered: number;
  todayNewCount: number;
  todayReviewCount: number;
  dateStamp: string;
  /** 打卡记录 */
  checkIns: string[];
  /** 单词来源（来自哪些训练题） */
  wordSources: Record<string, WordSource[]>;
}

export const DEFAULT_SETTINGS: VocabSettings = {
  bank: "cet4",
  dailyNewWords: 30,
  dailyMaxReview: 50,
  mode: "mixed",
};

const INTERVALS = [1, 3, 7, 15, 30];

export function getNextInterval(reviewCount: number): number {
  if (reviewCount < INTERVALS.length) return INTERVALS[reviewCount];
  return 30;
}

export function getNextReviewDate(reviewCount: number): string {
  const d = new Date();
  d.setDate(d.getDate() + getNextInterval(reviewCount));
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function getVocabKey(bank: string) { return userKey(`learnos_vocab_progress_${bank}`); }

export function loadProgress(bank: "cet4" | "cet6"): VocabProgressData {
  try {
    const raw = localStorage.getItem(getVocabKey(bank));
    if (raw) {
      const data = JSON.parse(raw) as VocabProgressData;
      // 向后兼容：旧数据可能没有这些字段
      if (!data.checkIns) data.checkIns = [];
      if (!data.wordSources) data.wordSources = {};
      const today = new Date().toDateString();
      if (data.dateStamp !== today) {
        data.dateStamp = today;
        data.todayNewCount = 0;
        data.todayReviewCount = 0;
        for (const w of Object.values(data.words)) {
          w.passedToday = false;
        }
      }
      return data;
    }
  } catch {}
  return createEmptyProgress(bank);
}

export function saveProgress(data: VocabProgressData): void {
  localStorage.setItem(getVocabKey(data.settings.bank), JSON.stringify(data));
}

function createEmptyProgress(bank: "cet4" | "cet6"): VocabProgressData {
  return {
    settings: { ...DEFAULT_SETTINGS, bank },
    words: {},
    totalLearned: 0,
    totalMastered: 0,
    todayNewCount: 0,
    todayReviewCount: 0,
    dateStamp: new Date().toDateString(),
    checkIns: [],
    wordSources: {},
  };
}

/** 记录单词来源（来自训练题） */
export function addWordSource(progress: VocabProgressData, word: string, source: WordSource): void {
  if (!progress.wordSources) progress.wordSources = {};
  if (!progress.wordSources[word]) progress.wordSources[word] = [];
  if (!progress.wordSources[word].some(s => s.recordId === source.recordId)) {
    progress.wordSources[word].push(source);
  }
}

/** 检查今日是否全部完成，是则自动打卡 */
export function tryCheckIn(progress: VocabProgressData): boolean {
  const today = new Date().toDateString();
  if (progress.checkIns.includes(today)) return false; // 已打卡
  const dueToday = Object.values(progress.words).filter(w =>
    w.status !== "mastered" && !w.passedToday
  );
  if (dueToday.length === 0 && Object.keys(progress.words).length > 0) {
    progress.checkIns.push(today);
    progress.checkIns = progress.checkIns.slice(-365); // 保留一年
    return true;
  }
  return false;
}

/** 获取连续打卡天数 */
export function getStreak(progress: VocabProgressData): number {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (progress.checkIns.includes(d.toDateString())) streak++;
    else break;
  }
  return streak;
}

export function markCorrect(progress: VocabProgressData, word: string): VocabProgressData {
  const wp = progress.words[word];
  if (!wp) return progress;
  wp.passedToday = true;
  wp.streak += 1;
  wp.lastPracticedAt = new Date().toISOString();
  if (wp.status === "new") {
    wp.status = "learning";
    wp.reviewCount = 1;
    progress.todayNewCount += 1;
    progress.totalLearned += 1;
  } else if (wp.status === "learning" || wp.status === "review") {
    wp.reviewCount += 1;
    wp.status = "review";
    progress.todayReviewCount += 1;
  }
  if (wp.streak >= 5 && wp.reviewCount >= INTERVALS.length) {
    wp.status = "mastered";
    progress.totalMastered += 1;
  } else {
    wp.nextReviewTime = getNextReviewDate(wp.reviewCount);
  }
  saveProgress(progress);
  return progress;
}

export function markWrong(progress: VocabProgressData, word: string): VocabProgressData {
  const wp = progress.words[word];
  if (!wp) return progress;
  wp.streak = 0;
  wp.totalWrong += 1;
  wp.ease = Math.max(1.3, wp.ease - 0.2);
  wp.lastPracticedAt = new Date().toISOString();
  // 答错后当天继续出现，不推迟到明天 — nextReviewTime 保持为今天
  wp.nextReviewTime = new Date().toISOString();
  if (wp.status === "new") {
    wp.status = "learning";
    progress.totalLearned += 1;
    progress.todayNewCount += 1;
  }
  saveProgress(progress);
  return progress;
}

export function addNewWord(progress: VocabProgressData, word: string): VocabProgressData {
  if (progress.words[word]) return progress;
  progress.words[word] = {
    word,
    status: "new",
    reviewCount: 0,
    nextReviewTime: new Date().toISOString(),
    streak: 0,
    totalWrong: 0,
    lastPracticedAt: "",
    ease: 2.5,
    passedToday: false,
  };
  return progress;
}

export function getTodayQueue(
  progress: VocabProgressData,
  wordList: string[],
): { newWords: string[]; reviewWords: string[] } {
  const now = Date.now();
  const reviewWords: string[] = [];
  const newWords: string[] = [];

  // 到期复习词（未通过且到时间）
  for (const word of Object.keys(progress.words)) {
    const wp = progress.words[word];
    if (wp.passedToday || wp.status === "mastered") continue;
    if (new Date(wp.nextReviewTime).getTime() <= now) {
      reviewWords.push(word);
    }
  }

  // 复习词数量限制
  const limitedReview = reviewWords.slice(0, progress.settings.dailyMaxReview);

  // 新词：从未学过的单词
  const learnedSet = new Set(Object.keys(progress.words));
  const remainingNew = progress.settings.dailyNewWords - progress.todayNewCount;
  for (const w of wordList) {
    if (newWords.length >= Math.max(0, remainingNew)) break;
    if (!learnedSet.has(w)) {
      newWords.push(w);
    }
  }

  return { newWords, reviewWords: limitedReview };
}

export function getVocabStats(progress: VocabProgressData, totalInBank: number) {
  const words = Object.values(progress.words);
  return {
    totalLearned: progress.totalLearned,
    totalMastered: progress.totalMastered,
    totalInBank,
    learning: words.filter(w => w.status === "learning").length,
    review: words.filter(w => w.status === "review").length,
    todayNew: progress.todayNewCount,
    todayReview: progress.todayReviewCount,
    remaining: totalInBank - progress.totalLearned,
    progressPercent: totalInBank > 0 ? Math.round((progress.totalLearned / totalInBank) * 100) : 0,
  };
}
