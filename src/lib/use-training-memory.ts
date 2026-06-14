"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { userKey } from "./user-store";

/** 全局训练记忆 Hook — 自动 localStorage 持久化，数据按用户隔离 */
export function useTrainingMemory<T>(key: string, initialState: T | (() => T), version = 1): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const storageKey = userKey(`learnos_mem_${key}_v${version}`);
  const initRef = useRef(false);
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        // 数组直接返回，展开运算符会把数组变成 {0:..., 1:...} 导致 length/下标失效
        if (Array.isArray(parsed)) return parsed as T;
        // 原始类型（number/string/boolean）直接返回，展开运算符会把它们变成空对象 {}
        if (typeof parsed !== "object" || parsed === null) return parsed as T;
        const init = typeof initialState === "function" ? (initialState as () => T)() : initialState;
        // init 也是原始类型时，parsed 优先（直接返回 parsed）
        if (typeof init !== "object" || init === null) return parsed as T;
        return { ...init, ...parsed };
      }
    } catch {}
    return typeof initialState === "function" ? (initialState as () => T)() : initialState;
  });
  useEffect(() => {
    if (!initRef.current) { initRef.current = true; return; }
    try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch {}
  }, [state, storageKey]);
  // 始终保持最新 state 引用，供 cleanup 在卸载时保存
  const stateRef = useRef<T>(state);
  stateRef.current = state;
  // 覆盖上面的 effect：加入 cleanup 确保卸载时写入
  useEffect(() => {
    return () => {
      try { localStorage.setItem(storageKey, JSON.stringify(stateRef.current)); } catch {}
    };
  }, [storageKey]);
  const reset = useCallback(() => {
    const init = typeof initialState === "function" ? (initialState as () => T)() : initialState;
    setState(init);
    localStorage.removeItem(storageKey);
  }, [initialState, storageKey]);
  return [state, setState, reset];
}

export interface TrainingRecord {
  id: string; module: string; date: string; title?: string;
  question: string; userAnswer: string; correctAnswer: string;
  isCorrect: boolean; explanation?: string; addedToErrorBook: boolean;
}

function getRK() { return userKey("learnos_training_records"); }

export function saveTrainingRecord(r: Omit<TrainingRecord, "id"|"date"|"addedToErrorBook">): TrainingRecord {
  // 答错自动加入错题本；答对可手动加入
  const full: TrainingRecord = { ...r, id: `${r.module}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, date: new Date().toISOString(), addedToErrorBook: !r.isCorrect };
  try { const arr: TrainingRecord[] = JSON.parse(localStorage.getItem(getRK())||"[]"); arr.push(full); localStorage.setItem(getRK(), JSON.stringify(arr.slice(-2000))); } catch {}
  return full;
}

export function getTrainingRecords(module?: string): TrainingRecord[] {
  try { const arr: TrainingRecord[] = JSON.parse(localStorage.getItem(getRK())||"[]"); return module ? arr.filter(r=>r.module===module) : arr; } catch { return []; }
}

export function toggleErrorBook(recordId: string): boolean {
  try {
    const arr: TrainingRecord[] = JSON.parse(localStorage.getItem(getRK())||"[]");
    const i = arr.findIndex(r=>r.id===recordId);
    if (i>=0) { arr[i].addedToErrorBook = !arr[i].addedToErrorBook; localStorage.setItem(getRK(), JSON.stringify(arr)); return arr[i].addedToErrorBook; }
  } catch {}
  return false;
}

export function getErrorBookRecords(module?: string): TrainingRecord[] {
  return getTrainingRecords(module).filter(r=>r.addedToErrorBook);
}

export function getErrorBookByModule(): Record<string, TrainingRecord[]> {
  const g: Record<string, TrainingRecord[]> = {};
  for (const r of getErrorBookRecords()) { if(!g[r.module]) g[r.module]=[]; g[r.module].push(r); }
  return g;
}

export function getStubbornVocabWords(): {word:string; wrongCount:number}[] {
  const m: Record<string,number> = {};
  for (const r of getTrainingRecords("vocab")) { if(!r.isCorrect) m[r.correctAnswer]=(m[r.correctAnswer]||0)+1; }
  return Object.entries(m).filter(([,c])=>c>=2).map(([w,c])=>({word:w,wrongCount:c})).sort((a,b)=>b.wrongCount-a.wrongCount);
}

export interface ScoreTargetData {
  level: "cet4" | "cet6";
  targetScore: number;
  selfAssessment: { listening: number; reading: number; writingTranslation: number };
  createdAt: string;
}
export function getScoreTarget(): ScoreTargetData | null {
  try { const raw = localStorage.getItem(userKey("learnos_score_target")); if (raw) return JSON.parse(raw); } catch {}
  return null;
}

export function getModuleStats(module: string): {total:number; correct:number; recentPct:number} {
  const records = getTrainingRecords(module);
  const total = records.length;
  const correct = records.filter(r=>r.isCorrect).length;
  const recent = records.slice(-20);
  const recentPct = recent.length>0 ? Math.round(recent.filter(r=>r.isCorrect).length/recent.length*100) : 0;
  return { total, correct, recentPct };
}
