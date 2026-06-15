"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, BookOpen, Headphones, PenLine, Languages, Link2, FileText, BookMarked, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTrainingRecords, getErrorBookRecords, getScoreTarget } from "@/lib/use-training-memory";
import { loadProgress } from "@/lib/vocab-scheduler";
import { computeTrainingPlan } from "@/lib/training-plan";

const ICONS: Record<string, any> = { reading: BookOpen, listening: Headphones, writing: PenLine, translation: Languages, matching: Link2, cloze: FileText, vocab: BookMarked };
const ROUTES: Record<string, string> = { reading: "/english/reading", listening: "/english/listening", writing: "/english/writing", translation: "/english/translation", matching: "/english/matching", cloze: "/english/cloze", vocab: "/english/vocab", exam: "/english/exam" };

export default function MemoryPage() {
  const router = useRouter();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const records = getTrainingRecords();
    const errors = getErrorBookRecords();
    const cet4p = loadProgress("cet4");
    const cet6p = loadProgress("cet6");
    const items: any[] = [];
    const now = Date.now();

    for (const bank of ["cet4", "cet6"] as const) {
      const p = bank === "cet4" ? cet4p : cet6p;
      const due = Object.entries(p.words)
        .filter(([, w]) => w.status !== "mastered" && !w.passedToday && new Date(w.nextReviewTime).getTime() <= now)
        .slice(0, 8);
      for (const entry of due) {
        const word = entry[0];
        const wp = entry[1];
        items.push({
          front: `复习单词：${word}`,
          back: `已学${wp.reviewCount}次 · 连续正确${wp.streak}次`,
          status: wp.streak === 0 ? "due" : "learning",
          nextReview: new Date(wp.nextReviewTime).toLocaleDateString("zh-CN"),
          module: "vocab",
        });
      }
    }

    for (const r of errors.slice(0, 8)) {
      items.push({
        front: `错题复习：${r.question.slice(0, 50)}...`,
        back: `正确：${r.correctAnswer}\n你的：${r.userAnswer}`,
        status: "due",
        nextReview: "立即复习",
        module: r.module,
        errorId: r.id,
      });
    }

    const counts: Record<string, number> = {};
    for (const r of records) counts[r.module] = (counts[r.module] || 0) + 1;
    for (const mod of Object.keys(counts)) {
      const c = counts[mod];
      const ok = records.filter(r => r.module === mod && r.isCorrect).length;
      items.push({
        front: `${mod} 模块统计`,
        back: `共${c}题 · 正确${ok}题 (${Math.round(ok / c * 100)}%)`,
        status: "review",
        nextReview: "查看",
        module: mod,
      });
    }

    if (items.length === 0) {
      items.push({
        front: "开始学习",
        back: "完成训练后自动生成记忆卡片",
        status: "due",
        nextReview: "现在",
        module: "reading",
      });
    }

    setCards(items.slice(0, 20));
    setLoading(false);
  }, []);

  if (loading) return <div className="p-12 text-center"><div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" /></div>;

  const due = cards.filter(c => c.status === "due").length;
  const plan = computeTrainingPlan();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">🧠 记忆卡片</h1><p className="text-zinc-500">基于学习数据的智能复习提醒</p></div>
        <div className="text-right"><span className="text-2xl font-bold text-primary-600">{due}</span><p className="text-xs text-zinc-400">张待复习</p></div>
      </div>

      {plan && plan.weakModules.length > 0 && (
        <div className="card border-red-200 bg-red-50/40 p-4 mb-4">
          <p className="text-sm font-bold text-red-700 mb-1">优先复习提醒</p>
          <p className="text-xs text-red-600">
            你的弱项是{plan.weakModules.join("和")}，建议优先复习相关错题和词汇。
            每天建议总训练约 {plan.totalDailyMinutes} 分钟。
          </p>
        </div>
      )}

      {cards.map((c, i) => {
        const Icon = ICONS[c.module] || BookOpen;
        const route = c.errorId ? `/error-book?id=${c.errorId}` : ROUTES[c.module];
        return (
          <button key={i} onClick={() => route && router.push(route)}
            className={cn("card mb-3 w-full text-left hover:shadow-md transition-all", c.status === "due" && "border-primary-300 bg-primary-50/50")}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-zinc-400" />
                <span className={cn("text-xs px-2 py-0.5 rounded-full", c.status === "due" ? "bg-primary-100 text-primary-700" : "bg-zinc-100 text-zinc-500")}>
                  {c.status === "due" ? "待复习" : c.status === "learning" ? "学习中" : "复习中"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-zinc-400 flex items-center gap-1"><RefreshCw className="w-3 h-3" />{c.nextReview}</span>
                {route && <ArrowRight className="w-3.5 h-3.5 text-zinc-300" />}
              </div>
            </div>
            <p className="font-medium text-sm mb-1">❓ {c.front}</p>
            <p className="text-sm text-zinc-500 whitespace-pre-wrap">💡 {c.back}</p>
          </button>
        );
      })}
    </div>
  );
}
