"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Brain, CalendarCheck, Loader2 } from "lucide-react";

function PlanContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const name = sp.get("name") || "课程";
  const [quizResult, setQuizResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qr = localStorage.getItem("learnos_quiz_results");
    if (!qr) { router.push("/"); return; }
    setQuizResult(JSON.parse(qr));
    setLoading(false);
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

  if (!quizResult) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-zinc-500">诊断结果未找到</p>
    </div>
  );

  const totalCorrect = quizResult.totalCorrect || 0;
  const totalQuestions = quizResult.totalQuestions || 0;
  const score = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const nodeScores: any[] = quizResult.nodeScores || [];
  const weakAreas = nodeScores.filter((n: any) => n.score < 50);
  const strongAreas = nodeScores.filter((n: any) => n.score >= 70);

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-in">
        {/* 得分 */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-8 text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-100 flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">诊断完成！</h1>
          <p className="text-zinc-500 mb-6">「{name}」能力评估</p>
          <div className="w-32 h-32 mx-auto mb-4 rounded-full border-8 border-primary-100 flex items-center justify-center">
            <div>
              <span className="text-3xl font-extrabold text-primary-600">{score}</span>
              <span className="text-sm text-zinc-400">/100</span>
            </div>
          </div>
          <p className="text-sm text-zinc-500">答对 {totalCorrect}/{totalQuestions} 题</p>
        </div>

        {/* 强弱项 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {weakAreas.length > 0 && (
            <div className="card border-red-100 bg-red-50/30">
              <p className="text-xs font-bold text-red-500 mb-2">⚠️ 需要加强</p>
              {weakAreas.slice(0, 3).map((n: any) => (
                <div key={n.nodeId} className="flex justify-between text-xs mb-1">
                  <span className="text-red-700 truncate max-w-[100px]">{n.title}</span>
                  <span className="text-red-500 font-bold">{n.score}%</span>
                </div>
              ))}
            </div>
          )}
          {strongAreas.length > 0 && (
            <div className="card border-emerald-100 bg-emerald-50/30">
              <p className="text-xs font-bold text-emerald-500 mb-2">✅ 掌握较好</p>
              {strongAreas.slice(0, 3).map((n: any) => (
                <div key={n.nodeId} className="flex justify-between text-xs mb-1">
                  <span className="text-emerald-700 truncate max-w-[100px]">{n.title}</span>
                  <span className="text-emerald-500 font-bold">{n.score}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 引导按钮 */}
        <button onClick={() => router.push("/today")}
          className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 mb-3">
          <CalendarCheck className="w-5 h-5" /> 进入今日学习路径
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-xs text-zinc-400 text-center">
          已根据诊断结果生成个性化学习计划，按步骤完成即可
        </p>
      </div>
    </div>
  );
}

export default () => (
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
    <PlanContent />
  </Suspense>
);
