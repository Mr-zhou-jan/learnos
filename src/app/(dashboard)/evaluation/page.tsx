"use client";
import { useState, useEffect } from "react";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { getModuleStats, getScoreTarget } from "@/lib/use-training-memory";
import { loadProgress } from "@/lib/vocab-scheduler";

const MODS = [
  { id: "reading", label: "阅读理解", icon: "📖" },
  { id: "listening", label: "听力训练", icon: "🎧" },
  { id: "writing", label: "作文批改", icon: "✍️" },
  { id: "translation", label: "翻译训练", icon: "🌐" },
  { id: "matching", label: "段落匹配", icon: "🔗" },
  { id: "cloze", label: "选词填空", icon: "📝" },
  { id: "vocab", label: "词汇语法", icon: "📚" },
];

export default function EvaluationPage() {
  const [scores, setScores] = useState<any[]>([]);
  const [overall, setOverall] = useState(0);
  const [scoreTarget, setScoreTarget] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setScoreTarget(getScoreTarget());
    const r: any[] = [];
    let ts = 0, tw = 0;

    for (const m of MODS) {
      if (m.id === "vocab") {
        const p4 = loadProgress("cet4"), p6 = loadProgress("cet6");
        const learned = (p4.totalLearned||0)+(p6.totalLearned||0);
        const mastered = (p4.totalMastered||0)+(p6.totalMastered||0);
        const pct = learned>0?Math.round(mastered/learned*100):50;
        r.push({name:m.label,icon:m.icon,score:pct,detail:`已学${learned}词·掌握${mastered}词`,color:pct>=60?"emerald":pct>=30?"amber":"red"});
        ts+=pct;tw++;
      } else {
        const s = getModuleStats(m.id);
        const pct = s.total>0?s.recentPct:50;
        r.push({name:m.label,icon:m.icon,score:pct,detail:`共${s.total}题·最近正确率${s.recentPct}%`,color:pct>=60?"emerald":pct>=30?"amber":"red"});
        ts+=pct;tw++;
      }
    }

    // 诊断结果
    try {
      const quiz = JSON.parse(localStorage.getItem("learnos_quiz_results")||"{}");
      for (const n of (quiz.nodeScores||[])) {
        r.push({name:n.title||"诊断项",icon:"🎯",score:n.score||50,detail:"诊断得分",color:(n.score||50)>=60?"emerald":(n.score||50)>=30?"amber":"red"});
        ts+=(n.score||50);tw++;
      }
    } catch {}

    setScores(r);
    setOverall(tw>0?Math.round(ts/tw):0);
    setLoading(false);
  }, []);

  if (loading) return <div className="p-12 text-center"><div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"/></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><GraduationCap className="w-7 h-7 text-primary-500"/><div><h1 className="text-2xl font-bold">📊 掌握度评估</h1><p className="text-zinc-500">基于做题数据+诊断结果</p></div></div>
        {scoreTarget && <span className="badge badge-primary text-sm">{scoreTarget.level==="cet4"?"四级":"六级"}目标 {scoreTarget.targetScore}分</span>}
      </div>
      <div className="card mb-6 p-6 text-center bg-gradient-to-r from-primary-50 to-indigo-50">
        <p className="text-sm text-zinc-500 mb-1">综合掌握度</p>
        <p className={cn("text-5xl font-bold",overall>=60?"text-emerald-600":overall>=30?"text-amber-600":"text-red-600")}>{overall}%</p>
        <div className="w-full bg-zinc-200 rounded-full h-3 mt-3"><div className={cn("h-3 rounded-full",overall>=60?"bg-emerald-500":overall>=30?"bg-amber-500":"bg-red-500")} style={{width:`${overall}%`}}/></div>
      </div>
      <div className="space-y-3">{scores.map((s,i)=>(<div key={i} className="card p-4"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="text-xl">{s.icon}</span><h3 className="font-semibold text-sm">{s.name}</h3></div><span className={cn("text-xl font-bold",s.color==="emerald"?"text-emerald-600":s.color==="amber"?"text-amber-600":"text-red-600")}>{s.score}%</span></div><p className="text-xs text-zinc-400 mb-2">{s.detail}</p><div className="w-full bg-zinc-100 rounded-full h-2"><div className={cn("h-2 rounded-full",s.color==="emerald"?"bg-emerald-500":s.color==="amber"?"bg-amber-500":"bg-red-500")} style={{width:`${s.score}%`}}/></div></div>))}</div>
    </div>
  );
}
