"use client";
import { userKey } from "./user-store";

export interface TrainingState {
  module: string;
  currentIndex: number;
  answers: Record<string, any>;
  questions?: any[];
  startedAt: string;
  updatedAt: string;
}

function getKey(module: string): string {
  return userKey(`learnos_ts_${module}`);
}

export function saveTrainingState(module: string, state: Partial<TrainingState>): void {
  try {
    const existing = loadTrainingState(module);
    const merged = { ...existing, ...state, module, updatedAt: new Date().toISOString() };
    localStorage.setItem(getKey(module), JSON.stringify(merged));
  } catch {}
}

export function loadTrainingState(module: string): TrainingState | null {
  try {
    const raw = localStorage.getItem(getKey(module));
    if (!raw) return null;
    const s = JSON.parse(raw) as TrainingState;
    if (Date.now() - new Date(s.updatedAt).getTime() > 86400000) {
      clearTrainingState(module);
      return null;
    }
    return s;
  } catch { return null; }
}

export function clearTrainingState(module: string): void {
  localStorage.removeItem(getKey(module));
}

/** 直接覆写 localStorage（不做 merge，更可靠） */
export function saveTrainingStateDirect(module: string, data: Record<string, any>): void {
  try {
    localStorage.setItem(getKey(module), JSON.stringify({
      module, currentIndex: data.currentIndex ?? 0,
      answers: data.answers ?? data,
      updatedAt: new Date().toISOString(),
    }));
  } catch {}
}

/** 直接从 localStorage 读取 */
export function loadTrainingStateDirect(module: string): Record<string, any> | null {
  try {
    const raw = localStorage.getItem(getKey(module));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}
