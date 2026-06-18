"use client";

const LABS: Record<string, string> = { easy: "🟢 基础 ~1min", medium: "🟡 中等 ~2min", hard: "🔴 困难 ~3min", mixed: "🔀 综合 ~1-3min" };

export function getStoredDiff(): string {
  if (typeof window === "undefined") return "mixed";
  return localStorage.getItem("learnos_quiz_difficulty") || "mixed";
}

export function DiffBadge({ diff }: { diff?: string }) {
  const d = diff || getStoredDiff();
  const colors: Record<string, string> = { easy: "text-emerald-700 bg-emerald-50 border-emerald-200", medium: "text-amber-700 bg-amber-50 border-amber-200", hard: "text-red-700 bg-red-50 border-red-200", mixed: "text-zinc-600 bg-zinc-100 border-zinc-200" };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colors[d]||colors.mixed}`}>{LABS[d]||LABS.mixed}</span>;
}
