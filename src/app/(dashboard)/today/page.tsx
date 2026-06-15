"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, ArrowRight, BookOpen, PenLine, Languages, Headphones, FileText, Link2, BookMarked, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { getScoreTarget } from "@/lib/use-training-memory";
import { computeTrainingPlan } from "@/lib/training-plan";

interface TaskModule {
  id: string; label: string; icon: any; route: string; desc: string; recordsKey: string;
}

const TASK_MODULES: TaskModule[] = [
  { id: "reading", label: "仔细阅读", icon: BookOpen, route: "/english/reading", desc: "主旨推理 · 细节定位", recordsKey: "learnos_reading_records" },
  { id: "listening", label: "听力训练", icon: Headphones, route: "/english/listening", desc: "短篇新闻 · 长对话 · 短文理解", recordsKey: "learnos_listening_records" },
  { id: "matching", label: "段落匹配", icon: Link2, route: "/english/matching", desc: "同义替换 · 段落定位", recordsKey: "learnos_matching_records" },
  { id: "cloze", label: "选词填空", icon: FileText, route: "/english/cloze", desc: "词汇辨析 · 上下文线索", recordsKey: "learnos_cloze_records" },
  { id: "writing", label: "作文批改", icon: PenLine, route: "/english/writing", desc: "议论文 · 书信 · 图表", recordsKey: "learnos_writing_records" },
  { id: "translation", label: "翻译训练", icon: Languages, route: "/english/translation", desc: "文化 · 经济 · 社会类", recordsKey: "learnos_translation_records" },
  { id: "vocab", label: "词汇背诵", icon: BookMarked, route: "/english/vocab", desc: "四六级词库 · 艾宾浩斯记忆", recordsKey: "learnos_vocab_progress" },
];

