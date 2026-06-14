import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function calculateLevel(xp: number): number {
  if (xp >= 10000) return 20; if (xp >= 2000) return 10;
  if (xp >= 500) return 5; return 1;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}小时${m}分` : `${m}分钟`;
}

export function getMasteryColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

export function getMasteryBgColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

/** 安全解析 AI 返回的 JSON，自动清理 markdown 代码块包裹 */
export function safeParseAIJson(content: string): any {
  const cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned);
}
