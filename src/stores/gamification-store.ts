"use client";
import { create } from "zustand";

interface GamificationState {
  xp: number; level: number; streak: number; achievements: string[];
  addXp: (amount: number) => void; updateStreak: (days: number) => void;
  unlockAchievement: (name: string) => void;
}

function calcLevel(xp: number): number {
  if (xp >= 10000) return 20; if (xp >= 2000) return 10; if (xp >= 500) return 5; return 1;
}

export const useGamificationStore = create<GamificationState>((set) => ({
  xp: 0, level: 1, streak: 0, achievements: [],
  addXp: (amount) => set((s) => ({ xp: s.xp + amount, level: calcLevel(s.xp + amount) })),
  updateStreak: (streak) => set({ streak }),
  unlockAchievement: (name) => set((s) => ({
    achievements: s.achievements.includes(name) ? s.achievements : [...s.achievements, name],
  })),
}));
