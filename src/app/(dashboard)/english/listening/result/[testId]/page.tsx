"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import ListeningAnswerCard from "@/components/english/ListeningAnswerCard";
import type { ListeningTestData, ListeningQuestionData } from "@/data/listening-sets";
import { loadTrainingState } from "@/lib/training-memory";

interface ResultData {
  testId: string; level: string; title: string;
  answers: Record<string, number>; score: number; total: number; date: string;
}

export default function ListeningResultPage() {
  const router = useRouter();

  const [test, setTest] = useState<ListeningTestData | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => {
    const rawTest = sessionStorage.getItem("learnos_listening_test");
    const rawResult = sessionStorage.getItem("learnos_listening_result");
    if (rawResult) { try { setResult(JSON.parse(rawResult)); } catch {} }
    if (rawTest) { try { setTest(JSON.parse(rawTest)); } catch {} }
    // 回退：从 localStorage 记忆系统恢复（切页后 sessionStorage 可能丢失）
    if ((!rawTest || !rawResult) && !test && !result) {
      const saved = loadTrainingState("listening");
      if (saved?.answers?.testData) {
        setTest(saved.answers.testData);
        const userAnswers = saved.answers.userAnswers || {};
        const td = saved.answers.testData;
        let score = 0;
        for (const sec of (td.sections || [])) {
          for (const q of (sec.questions || [])) {
            if (userAnswers[q.id] === q.correctIndex) score++;
          }
        }
        setResult({
          testId: td.id, level: td.level, title: td.title,
          answers: userAnswers, score, total: td.totalQuestions,
          date: saved.updatedAt || new Date().toISOString(),
        });
      }
    }
  }, []);

  if (!result) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin mx-auto" />
      </div>
    );
  }

  const score = result.score;
  const total = result.total;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const scoreLabel = pct >= 80 ? "优秀" : pct >= 60 ? "良好" : pct >= 40 ? "一般" : "需要加油";
  const scoreColor = pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-red-500";

  // Section 统计
  const sectionStats = test?.sections.map((sec) => {
    let correct = 0;
    for (const q of sec.questions) {
      if (result.answers[q.id] === q.correctIndex) correct++;
    }
    return { id: sec.id, title: sec.title, correct, total: sec.questions.length };
  }) || [];

  // 展平所有题目
  const allQuestions: { sectionTitle: string; question: ListeningQuestionData }[] = [];
  if (test) {
    for (const sec of test.sections) {
      for (const q of sec.questions) {
        allQuestions.push({ sectionTitle: sec.title, question: q });
      }
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => router.push("/english/listening")} className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>
        <p className="text-sm font-bold">{result.title}</p>
        <button onClick={() => router.push("/english/listening")} className="btn-secondary text-xs flex items-center gap-1">
          <RotateCcw className="w-3 h-3" /> 再来一套
        </button>
      </header>

      <div className="max-w-3xl mx-auto p-6">
        {/* 成绩卡片 */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-8 text-center mb-6">
          <Trophy className="w-14 h-14 text-amber-400 mx-auto mb-3" />
          <h2 className="text-2xl font-bold mb-1">听力成绩</h2>
          <div className="mt-4">
            <span className={`text-6xl font-extrabold ${scoreColor}`}>{score}</span>
            <span className="text-zinc-300 text-2xl ml-1">/{total}</span>
          </div>
          <p className={`text-lg font-bold mt-2 ${scoreColor}`}>{scoreLabel}</p>
          <p className="text-xs text-zinc-400 mt-1">
            {result.level === "cet4" ? "CET-4" : "CET-6"} · {new Date(result.date).toLocaleString("zh-CN")}
          </p>

          {sectionStats.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-6">
              {sectionStats.map((s) => (
                <div key={s.id} className="p-3 rounded-xl bg-zinc-50">
                  <p className="text-xs text-zinc-500 mb-1">Section {s.id}</p>
                  <p className={`font-bold ${s.correct === s.total ? "text-emerald-600" : s.correct === 0 ? "text-red-500" : "text-amber-600"}`}>
                    {s.correct}/{s.total}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 逐题解析 */}
        <h2 className="font-bold text-lg mb-4">逐题解析</h2>
        <div className="space-y-3">
          {allQuestions.map(({ sectionTitle, question }) => (
            <ListeningAnswerCard
              key={question.id}
              question={question}
              userAnswer={result.answers[question.id] ?? null}
              showCorrect
            />
          ))}
        </div>

        <div className="mt-8 pb-8 text-center">
          <button onClick={() => router.push("/english/listening")} className="btn-primary inline-flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> 再来一套
          </button>
        </div>
      </div>
    </div>
  );
}
