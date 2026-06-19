"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Brain, ChevronRight, GraduationCap, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllCourses, getKnowledgeTree, getNodeCount, type CourseData, type KnowledgeNode } from "@/lib/knowledge-loader";
import { getScoreTarget, type ScoreTargetData } from "@/lib/use-training-memory";
import { computeTrainingPlan } from "@/lib/training-plan";
import { getStreak, checkIn, isCheckedInToday } from "@/lib/checkin-store";

export default function CockpitPage() {
  const [streak, setStreak] = useState(getStreak());
  const router = useRouter();
  const [userState, setUserState] = useState<any>(null);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [scoreTarget, setScoreTarget] = useState<ScoreTargetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("learnos_user_state");
    if (!saved) { router.push("/"); return; }
    setUserState(JSON.parse(saved));
    const quiz = localStorage.getItem("learnos_quiz_results");
    if (quiz) setQuizResult(JSON.parse(quiz));
    setScoreTarget(getScoreTarget());
    setIsLoading(false);
  }, []);

  if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"/></div>;
  if (!userState) return null;

  const hasQuiz = !!quizResult;
  const totalQ = hasQuiz ? quizResult.totalQuestions : 0;
  const correctQ = hasQuiz ? quizResult.totalCorrect : 0;
  const score = hasQuiz && totalQ > 0 ? Math.round((correctQ/totalQ)*100) : 0;
  const weakNodes = hasQuiz ? (quizResult.nodeScores||[]).filter((n:any)=>n.score<50) : [];
  const strongNodes = hasQuiz ? (quizResult.nodeScores||[]).filter((n:any)=>n.score>=80) : [];

  // Build recommended courses from quiz results
  const weakCourseMap: Record<string,{score:number,total:number,title:string}> = {};
  if (hasQuiz) {
    for (const ns of quizResult.nodeScores||[]) {
      if (!weakCourseMap[ns.nodeId]) weakCourseMap[ns.nodeId] = {score:0,total:0,title:ns.title};
      weakCourseMap[ns.nodeId].score += ns.score;
      weakCourseMap[ns.nodeId].total++;
    }
  }
  const sortedCourses = Object.entries(weakCourseMap)
    .map(([id,d])=>({id,title:d.title,score:Math.round(d.score/d.total)}))
    .sort((a,b)=>a.score-b.score);

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">🖥️ 学习驾驶舱</h1><p className="text-zinc-500 mt-1">{userState.selectedCourseNames?.[0]||"课程"} 进行中</p></div>
        <div className="flex items-center gap-3">
          {!isCheckedInToday() ? (
            <button onClick={() => setStreak(checkIn())} className="btn-primary text-sm px-4 py-2 animate-bounce-in">
              🔥 今日打卡
            </button>
          ) : (
            <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              🔥 已打卡 · 连续 {streak.current} 天
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={()=>router.push("/")} className="btn-secondary text-sm px-3 py-2">选择学科</button>
          <button onClick={()=>{localStorage.removeItem("learnos_quiz_results");localStorage.removeItem("learnos_diagnosed");router.push("/");}} className="btn-outline text-sm">重新诊断</button>
          {hasQuiz && <span className="badge badge-primary text-sm font-semibold">诊断 {score} 分</span>}
        </div>
      </div>

      {!hasQuiz ? (
        <div className="card border-amber-200 bg-amber-50 flex items-center justify-between">
          <div><p className="font-semibold text-amber-800">尚未诊断</p><p className="text-sm text-amber-600">完成测验获取学习建议</p></div>
          <button onClick={()=>router.push(`/quiz?courses=${userState.selectedCourses.join(",")}`)} className="btn-primary">开始诊断</button>
        </div>
      ) : (
        <>
          {/* 未设置分数目标提醒 */}
          {!scoreTarget && (
            <div className="card border-amber-300 bg-amber-50/60 flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="font-semibold text-amber-800">尚未设置分数目标</p>
                  <p className="text-sm text-amber-600">设置目标分数后，AI 才能制定个性化训练计划</p>
                </div>
              </div>
              <button onClick={() => router.push("/score-target")} className="btn-primary text-sm">
                设置目标 →
              </button>
            </div>
          )}

          {/* 分数目标卡片 + 训练计划 */}
          {scoreTarget && (() => {
            const plan = computeTrainingPlan();
            return (
              <div className="card border-primary-200 bg-primary-50/30 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-8 h-8 text-primary-500" />
                    <div>
                      <p className="font-bold text-primary-700">{scoreTarget.level === "cet4" ? "CET-4" : "CET-6"} 目标：{scoreTarget.targetScore}/710</p>
                      <p className="text-xs text-zinc-500">
                        弱项：{[{k:"听力",v:scoreTarget.selfAssessment.listening},{k:"阅读",v:scoreTarget.selfAssessment.reading},{k:"写作翻译",v:scoreTarget.selfAssessment.writingTranslation}]
                          .filter(m=>m.v<=2).map(m=>m.k).join("、") || "无"} ·
                        强项：{[{k:"听力",v:scoreTarget.selfAssessment.listening},{k:"阅读",v:scoreTarget.selfAssessment.reading},{k:"写作翻译",v:scoreTarget.selfAssessment.writingTranslation}]
                          .filter(m=>m.v>=4).map(m=>m.k).join("、") || "无"}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => router.push("/score-target")} className="btn-secondary text-xs">调整目标</button>
                </div>
                {plan && (
                  <>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="bg-white rounded-lg p-2 text-center">
                        <p className="text-sm font-bold text-primary-600">{plan.estimatedCurrentScore !== null ? plan.estimatedCurrentScore : "—"}</p>
                        <p className="text-[10px] text-zinc-400">{plan.estimatedCurrentScore !== null ? "当前估分" : "暂无估分"}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center">
                        <p className={`text-sm font-bold ${plan.scoreGap > 0 ? "text-red-500" : "text-emerald-500"}`}>
                          {plan.scoreGap > 0 ? `差 ${plan.scoreGap}` : "已达"}
                        </p>
                        <p className="text-[10px] text-zinc-400">距目标</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center">
                        <p className="text-sm font-bold text-primary-600">~{plan.totalDailyMinutes}min/天</p>
                        <p className="text-[10px] text-zinc-400">预计用时</p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-600">{plan.summary}</p>
                  </>
                )}
              </div>
            );
          })()}
          <div className="grid grid-cols-3 gap-4">
            <div className="card"><p className="text-sm text-zinc-500">诊断得分</p><p className={cn("text-3xl font-bold",score>=80?"text-emerald-600":score>=50?"text-amber-600":"text-red-600")}>{score}/100</p><p className="text-xs text-zinc-400">正确 {correctQ}/{totalQ}</p></div>
            <div className="card"><p className="text-sm text-zinc-500">薄弱环节</p><p className="text-3xl font-bold text-red-600">{weakNodes.length}个</p><p className="text-xs text-zinc-400">{strongNodes.length} 个已掌握</p></div>
            <div className="card"><p className="text-sm text-zinc-500">待学习</p><p className="text-3xl font-bold text-primary-600">{sortedCourses.length}项</p><p className="text-xs text-zinc-400">按掌握度排列</p></div>
          </div>

          {sortedCourses.length>0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">诊断结果 · 我的课程</h2>
              <div className="space-y-2">
                {sortedCourses.map((c,i)=>(
                  <button key={i} onClick={()=>router.push(`/feynman?nodeId=${c.id}&title=${encodeURIComponent(c.title)}`)}
                    className={cn("w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left hover:shadow-sm",
                      c.score<50?"bg-red-50 border-red-200":c.score<80?"bg-amber-50 border-amber-200":"bg-emerald-50 border-emerald-200")}>
                    <Zap className={cn("w-5 h-5 shrink-0",c.score<50?"text-red-600":c.score<80?"text-amber-600":"text-emerald-600")}/>
                    <div className="flex-1"><span className="font-medium text-sm">{c.title}</span><p className="text-xs opacity-60">掌握度 {c.score}%</p></div>
                    <span className="text-sm font-bold">{c.score}分</span>
                    <ChevronRight className="w-4 h-4 opacity-40 shrink-0"/>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
