import { NextResponse } from "next/server";
import type { CockpitData } from "@/types";

export async function GET() {
  const data: CockpitData = {
    userId: "demo", totalXp: 2450, level: 10, streak: 7,
    weeklyStudyTime: 18600, masteredCount: 23, totalNodes: 42,
    weakNodes: [
      { nodeId: "1", title: "牛顿第二定律", courseName: "大学物理", score: 45, errorRate: 55 },
      { nodeId: "2", title: "指针与引用", courseName: "C++", score: 38, errorRate: 62 },
      { nodeId: "3", title: "应力分析", courseName: "工程力学", score: 48, errorRate: 50 },
    ],
    errorDistribution: [
      { category: "概念理解", count: 15, color: "#6366f1" }, { category: "计算错误", count: 10, color: "#f59e0b" },
      { category: "公式遗忘", count: 8, color: "#ef4444" }, { category: "逻辑推理", count: 5, color: "#10b981" },
    ],
    recommendedNext: [
      { nodeId: "3", title: "指针与引用", courseName: "C++", priority: "high", reason: "掌握度38%", score: 38 },
      { nodeId: "1", title: "牛顿第二定律", courseName: "大学物理", priority: "high", reason: "基础薄弱", score: 45 },
      { nodeId: "4", title: "时态一致", courseName: "英语", priority: "medium", reason: "7天未复习", score: 58 },
    ],
    masteryTrend: Array.from({ length: 7 }, (_, i) => ({ date: `6/${i + 1}`, avgScore: 50 + i * 3 })),
    weeklyHeatmap: [
      { day: "一", minutes: 45 }, { day: "二", minutes: 90 }, { day: "三", minutes: 30 },
      { day: "四", minutes: 120 }, { day: "五", minutes: 60 }, { day: "六", minutes: 15 }, { day: "日", minutes: 75 },
    ],
  };
  return NextResponse.json(data);
}
