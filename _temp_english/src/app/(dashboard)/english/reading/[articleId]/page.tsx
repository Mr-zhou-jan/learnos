"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, BookmarkCheck, Check, ChevronRight, Clock, Sparkles, X } from "lucide-react";
import { useEnglishStore } from "@/stores/english-store";

interface Article { id: string; title: string; difficulty: string; paragraphs: string[]; questions: any[]; }
interface Answer { questionId: string; selectedIndex: number; }

export default function ReadingDetailPage() {
  const { articleId } = useParams() as { articleId: string };
  const router = useRouter();
  const { addWord, addRecord, darkMode } = useEnglishStore();
  const [article, setArticle] = useState<Article | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [results, setResults] = useState<any[] | null>(null);
  const [showExplain, setShowExplain] = useState<any>(null);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [timer, setTimer] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const paraRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    fetch("/api/english/articles/" + articleId).then(r => r.json()).then(d => { setArticle(d); startTimer(); }).catch(() => {});
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [articleId]);

  const startTimer = () => { timerRef.current = setInterval(() => setTimer(t => t + 1), 1000); };
  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  const selectAnswer = async (idx: number) => {
    if (submitted || !article) return;
    const q = article.questions[currentQ];
    setAnswers(prev => [...prev.filter(a => a.questionId !== q.id), { questionId: q.id, selectedIndex: idx }]);

    // Get explanation with source info
    try {
      const r = await fetch("/api/english/reading/explain", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, questionId: q.id, selectedIndex: idx }),
      });
      const data = await r.json();
      setShowExplain(data);
      if (data.sourceIndex >= 0) setHighlightIndex(data.sourceIndex);
      // Scroll to highlighted paragraph
      setTimeout(() => {
        if (paraRefs.current[data.sourceIndex]) {
          paraRefs.current[data.sourceIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    } catch {}
  };

  const nextOrSubmit = async () => {
    if (!article) return;
    if (currentQ < article.questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setShowExplain(null);
      setHighlightIndex(-1);
    } else {
      stopTimer();
      try {
        const r = await fetch("/api/english/reading/submit", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleId, answers: answers.map(a => ({ questionId: a.questionId, selectedIndex: a.selectedIndex })) }),
        });
        const data = await r.json();
        setResults(data.results);
        setSubmitted(true);
        addRecord({
          id: crypto.randomUUID().slice(0, 8), articleId, articleTitle: article.title,
          score: data.score, totalQuestions: data.total, totalTime: timer, completedAt: new Date().toISOString(),
          answers: data.results.map((r2: any, i: number) => ({ questionId: r2.questionId, selected: answers[i]?.selectedIndex, correct: r2.correct, timeSpent: 0 })),
        });
      } catch {}
    }
  };

  const addToWordbook = (type: "word" | "sentence", content: string) => {
    addWord({ type, content, source: article?.title, translation: "", tags: [article?.difficulty || ""] });
  };

  const formatTime = (s: number) => { const m = Math.floor(s / 60); const sec = s % 60; return m + ":" + (sec < 10 ? "0" : "") + sec; };

  if (!article) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" /></div>;

  const q = article.questions[currentQ];
  const difficultyLabel: Record<string, string> = { cet4: "四级", cet6: "六级", postgraduate: "考研" };

  if (submitted && results) {
    const correct = results.filter((r: any) => r.correct).length;
    return (
      <div className="max-w-3xl mx-auto px-6 py-8 text-center">
        <div className="text-5xl mb-4">{correct === results.length ? "🎉" : correct > results.length/2 ? "👍" : "💪"}</div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">练习完成！</h2>
        <p className="text-zinc-500 mb-2">正确 {correct}/{results.length} 题 · 用时 {formatTime(timer)}</p>
        <div className="flex justify-center gap-3 mt-6">
          <button onClick={() => router.push("/english/reading")} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm">再做一篇</button>
          <button onClick={() => router.push("/english/history")} className="px-4 py-2 border rounded-lg text-sm dark:border-zinc-600">查看历史</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-900">
      {/* Left: Article */}
      <div className="flex-1 overflow-y-auto border-r border-zinc-200 dark:border-zinc-800 p-8">
        <button onClick={() => router.push("/english/reading")} className="text-sm text-zinc-500 hover:text-zinc-700 mb-4 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> 返回列表
        </button>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-medium">{difficultyLabel[article.difficulty]}</span>
          <span className="text-xs text-zinc-400">{article.paragraphs.length} 段</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">{article.title}</h1>
        {article.paragraphs.map((p, i) => (
          <p key={i} ref={el => { paraRefs.current[i] = el; }}
            className={"text-base leading-relaxed text-zinc-700 dark:text-zinc-300 mb-4 p-2 rounded-lg transition-all " + (highlightIndex === i ? "bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-400" : "")}>
            {p}
          </p>
        ))}
      </div>

      {/* Right: Questions */}
      <div className="w-[420px] flex flex-col bg-zinc-50 dark:bg-zinc-800/50">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">第 {currentQ + 1}/{article.questions.length} 题</span>
          <span className="flex items-center gap-1 text-sm text-zinc-500"><Clock className="w-4 h-4" />{formatTime(timer)}</span>
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="font-semibold text-zinc-900 dark:text-white mb-4">{q.questionText}</p>
          <div className="space-y-2">
            {q.options.map((o: string, i: number) => {
              const isSelected = answers.find(a => a.questionId === q.id)?.selectedIndex === i;
              const isCorrect = showExplain?.correct && i === showExplain.correctIndex;
              let style = "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 bg-white dark:bg-zinc-800";
              if (showExplain) {
                if (isCorrect) style = "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20";
                else if (isSelected) style = "border-red-500 bg-red-50 dark:bg-red-900/20";
              } else if (isSelected) style = "border-primary-500 bg-primary-50 dark:bg-primary-900/20";
              return (
                <button key={i} onClick={() => selectAnswer(i)} className={"w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all " + style}>
                  <span className={"w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 " + (isSelected ? (showExplain ? (isCorrect ? "bg-emerald-500 text-white" : "bg-red-500 text-white") : "bg-primary-500 text-white") : "bg-zinc-100 text-zinc-500 dark:bg-zinc-700")}>{String.fromCharCode(65 + i)}</span>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{o.replace(/^[A-D]\.\s*/, "")}</span>
                  {showExplain && isCorrect && <Check className="w-5 h-5 text-emerald-500 ml-auto shrink-0" />}
                  {showExplain && isSelected && !isCorrect && <X className="w-5 h-5 text-red-500 ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplain && (
            <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">{showExplain.correct ? "✅ 正确" : "❌ 错误"}</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">{showExplain.explanation}</p>
              {showExplain.sourceText && (
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                  <span className="font-medium">📍 出处（第{showExplain.sourceIndex + 1}段）：</span>"{showExplain.sourceText}"
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <button onClick={() => addToWordbook("sentence", showExplain.sourceText || "")} className="text-xs flex items-center gap-1 px-2 py-1 bg-white dark:bg-zinc-800 rounded border dark:border-zinc-600 hover:border-primary-300">
                  <Bookmark className="w-3 h-3" /> 收藏句子
                </button>
                <button onClick={() => {/* TODO: sentences API */}} className="text-xs flex items-center gap-1 px-2 py-1 bg-white dark:bg-zinc-800 rounded border dark:border-zinc-600 hover:border-primary-300">
                  <Sparkles className="w-3 h-3" /> 长难句拆解
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom: Next/Submit */}
        {showExplain && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-700">
            <button onClick={nextOrSubmit} className="w-full py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 font-medium flex items-center justify-center gap-2">
              {currentQ < article.questions.length - 1 ? <>下一题 <ChevronRight className="w-4 h-4" /></> : "提交全部答案"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
