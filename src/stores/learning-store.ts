"use client";
import { create } from "zustand";
import type { CourseInfo, KnowledgeTreeNode, MasteryInfo, CockpitData } from "@/types";

interface LearningState {
  courses: CourseInfo[]; currentCourse: CourseInfo | null;
  knowledgeTree: KnowledgeTreeNode[]; masteryScores: Record<string, MasteryInfo>;
  cockpitData: CockpitData | null; isLoading: boolean;
  setCourses: (c: CourseInfo[]) => void; setCurrentCourse: (c: CourseInfo | null) => void;
  setKnowledgeTree: (t: KnowledgeTreeNode[]) => void;
  setMasteryScores: (s: Record<string, MasteryInfo>) => void;
  updateMasteryScore: (nodeId: string, s: MasteryInfo) => void;
  setCockpitData: (d: CockpitData) => void; setLoading: (l: boolean) => void;
}

export const useLearningStore = create<LearningState>((set) => ({
  courses: [], currentCourse: null, knowledgeTree: [], masteryScores: {}, cockpitData: null, isLoading: false,
  setCourses: (courses) => set({ courses }),
  setCurrentCourse: (currentCourse) => set({ currentCourse }),
  setKnowledgeTree: (knowledgeTree) => set({ knowledgeTree }),
  setMasteryScores: (masteryScores) => set({ masteryScores }),
  updateMasteryScore: (nodeId, score) => set((s) => ({ masteryScores: { ...s.masteryScores, [nodeId]: score } })),
  setCockpitData: (cockpitData) => set({ cockpitData }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
