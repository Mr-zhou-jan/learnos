"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Headphones, BookMarked, ChevronRight, CheckCircle2, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeTrainingPlan } from "@/lib/training-plan";

interface StepItem {
  id: string; label: string; icon: any; route: string; desc: string; target: string; priority: "high" | "medium" | "low";
}

export default function TodayPage() {
  const router = useRouter();
  const [steps, setSteps] = useState<(StepItem & { done: boolean; progress: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const today = new Date().toLocaleDateString("zh-CN", { weekday: "long", month: "long", day: "numeric" });

  useEffect(() => {
    const plan = computeTrainingPlan();

    // 词汇进度
    let vocabProgress = "";
    let vocabDone = false;
    try {
      const vp = JSON.parse(localStorage.getItem("learnos_vocab_progress_cet4") || "{}");
      const done = (vp.todayNewCount || 0) + (vp.todayReviewCount || 0);
      vocabProgress = done > 0 ? `${done}词已学` : "";
      vocabDone = done >= 20;
      if (vp.checkIns?.length > 0) {
        const recent = vp.checkIns.filter((d: string) => {
          const diff = new Date().getTime() - new Date(d).getTime();
          return diff < 7 * 24 * 3600 * 1000;
        });
        setStreak(recent.length);
      }
    } catch {}

    // 构建学习步骤
    let items: StepItem[] = [];
    if (plan && plan.dailyTargets?.length > 0) {
      items = plan.dailyTargets.map((t: any) => ({
        id: t.module, label: t.label, icon: BookOpen, route: t.route,
        desc: t.description || "", target: `目标 ${t.dailyCount}${t.unit}/天`, priority: t.priority || "medium",
      }));
    } else {
      items = [
        { id: "vocab", label: "词汇背诵", icon: BookMarked, route: "/english/vocab", desc: "艾宾浩斯记忆法，科学抗遗忘", target: "目标 30词/天", priority: "high" },
        { id: "reading", label: "阅读理解", icon: BookOpen, route: "/english/reading", desc: "仔细阅读×1篇，训练主旨+细节+推断", target: "目标 1篇/天", priority: "high" },
        { id: "listening", label: "听力训练", icon: Headphones, route: "/english/listening", desc: "Section A/B/C各一组，磨耳朵", target: "目标 1组/天", priority: "medium" },
        { id: "error", label: "复习错题", icon: Target, route: "/error-book", desc: "温故知新，错题不再错", target: "复习今日错题", priority: "medium" },
      ];
    }

    // 标记完成状态
    const withDone = items.map(item => {
      if (item.id === "vocab") return { ...item, done: vocabDone, progress: vocabProgress };
      return { ...item, done: false, progress: "" };
    });

    setSteps(withDone);
    setLoading(false);
  }, []);

  if (loading) return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="skeleton h-8 w-48 rounded-lg mb-2" />
      <div className="skeleton h-4 w-64 rounded mb-6" />
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl mb-3" />)}
    </div>
  );

  const completedCount = steps.filter(s => s.done).length;
  const allDone = steps.length > 0 && completedCount === steps.length;

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">今日学习路径</h1>
          <p className="text-sm text-zinc-500">{today}</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
            <span className="text-amber-500 text-lg">🔥</span>
            <span className="text-sm font-bold text-amber-700">连续 {streak} 天</span>
          </div>
        )}
      </div>

      {/* 全完成 */}
      {allDone && (
        <div className="card border-emerald-200 bg-emerald-50/50 p-6 text-center mb-6 animate-scale-in">
          <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-emerald-700 mb-1">今日任务全部完成！🎉</h2>
          <p className="text-sm text-emerald-600 mb-4">太棒了，明天继续保持这个节奏！</p>
          <button onClick={() => router.push("/english/exam")} className="btn-primary">
            <Sparkles className="w-4 h-4" /> 挑战一套整卷练习
          </button>
        </div>
      )}

      {/* 学习步骤流 */}
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={step.id}
            className={cn("card p-5 flex items-center gap-4 transition-all duration-300",
              step.done && "border-emerald-200 bg-emerald-50/30",
              step.priority === "high" && !step.done && "border-red-200 bg-red-50/20")}>
            {/* 步骤编号/完成标记 */}
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 transition-all",
              step.done ? "bg-emerald-500 text-white" : step.priority === "high" ? "bg-red-100 text-red-600" : "bg-zinc-100 text-zinc-400")}>
              {step.done ? <CheckCircle2 className="w-6 h-6" /> : i + 1}
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={cn("font-bold", step.done && "text-emerald-700")}>{step.label}</h3>
                {step.priority === "high" && !step.done && <span className="badge-danger text-[10px]">优先</span>}
                {step.done && <span className="badge-success text-[10px]">已完成</span>}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">{step.done ? (step.progress || "已完成") : step.desc}</p>
              {!step.done && <p className="text-xs text-primary-500 font-medium mt-1">{step.target}</p>}
            </div>

            {/* 按钮 */}
            <button onClick={() => router.push(step.route)}
              className={cn("shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                step.done ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "btn-primary")}>
              {step.done ? "复习" : "开始"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* 底部提示 */}
      {!allDone && steps.length > 0 && (
        <div className="mt-6 p-4 bg-primary-50 rounded-2xl border border-primary-100 text-center animate-fade-in">
          <p className="text-sm text-primary-700">💡 建议按从上到下的顺序完成，每项进度自动保存</p>
        </div>
      )}
    </div>
  );
}
