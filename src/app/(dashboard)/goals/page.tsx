"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, GraduationCap, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getScoreTarget } from "@/lib/use-training-memory";

export default function GoalsPage() {
  const router = useRouter();
  const [quizResult, setQuizResult] = useState<any>(null);
  const [userState, setUserState] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("learnos_user_state");
    if (!saved) { router.push("/"); return; }
    setUserState(JSON.parse(saved));
    const quiz = localStorage.getItem("learnos_quiz_results");
    if (quiz) setQuizResult(JSON.parse(quiz));
  }, []);

  if (!quizResult) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">学习目标</h1>
        <div className="card text-center py-12">
          <Brain className="w-12 h-12 text-zinc-300 mx-auto mb-3"/>
          <p className="text-zinc-500">请先完成诊断测验</p>
          <button onClick={()=>router.push("/")} className="btn-primary mt-4">去诊断</button>
        </div>
      </div>
    );
  }

  const weakNodes = (quizResult.nodeScores||[]).filter((n:any)=>n.score<50);
  const strongNodes = (quizResult.nodeScores||[]).filter((n:any)=>n.score>=80);
  const totalScore = quizResult.totalQuestions>0 ? Math.round((quizResult.totalCorrect/quizResult.totalQuestions)*100) : 0;

  const st = getScoreTarget();
  const scoreGoals: any[] = [];
  if (st) {
    const moduleInfo = [
      { key: "listening", label: "听力训练", val: st.selfAssessment.listening, route: "/english/listening", target: Math.round(st.targetScore * 0.35) },
      { key: "reading", label: "阅读训练", val: st.selfAssessment.reading, route: "/english/reading", target: Math.round(st.targetScore * 0.35) },
      { key: "writingTranslation", label: "写作翻译", val: st.selfAssessment.writingTranslation, route: "/english/writing", target: Math.round(st.targetScore * 0.30) },
    ];
    const weak = moduleInfo.filter(m => m.val <= 2);
    const strong = moduleInfo.filter(m => m.val >= 4);
    scoreGoals.push({
      title: `🎯 目标：${st.level === "cet4" ? "四级" : "六级"} ${st.targetScore} 分`,
      target: `${st.targetScore}/710`,
      detail: weak.length > 0
        ? `重点攻克：${weak.map(m => m.label).join("、")}（自评较弱）`
        : `均衡发展各模块，保持练习节奏`,
      priority: "high",
    });
    if (weak.length > 0) {
      scoreGoals.push({
        title: "⚡ 优先攻克弱项",
        target: `${weak.length} 个模块需加强`,
        detail: weak.map(m => `${m.label}（自评${m.val}/5）→ 目标约${m.target}分`).join(" · "),
        priority: "high",
      });
    }
    if (strong.length > 0) {
      scoreGoals.push({
        title: "🔰 保持优势模块",
        target: `${strong.length} 个模块已较强`,
        detail: strong.map(m => `${m.label}（自评${m.val}/5）→ 保持练习`).join(" · "),
        priority: "medium",
      });
    }
  }

  // Auto-generated goals (诊断结果)
  const goals = [
    ...scoreGoals,
    { title: "攻克薄弱点", target: `${weakNodes.length} 个知识点需提升`, detail: weakNodes.map((n:any)=>n.title).join("、") || "无", priority: "high" },
    { title: "巩固已掌握", target: `${strongNodes.length} 个已掌握`, detail: "保持复习频率，防止遗忘", priority: "medium" },
    { title: "总体目标", target: `诊断得分从 ${totalScore} 提升到 ${Math.min(100,totalScore+20)}`, detail: "继续完成每日训练计划", priority: "low" },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">学习目标</h1>
      <p className="text-zinc-500 mb-6">根据诊断结果自动生成</p>
      <div className="space-y-4">
        {goals.map((g,i)=>(
          <div key={i} className={cn("card",g.priority==="high"?"border-red-200 bg-red-50/50":g.priority==="medium"?"border-amber-200 bg-amber-50/50":"border-emerald-200 bg-emerald-50/50")}>
            <div className="flex items-center gap-3 mb-2">
              <Target className={cn("w-5 h-5",g.priority==="high"?"text-red-600":g.priority==="medium"?"text-amber-600":"text-emerald-600")}/>
              <h3 className="font-semibold">{g.title}</h3>
              <span className={cn("badge",g.priority==="high"?"badge-danger":g.priority==="medium"?"badge-warning":"badge-success")}>{g.target}</span>
            </div>
            <p className="text-sm text-zinc-600 ml-8">{g.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
