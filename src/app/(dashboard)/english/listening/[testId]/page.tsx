"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, ChevronRight, Clock, Flag, Eye, EyeOff, AlertTriangle } from "lucide-react";
import AudioPlayer from "@/components/english/AudioPlayer";
import type { ListeningTestData } from "@/data/listening-sets";
import { DiffBadge } from "@/components/english/DiffBadge";
import { saveTrainingState, loadTrainingState, clearTrainingState } from "@/lib/training-memory";
import { userKey } from "@/lib/user-store";

export default function ListeningTestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.testId as string;

  const [test, setTest] = useState<ListeningTestData | null>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showScript, setShowScript] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // 尝试从 sessionStorage 加载试卷数据
    const raw = sessionStorage.getItem("learnos_listening_test");
    // 尝试从 localStorage 恢复进度
    const saved = loadTrainingState("listening");
    if (raw) {
      try {
        const t = JSON.parse(raw) as ListeningTestData;
        if (t.id === testId || true) {
          setTest(t);
          // 恢复进度
          if (saved?.answers?.testId === t.id) {
            setActiveSection(saved.currentIndex || 0);
            setActiveQuestion(saved.answers.activeQuestion || 0);
            setAnswers(saved.answers.userAnswers || {});
            setElapsed(saved.answers.elapsed || 0);
          }
          return;
        }
      } catch {}
    }
    // 如果 sessionStorage 无数据但有保存的进度，用保存的试卷数据
    if (saved?.answers?.testData) {
      setTest(saved.answers.testData);
      setActiveSection(saved.currentIndex || 0);
      setActiveQuestion(saved.answers.activeQuestion || 0);
      setAnswers(saved.answers.userAnswers || {});
      setElapsed(saved.answers.elapsed || 0);
      return;
    }
    setNotFound(true);
  }, [testId]);

  useEffect(() => {
    if (!test) return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [test]);

  // 辅助：直接保存
  const doSave = () => {
    if (!test) return;
    try {
      localStorage.setItem(userKey("learnos_ts_listening"), JSON.stringify({
        module: "listening", currentIndex: activeSection,
        answers: { testId: test.id, testData: test, activeQuestion, userAnswers: answers, elapsed },
        updatedAt: new Date().toISOString(),
      }));
    } catch {}
  };

  const section = test?.sections[activeSection];
  const question = section?.questions[activeQuestion];
  const totalQuestions = test?.totalQuestions || 25;
  const answeredCount = Object.keys(answers).length;

  const currentGlobalIndex = test
    ? test.sections.slice(0, activeSection).reduce((s, sec) => s + sec.questions.length, 0) + activeQuestion
    : 0;

  const selectAnswer = useCallback(
    (optionIndex: number) => {
      if (!question) return;
      setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }));
      // 直接保存进度
      try {
        localStorage.setItem(userKey("learnos_ts_listening"), JSON.stringify({
          module: "listening", currentIndex: activeSection,
          answers: { testId: test?.id, testData: test, activeQuestion, userAnswers: { ...answers, [question.id]: optionIndex }, elapsed },
          updatedAt: new Date().toISOString(),
        }));
      } catch {}
      setTimeout(() => goNext(), 400);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [question, activeSection, activeQuestion, test]
  );

  const goNext = useCallback(() => {
    if (!test) return;
    const sec = test.sections[activeSection];
    if (activeQuestion + 1 < sec.questions.length) {
      setActiveQuestion(activeQuestion + 1);
    } else if (activeSection + 1 < test.sections.length) {
      setActiveSection(activeSection + 1);
      setActiveQuestion(0);
    }
  }, [test, activeSection, activeQuestion]);

  const goPrev = useCallback(() => {
    if (activeQuestion > 0) {
      setActiveQuestion(activeQuestion - 1);
    } else if (activeSection > 0 && test) {
      const prevSec = test.sections[activeSection - 1];
      setActiveSection(activeSection - 1);
      setActiveQuestion(prevSec.questions.length - 1);
    }
  }, [activeSection, activeQuestion, test]);

  const submitTest = useCallback(() => {
    if (!test) return;
    let correct = 0;
    for (const sec of test.sections) {
      for (const q of sec.questions) {
        if (answers[q.id] === q.correctIndex) correct++;
      }
    }
    const result = {
      testId: test.id, level: test.level, title: test.title,
      answers, score: correct, total: test.totalQuestions, date: new Date().toISOString(),
    };
    sessionStorage.setItem("learnos_listening_result", JSON.stringify(result));
    const history = JSON.parse(localStorage.getItem("learnos_listening_history") || "[]");
    history.unshift({
      id: test.id, level: test.level, title: test.title,
      score: correct, total: test.totalQuestions, date: result.date,
    });
    localStorage.setItem("learnos_listening_history", JSON.stringify(history.slice(0, 20)));
    clearTrainingState("listening");
    router.push(`/english/listening/result/${test.id}`);
  }, [test, answers, router]);

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m.toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  };

  if (notFound) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-2">试卷未找到</h2>
          <p className="text-sm text-zinc-500 mb-4">请返回听力页面重新生成试卷</p>
          <button onClick={() => router.push("/english/listening")} className="btn-primary">返回听力训练</button>
        </div>
      </div>
    );
  }

  if (!test || !question) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin mx-auto" />
      </div>
    );
  }

  const optionLabel = (i: number) => String.fromCharCode(65 + i);
  const progress = ((currentGlobalIndex + 1) / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* 顶部栏 */}
      <header className="bg-white border-b border-zinc-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => router.push("/english/listening")} className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700">
          <ArrowLeft className="w-4 h-4" /> 退出
        </button>
        <div className="text-center">
          <p className="text-sm font-bold">{test.title}</p>
          <p className="text-xs text-zinc-500">{test.level === "cet4" ? "CET-4" : "CET-6"} · 25题</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-sm text-zinc-500"><Clock className="w-4 h-4" /> {fmtTime(elapsed)}</span>
          <span className="text-sm text-zinc-500">{answeredCount}/{totalQuestions} 已答</span>
        </div>
      </header>

      <div className="h-1 bg-zinc-200">
        <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Section 标签 */}
      <div className="bg-white border-b border-zinc-100 px-6 py-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {test.sections.map((sec, i) => (
            <button
              key={sec.id}
              onClick={() => { setActiveSection(i); setActiveQuestion(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                i === activeSection ? "bg-primary-100 text-primary-700" : "text-zinc-500 hover:bg-zinc-50"
              }`}
            >
              {sec.title}
            </button>
          ))}
        </div>
      </div>

      {/* 主内容 */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-5 p-4 bg-blue-50/70 border border-blue-100 rounded-xl text-sm text-blue-800 leading-relaxed">
            {section.direction}
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-500">
                第 {currentGlobalIndex + 1}/{totalQuestions} 题 · {section.title}
              </span>
              <button
                onClick={() => setShowScript(!showScript)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-zinc-200 hover:bg-zinc-50 transition-colors"
              >
                {showScript ? <><EyeOff className="w-3 h-3" /> 隐藏原文</> : <><Eye className="w-3 h-3" /> 显示原文</>}
              </button>
            </div>
            <AudioPlayer script={question.audioScript} label={section.title} />
          </div>

          {showScript && (
            <div className="mb-6 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
              <p className="text-xs font-bold text-zinc-500 mb-1">听力原文</p>
              <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">{question.audioScript}</p>
            </div>
          )}
          {!showScript && (
            <div className="mb-6 p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-center">
              <p className="text-xs text-zinc-400">听力原文已隐藏，点击上方按钮查看</p>
            </div>
          )}

          <h3 className="text-base font-bold mb-5">{question.question}</h3>

          <div className="space-y-3 mb-8">
            {question.options.map((opt, i) => {
              const sel = answers[question.id] === i;
              return (
                <button
                  key={i}
                  onClick={() => selectAnswer(i)}
                  className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    sel ? "border-primary-500 bg-primary-50 shadow-sm" : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                    sel ? "bg-primary-500 text-white" : "bg-zinc-100 text-zinc-500"
                  }`}>
                    {optionLabel(i)}
                  </span>
                  <span className="text-sm flex-1">{opt.replace(/^[A-D][.\s]+/, "")}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 底部 */}
      <footer className="bg-white border-t border-zinc-200 px-6 py-3 flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={activeSection === 0 && activeQuestion === 0}
          className="btn-secondary text-sm disabled:opacity-30"
        >
          <ArrowLeft className="w-4 h-4" /> 上一题
        </button>

        <div className="flex items-center gap-1.5">
          {section.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveQuestion(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === activeQuestion ? "bg-primary-500 w-5" : answers[section.questions[i].id] !== undefined ? "bg-emerald-400" : "bg-zinc-300"
              }`}
            />
          ))}
        </div>

        {activeSection === test.sections.length - 1 && activeQuestion === section.questions.length - 1 ? (
          <button onClick={submitTest} className="bg-emerald-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1.5">
            <Flag className="w-4 h-4" /> 提交试卷
          </button>
        ) : (
          <button onClick={goNext} className="btn-primary text-sm">
            下一题 <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </footer>
    </div>
  );
}
