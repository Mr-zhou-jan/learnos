"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, RefreshCw, RotateCcw, Link2, BookmarkPlus, History } from "lucide-react";
import AiSearchBox from "@/components/english/AiSearchBox";
import DifficultyPicker from "@/components/english/DifficultyPicker";
import { DiffBadge } from "@/components/english/DiffBadge";
import LinkImporter from "@/components/english/LinkImporter";
import { saveTrainingRecord } from "@/lib/use-training-memory";
import { saveTrainingState, loadTrainingState, clearTrainingState } from "@/lib/training-memory";

interface ClozeData {
  id: string; title: string; difficulty: string; topic: string;
  wordCount: number; passage: string; blanks: string[];
  wordBank: string[]; correctIndices: number[]; explanations: string[];
}

const TOPICS = ["学习方法", "科技发展", "环境保护", "社会文化", "健康生活", "经济发展"];
const LEVELS: Record<string, string> = { cet4: "四级", cet6: "六级" };

export default function ClozePage() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState("mixed");
  const [cloze, setCloze] = useState<ClozeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [level, setLevel] = useState("cet4");
  const [showImport, setShowImport] = useState(false);
  const [clozeRecordIds, setClozeRecordIds] = useState<Record<number, string>>({});

  const handleSubmit = () => {
    if (!cloze) return;
    setSubmitted(true);
    const ids: Record<number, string> = {};
    for (let i = 0; i < cloze.blanks.length; i++) {
      const userIdx = answers[i];
      const correct = userIdx === cloze.correctIndices[i];
      const rec = saveTrainingRecord({
        module: "cloze", title: `${cloze.title} (${cloze.topic})`,
        question: `空格${i + 1}：选择最合适的词`,
        userAnswer: userIdx !== undefined ? cloze.wordBank[userIdx] : "(未作答)",
        correctAnswer: cloze.wordBank[cloze.correctIndices[i]],
        isCorrect: correct,
        explanation: cloze.explanations[i] || "",
      });
      ids[i] = rec.id;
    }
    setClozeRecordIds(ids);
  };

  const loadCloze = async (lvl?: string) => {
    clearTrainingState("cloze");
    setLoading(true); setAnswers({}); setSubmitted(false);
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    try {
      const resp = await fetch("/api/english/cloze/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: lvl || level, topic, difficulty }),
      });
      const data = await resp.json();
      if (data.passage) {
        setCloze(data);
        const saved = JSON.parse(localStorage.getItem("learnos_cloze_history") || "[]");
        localStorage.setItem("learnos_cloze_history", JSON.stringify([data, ...saved].slice(0, 10)));
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    // 尝试恢复进度
    const saved = loadTrainingState("cloze");
    if (saved?.answers?.clozeData) {
      setCloze(saved.answers.clozeData);
      setAnswers(saved.answers.userAnswers || {});
      setLevel(saved.answers.level || "cet4");
      setLoading(false);
    } else {
      loadCloze();
    }
  }, []);

  // 卸载时保存
  const memRef = useRef({ cloze, answers, level, submitted });
  memRef.current = { cloze, answers, level, submitted };
  useEffect(() => {
    return () => {
      const s = memRef.current;
      if (s.cloze && !s.submitted && Object.keys(s.answers).length > 0) {
        saveTrainingState("cloze", { currentIndex: 0, answers: { clozeData: s.cloze, userAnswers: s.answers, level: s.level } });
      }
    };
  }, []);

  // 答案变化立即保存
  useEffect(() => {
    if (!cloze || submitted) return;
    saveTrainingState("cloze", { currentIndex: 0, answers: { clozeData: cloze, userAnswers: answers, level } });
  }, [answers, submitted]);

  const toggleAnswer = (blankIndex: number, wordIndex: number) => {
    if (submitted) return;
    setAnswers(prev => {
      const next = { ...prev };
      if (next[blankIndex] === wordIndex) { delete next[blankIndex]; return next; }
      for (const key of Object.keys(next)) {
        if (Number(key) !== blankIndex && next[Number(key)] === wordIndex) delete next[Number(key)];
      }
      next[blankIndex] = wordIndex;
      return next;
    });
  };

  if (loading) return (
    <div className="p-12 text-center">
      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-500" />
      <p className="text-zinc-500">正在生成选词填空题...</p>
    </div>
  );

  if (!cloze) return <div className="p-12 text-center text-zinc-500">加载失败，请刷新重试</div>;

  const parts = cloze.passage.split(/___\d+___/);
  const blankCount = cloze.blanks.length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {showImport && <div className="mb-6"><LinkImporter moduleName="cloze" onContentImported={() => { setShowImport(false); loadCloze(level); }} /></div>}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">📝 选词填空</h1>
          <p className="text-sm text-zinc-500 mt-1">15选10 · 考查词汇辨析与搭配 · 建议10分钟完成</p>
          <div className="mt-3"><DifficultyPicker value={difficulty} onChange={setDifficulty} /></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/english/history?tab=cloze")} className="btn-secondary text-xs px-3 py-2 flex items-center gap-1"><History className="w-3.5 h-3.5"/>历史</button>
          <button onClick={() => setShowImport(!showImport)} className="btn-secondary text-xs px-3 py-2 flex items-center gap-1"><Link2 className="w-3.5 h-3.5"/>导入</button>
          <div className="flex gap-1 bg-zinc-100 rounded-lg p-1">
            {Object.entries(LEVELS).map(([k, v]) => (
              <button key={k} onClick={() => { setLevel(k); loadCloze(k); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${level === k ? "bg-white shadow-sm" : "text-zinc-500"}`}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={() => loadCloze(level)} className="btn-secondary text-xs flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> 换一题
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <span className={`badge ${cloze.difficulty === "cet6" ? "badge-warning" : "badge-success"}`}>
          {LEVELS[cloze.difficulty] || cloze.difficulty}
        </span>
        <span className="text-sm text-zinc-500">{cloze.topic}</span>
        <span className="text-xs text-zinc-400">{cloze.wordCount}词</span>
      </div>

      {/* 短文填空区 */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-3"><DiffBadge /><h2 className="font-bold">{cloze.title}</h2></div>
        <div className="text-sm leading-loose">
          {parts.map((part, i) => (
            <span key={i}>
              <span>{part}</span>
              {i < blankCount && (
                <span className={`inline-block min-w-[80px] mx-1 px-2 py-0.5 border-b-2 text-center font-medium ${
                  submitted
                    ? answers[i] === cloze.correctIndices[i]
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-red-400 bg-red-50 text-red-600"
                    : answers[i] !== undefined ? "border-primary-400 bg-primary-50 text-primary-700" : "border-zinc-300 text-zinc-400"
                }`}>
                  {answers[i] !== undefined ? cloze.wordBank[answers[i]] : `(${i + 1})`}
                  {submitted && answers[i] !== cloze.correctIndices[i] && (
                    <span className="text-emerald-600 ml-1 text-xs">→{cloze.wordBank[cloze.correctIndices[i]]}</span>
                  )}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* 候选词库 */}
      <div className="mb-6">
        <h3 className="text-sm font-bold mb-3 text-zinc-600">📦 候选词库（15选10）</h3>
        <div className="flex flex-wrap gap-2">
          {cloze.wordBank.map((word, i) => {
            const used = Object.values(answers).includes(i);
            const isCorrect = cloze.correctIndices.includes(i);
            return (
              <button
                key={i}
                onClick={() => {
                  if (submitted) return;
                  for (let b = 0; b < blankCount; b++) {
                    if (answers[b] === undefined) { toggleAnswer(b, i); return; }
                  }
                }}
                disabled={submitted}
                className={`px-3 py-1.5 rounded-lg text-sm border font-medium transition-all ${
                  submitted
                    ? isCorrect ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : used && !isCorrect ? "border-red-200 bg-red-50 text-red-400 line-through"
                    : "border-zinc-200 bg-zinc-50 text-zinc-400"
                    : used ? "border-primary-400 bg-primary-500 text-white"
                    : "border-zinc-200 bg-white hover:border-primary-300 hover:bg-primary-50"
                }`}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 mb-6">
        {!submitted ? (
          <>
            <button onClick={handleSubmit} disabled={Object.keys(answers).length < blankCount}
              className="btn-primary flex items-center gap-2">
              <Check className="w-4 h-4" /> 提交答案 ({Object.keys(answers).length}/{blankCount})
            </button>
            <button onClick={() => setAnswers({})} disabled={Object.keys(answers).length === 0}
              className="btn-secondary flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> 清空重选
            </button>
          </>
        ) : (
          <>
            <button onClick={() => loadCloze(level)} className="btn-primary flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> 再来一题
            </button>
            <span className="self-center text-sm font-bold text-emerald-600 ml-2">
              ✅ 正确 {Object.entries(answers).filter(([k, v]) => v === cloze.correctIndices[Number(k)]).length}/{blankCount}
            </span>
          </>
        )}
      </div>

      {/* 解析 */}
      {submitted && (
        <div className="card bg-primary-50 border-primary-100">
          <h3 className="font-bold mb-4 text-primary-700">📖 答案解析</h3>
          <div className="space-y-3">
            {cloze.explanations.map((exp, i) => {
              const correct = answers[i] === cloze.correctIndices[i];
              return (
                <div key={i} className={`p-3 rounded-lg text-sm ${correct ? "bg-emerald-50 border border-emerald-100" : "bg-red-50 border border-red-100"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`font-bold mr-2 ${correct ? "text-emerald-700" : "text-red-700"}`}>
                        {correct ? "✅" : "❌"} 第{i + 1}空：
                      </span>
                      <span className={correct ? "text-emerald-700" : "text-red-700"}>{exp}</span>
                    </div>
                    {correct && clozeRecordIds[i] && (
                      <button onClick={() => { import("@/lib/use-training-memory").then(m => m.toggleErrorBook(clozeRecordIds[i])); }}
                        className="shrink-0 text-xs text-amber-500 hover:text-amber-700 flex items-center gap-0.5 mt-0.5">
                        <BookmarkPlus className="w-3 h-3" /> 加入错题本
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AiSearchBox moduleName="选词填空" placeholder="问关于选词填空技巧、词汇辨析的问题..." />
    </div>
  );
}
