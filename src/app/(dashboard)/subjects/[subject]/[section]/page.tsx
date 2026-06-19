"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, ChevronRight, CheckCircle2, AlertCircle, Lightbulb, BookOpen, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

type Stage = "concept" | "example" | "similar" | "variation" | "test" | "done";
const STAGES: Stage[] = ["concept", "example", "similar", "variation", "test", "done"];
const LABELS: Record<Stage, string> = { concept: "概念速览", example: "例题精讲", similar: "同类练习", variation: "变式挑战", test: "章节测试", done: "完成" };
const COUNTS: Record<Stage, number> = { concept: 1, example: 1, similar: 3, variation: 2, test: 4, done: 0 };

export default function SectionPage() {
  const { subject, section } = useParams() as { subject: string; section: string };
  const router = useRouter();
  const ds = decodeURIComponent(subject);
  const dsec = decodeURIComponent(section);
  const [stage, setStage] = useState<Stage>("concept");
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState("");

  const loadStage = useCallback(async (s: Stage) => {
    setLoading(true); setError(""); setAnswers({}); setSubmitted(false);
    try {
      const r = await fetch("/api/subjects/section", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: ds, section: dsec, stage: s, count: COUNTS[s] || 1 }) });
      const d = await r.json();
      if (d.success) setContent(d.data); else setError(d.error || "加载失败");
    } catch { setError("网络错误"); }
    setLoading(false);
  }, [ds, dsec]);

  useEffect(() => { loadStage(stage); }, [stage, loadStage]);

  const handleNext = () => {
    const idx = STAGES.indexOf(stage);
    if (idx < STAGES.length - 1) setStage(STAGES[idx + 1]);
    else {
      try {
        const key = `learnos_progress_${ds}`;
        const saved = JSON.parse(localStorage.getItem(key) || "{}");
        const pct = Math.round((score / 4) * 100);
        saved[dsec] = Math.max(saved[dsec] || 0, pct);
        localStorage.setItem(key, JSON.stringify(saved));
      } catch {}
    }
  };

  if (loading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-3"/><p className="text-zinc-500">AI 正在生成{LABELS[stage]}内容…</p></div>;
  if (error) return <div className="p-12 text-center"><AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3"/><p className="text-red-500">{error}</p><button onClick={() => loadStage(stage)} className="btn-primary mt-4">重试</button></div>;
  if (!content) return null;

  const sIdx = STAGES.indexOf(stage);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => router.push(`/subjects/${encodeURIComponent(ds)}`)} className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1"><ArrowLeft className="w-4 h-4"/>返回</button>
        <span className="text-xs text-zinc-400">{dsec}</span>
      </div>

      <div className="flex gap-1 mb-6">
        {STAGES.slice(0, -1).map((s, i) => <div key={s} className={cn("flex-1 h-1.5 rounded-full transition-colors", i < sIdx ? "bg-emerald-500" : i === sIdx ? "bg-primary-500 animate-pulse" : "bg-zinc-200")}/>)}
      </div>

      <div className="flex items-center gap-2 mb-6"><span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">阶段 {sIdx + 1}/5</span><span className="text-sm font-semibold text-zinc-700">{LABELS[stage]}</span></div>

      {stage === "concept" && (
        <div className="card-glass p-6 animate-fade-in">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-amber-500"/>{dsec} · 核心概念</h2>
          <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{content.text}</div>
          <button onClick={() => setStage("example")} className="btn-primary w-full mt-6 py-3">继续 · 看例题 <ChevronRight className="w-4 h-4"/></button>
        </div>
      )}

      {stage === "example" && (
        <div className="card-glass p-6 animate-fade-in">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-500"/>例题精讲</h2>
          <div className="bg-blue-50 rounded-xl p-4 mb-4"><p className="font-bold text-blue-800 mb-1">📝 题目</p><p className="text-sm text-blue-900">{content.question}</p></div>
          <div className="bg-emerald-50 rounded-xl p-4"><p className="font-bold text-emerald-800 mb-1">✅ 详细解答</p><p className="text-sm text-emerald-900 whitespace-pre-wrap leading-relaxed">{content.solution}</p></div>
          <button onClick={() => setStage("similar")} className="btn-primary w-full mt-6 py-3">懂了 · 开始练习 <ChevronRight className="w-4 h-4"/></button>
        </div>
      )}

      {(stage === "similar" || stage === "variation" || stage === "test") && (
        <div className="animate-fade-in space-y-6" key={stage}>
          <h2 className="font-bold text-lg flex items-center gap-2"><PenLine className="w-5 h-5 text-primary-500"/>{LABELS[stage]} ({content.questions?.length || 0}题)</h2>
          {content.questions?.map((q: any, i: number) => {
            const sel = answers[i]; const correct = submitted ? sel === q.correctIndex : null;
            return (
              <div key={i} className="card-glass p-5">
                <p className="font-bold text-sm mb-1">第{i + 1}题</p>
                <p className="text-sm text-zinc-700 mb-4">{q.question}</p>
                <div className="space-y-2 mb-3">
                  {q.options?.map((o: string, j: number) => {
                    const L = String.fromCharCode(65 + j);
                    return (
                      <button key={j} onClick={() => { if (!submitted) setAnswers(p => ({ ...p, [i]: j })); }} disabled={submitted}
                        className={cn("w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all",
                          submitted ? (j === q.correctIndex ? "border-emerald-400 bg-emerald-50" : sel === j ? "border-red-400 bg-red-50" : "border-zinc-100 opacity-50")
                          : sel === j ? "border-primary-400 bg-primary-50" : "border-zinc-100 hover:border-zinc-300")}>
                        <span className="font-bold mr-2">{L}.</span>{o.replace(/^[A-D][.\s]+/, "")}
                        {submitted && j === q.correctIndex && <CheckCircle2 className="w-4 h-4 text-emerald-500 inline ml-2"/>}
                      </button>
                    );
                  })}
                </div>
                {submitted && q.explanation && (
                  <div className={cn("p-4 rounded-xl text-sm", correct ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800")}>
                    <p className="font-bold mb-1">{correct ? "✅ 正确" : "❌ 错误"}</p>
                    <p className="whitespace-pre-wrap">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
          {!submitted ? (
            <button onClick={() => { setSubmitted(true); const c = content.questions?.filter((q: any, i: number) => answers[i] === q.correctIndex).length || 0; setScore(c); }}
              disabled={Object.keys(answers).length < (content.questions?.length || 0)} className="btn-primary w-full py-3">提交</button>
          ) : (
            <div className="space-y-3">
              <div className={cn("rounded-2xl p-4 text-center", stage === "test" ? (score >= 3 ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800") : "bg-zinc-50 text-zinc-700")}>
                <p className="text-lg font-bold">{score}/{content.questions?.length} 正确</p>
                {stage === "test" && <p className="text-sm mt-1">{score >= 3 ? "🎉 本章过关！" : "需加强，建议回顾错题后重测"}</p>}
              </div>
              {stage === "test" && score < 3 ? (
                <button onClick={() => { loadStage("test"); }} className="btn-secondary w-full py-3">重新测试</button>
              ) : (
                <button onClick={handleNext} className="btn-primary w-full py-3">{stage === "test" ? "完成本章" : "继续"} <ChevronRight className="w-4 h-4"/></button>
              )}
            </div>
          )}
        </div>
      )}

      {stage === "done" && (
        <div className="card-glass p-8 text-center animate-bounce-in">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4"><CheckCircle2 className="w-8 h-8 text-emerald-500"/></div>
          <h2 className="text-2xl font-bold mb-2">章节完成</h2>
          <p className="text-zinc-500 mb-6">「{dsec}」已掌握</p>
          <button onClick={() => router.push(`/subjects/${encodeURIComponent(ds)}`)} className="btn-primary px-6 py-3">返回章节列表</button>
        </div>
      )}
    </div>
  );
}