export default function TodayPage() {
  const router = useRouter();
  const [moduleData, setModuleData] = useState<Record<string, { done: number; correct: number; totalQ: number; pct: number }>>({});
  const [vocabInfo, setVocabInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const today = new Date().toDateString();

  useEffect(() => {
    const data: Record<string, { done: number; correct: number; totalQ: number; pct: number }> = {};
    for (const m of TASK_MODULES) {
      try {
        const raw = localStorage.getItem(m.recordsKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (m.id === "vocab") {
            setVocabInfo(parsed);
            data[m.id] = { done: (parsed.todayNewCount || 0) + (parsed.todayReviewCount || 0), correct: 0, totalQ: 0, pct: 0 };
          } else {
            const arr = Array.isArray(parsed) ? parsed : [];
            const todayItems = arr.filter((r: any) => new Date(r.date || r.timestamp || 0).toDateString() === today);
            const correct = todayItems.reduce((s: number, r: any) => s + (r.correct || 0), 0);
            const totalQ = todayItems.reduce((s: number, r: any) => s + (r.total || 0), 0);
            data[m.id] = { done: todayItems.length, correct, totalQ, pct: totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0 };
          }
        } else {
          data[m.id] = { done: 0, correct: 0, totalQ: 0, pct: 0 };
        }
      } catch { data[m.id] = { done: 0, correct: 0, totalQ: 0, pct: 0 }; }
    }
    setModuleData(data);
    setLoading(false);
  }, [today]);

  const plan = computeTrainingPlan();
  const st = getScoreTarget();
  const isWeakModule = (id: string) => {
    if (!st) return false;
    if (id === "listening") return st.selfAssessment.listening <= 2;
    if (id === "reading" || id === "matching" || id === "cloze") return st.selfAssessment.reading <= 2;
    if (id === "writing" || id === "translation") return st.selfAssessment.writingTranslation <= 2;
    return false;
  };
  const isStrongModule = (id: string) => {
    if (!st) return false;
    if (id === "listening") return st.selfAssessment.listening >= 4;
    if (id === "reading" || id === "matching" || id === "cloze") return st.selfAssessment.reading >= 4;
    if (id === "writing" || id === "translation") return st.selfAssessment.writingTranslation >= 4;
    return false;
  };

  if (loading) return <div className="p-12 text-center"><div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"/></div>;

  const totalDone = Object.values(moduleData).reduce((s, d) => s + d.done, 0);
  const totalCorrect = Object.values(moduleData).reduce((s, d) => s + d.correct, 0);
  const totalQ = Object.values(moduleData).reduce((s, d) => s + d.totalQ, 0);
  const overallPct = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;
  const activeModules = Object.entries(moduleData).filter(([, d]) => d.done > 0).length;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">📅 今日任务</h1>
          <p className="text-sm text-zinc-500">{today}</p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold text-primary-600">{totalDone}</span>
          <p className="text-xs text-zinc-400">今日完成</p>
        </div>
      </div>

      {/* 汇总卡片 */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { v: totalDone, l: "完成题数", c: "text-primary-600" },
          { v: totalQ > 0 ? `${overallPct}%` : "-", l: "正确率", c: overallPct >= 60 ? "text-emerald-600" : "text-red-500" },
          { v: totalQ, l: "总题数", c: "text-amber-600" },
          { v: `${activeModules}/${TASK_MODULES.length}`, l: "已启动模块", c: "text-indigo-600" },
        ].map((x, i) => (
          <div key={i} className="card p-3 text-center">
            <p className={`text-2xl font-bold ${x.c}`}>{x.v}</p>
            <p className="text-xs text-zinc-400">{x.l}</p>
          </div>
        ))}
      </div>

      {/* 模块卡片 */}
      <div className="space-y-3">
        {TASK_MODULES.map(m => {
          const d = moduleData[m.id] || { done: 0, correct: 0, totalQ: 0, pct: 0 };
          const hasActivity = d.done > 0;
          return (
            <div key={m.id} className={cn("card p-4", hasActivity && "border-primary-100", isWeakModule(m.id) && "border-red-200 bg-red-50/30", isStrongModule(m.id) && "border-emerald-200 bg-emerald-50/30")}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center shrink-0">
                  <m.icon className="w-5 h-5 text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">
                    {m.label}
                    {isWeakModule(m.id) && <span className="ml-1.5 text-xs text-red-500 font-bold"><Zap className="w-3 h-3 inline" /> 优先</span>}
                    {isStrongModule(m.id) && <span className="ml-1.5 text-xs text-emerald-500">保持</span>}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">{m.desc}</p>
                  {m.id !== "vocab" && d.totalQ > 0 && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 bg-zinc-100 rounded-full overflow-hidden max-w-[120px]">
                        <div className={cn("h-full rounded-full", d.pct >= 60 ? "bg-emerald-400" : "bg-red-400")}
                          style={{ width: `${Math.min(100, d.pct)}%` }} />
                      </div>
                      <span className={cn("text-xs font-medium", d.pct >= 60 ? "text-emerald-600" : "text-red-500")}>
                        正确率 {d.pct}%
                      </span>
                    </div>
                  )}
                  {m.id === "vocab" && (
                    <div className="mt-1.5">
                      <span className="text-xs text-zinc-500">
                        {vocabInfo ? `已学${vocabInfo.totalLearned || 0}词 · 掌握${vocabInfo.totalMastered || 0}词` : "尚未开始"}
                      </span>
                    </div>
                  )}
                </div>
                <button onClick={() => router.push(m.route)}
                  className={cn("btn-primary text-xs px-3 py-1.5 shrink-0 flex items-center gap-1", hasActivity && "btn-secondary")}>
                  {hasActivity ? "继续" : "开始"}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI 训练计划 */}
      {plan && (
        <div className="card border-primary-200 bg-primary-50/30 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-primary-700">今日训练计划</h3>
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
              {plan.level === "cet4" ? "CET-4" : "CET-6"} 目标{plan.targetScore}分
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-primary-600">{plan.estimatedCurrentScore !== null ? plan.estimatedCurrentScore : "—"}</p>
              <p className="text-[10px] text-zinc-400">{plan.estimatedCurrentScore !== null ? "当前估分" : "暂无估分"}</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-amber-600">{plan.targetScore}</p>
              <p className="text-[10px] text-zinc-400">目标分数</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <p className={`text-lg font-bold ${plan.scoreGap > 0 ? "text-red-500" : "text-emerald-500"}`}>
                {plan.scoreGap > 0 ? `-${plan.scoreGap}` : "+0"}
              </p>
              <p className="text-[10px] text-zinc-400">差距</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-primary-600">{plan.totalDailyMinutes}min</p>
              <p className="text-[10px] text-zinc-400">今日用时</p>
            </div>
          </div>
          <p className="text-xs text-zinc-600 mb-3">{plan.summary}</p>
          <div className="grid grid-cols-4 gap-1.5">
            {plan.dailyTargets.slice(0, 4).map((t) => (
              <button key={t.module} onClick={() => router.push(t.route)}
                className={`bg-white rounded-lg p-2 text-center hover:shadow transition-shadow ${
                  t.priority === "high" ? "border border-red-200" : "border border-zinc-100"
                }`}>
                <p className="text-xs">{t.icon} {t.label}</p>
                <p className={`text-lg font-bold ${t.priority === "high" ? "text-red-600" : "text-primary-600"}`}>
                  {t.dailyCount}<span className="text-[10px] font-normal">{t.unit}/天</span>
                </p>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5 mt-1.5">
            {plan.dailyTargets.slice(4).map((t) => (
              <button key={t.module} onClick={() => router.push(t.route)}
                className={`bg-white rounded-lg p-2 text-center hover:shadow transition-shadow ${
                  t.priority === "high" ? "border border-red-200" : "border border-zinc-100"
                }`}>
                <p className="text-xs">{t.icon} {t.label}</p>
                <p className={`text-base font-bold ${t.priority === "high" ? "text-red-600" : "text-primary-600"}`}>
                  {t.dailyCount}<span className="text-[10px] font-normal">{t.unit}/天</span>
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {totalDone === 0 && !plan && (
        <div className="card text-center py-12 mt-6">
          <CalendarCheck className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500">还没有今日学习记录</p>
          <p className="text-sm text-zinc-400">选择一个模块开始今天的训练吧</p>
        </div>
      )}
    </div>
  );
}
