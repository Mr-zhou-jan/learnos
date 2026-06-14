"use client";
import { useEffect, useState } from "react";
import { BarChart3, BookOpen, Brain, Briefcase, Bug, Code, FileText, Image, Layout, PenLine, TrendingUp, Zap } from "lucide-react";
import { recommendMethods, type SubjectCategory } from "@/lib/engine/learning-methods";

const MODES = [
  { id:"feynman", icon: PenLine, title:"费曼训练室", desc:"AI讲解→你复述→AI评分→强化", color:"bg-primary-50 text-primary-600", href:"/feynman" },
  { id:"recall", icon: Brain, title:"主动回忆", desc:"不看笔记，解释刚学的内容", color:"bg-amber-50 text-amber-600" },
  { id:"compress", icon: FileText, title:"知识压缩", desc:"1000字→300字→100字→一句话", color:"bg-purple-50 text-purple-600" },
  { id:"reverse", icon: BarChart3, title:"反向出题", desc:"你来出题考AI，加深理解", color:"bg-emerald-50 text-emerald-600" },
  { id:"arena", icon: Zap, title:"AI格斗场", desc:"AI连续追问直到暴露知识漏洞", color:"bg-red-50 text-red-600" },
];

const METHOD_ICONS: Record<string, any> = {
  "vocab-drill": Image,
  "grammar-drill": FileText,
  "reading-visual": BookOpen,
  "code-build": Code,
  "debug-challenge": Bug,
  "feynman-plus": PenLine,
  "diagram-analysis": Layout,
  "case-feynman": Briefcase,
  "scenario-sim": TrendingUp,
  "active-recall": Brain,
  compress: FileText,
};

export default function TrainingPage() {
  const [plan, setPlan] = useState<any>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("learnos_current_plan");
      if (raw) setPlan(JSON.parse(raw));
    } catch {}
  }, []);

  const category = (plan?.subjectCategory || "general") as SubjectCategory;
  const methods = plan?.recommendedMethods?.length
    ? plan.recommendedMethods
    : recommendMethods(category, 4).map((m) => ({ id: m.id, name: m.name, reason: m.description }));
  const today = plan?.weeklyPlan?.[0];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-zinc-500">{plan?.courseName ? `${plan.courseName} · ${category}` : "按学科自动匹配训练方法"}</p>
        <h1 className="text-2xl font-bold">训练中心</h1>
      </div>

      {today?.tasks?.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold">今日 AI 训练路径</h2>
              <p className="text-sm text-zinc-500">{today.focus}</p>
            </div>
            <span className="badge badge-primary">Day {today.day}</span>
          </div>
          <div className="space-y-3">
            {today.tasks.map((task:any, index:number) => (
              <div key={`${task.title}-${index}`} className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-zinc-100 flex items-center justify-center text-sm font-bold text-primary-600">{index + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{task.title}</p>
                  <p className="text-xs text-zinc-500 truncate">{task.description}</p>
                </div>
                <span className="text-xs text-zinc-400">{task.durationMin}min</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-base font-bold mb-3">推荐训练法</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {methods.map((method:any) => {
          const Icon = METHOD_ICONS[method.id] || Brain;
          return (
            <button key={method.id} className="card-hover flex items-start gap-4 p-5 text-left">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-primary-50 text-primary-600"><Icon className="w-6 h-6" /></div>
              <div>
                <h3 className="font-semibold">{method.name}</h3>
                <p className="text-sm text-zinc-500 mt-1">{method.reason}</p>
              </div>
            </button>
          );
        })}
      </div>

      <h2 className="text-base font-bold mb-3">通用训练工具</h2>
      <div className="grid grid-cols-2 gap-4">
        {MODES.map(m => (
          <button key={m.id} className="card-hover flex items-start gap-4 p-5 text-left">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${m.color}`}><m.icon className="w-6 h-6" /></div>
            <div>
              <h3 className="font-semibold">{m.title}</h3>
              <p className="text-sm text-zinc-500 mt-1">{m.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
