"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, RefreshCw, BookmarkPlus, History } from "lucide-react";
import AiSearchBox from "@/components/english/AiSearchBox";
import DifficultyPicker from "@/components/english/DifficultyPicker";
import { DiffBadge } from "@/components/english/DiffBadge";
import LinkImporter from "@/components/english/LinkImporter";
import { saveTrainingRecord } from "@/lib/use-training-memory";
import { saveTrainingStateDirect, loadTrainingState, clearTrainingState } from "@/lib/training-memory";

const CATEGORIES = {
  culture: {
    name: "文化类翻译", icon: "🏮",
    prompts: ["中秋节是中国最重要的传统节日之一，人们在这一天与家人团聚，赏月吃月饼。", "中国书法有着数千年的历史，被誉为东方艺术的瑰宝。"]
  },
  economy: {
    name: "经济类翻译", icon: "💰",
    prompts: ["近年来，中国的数字经济发展迅速，已成为推动经济增长的重要引擎。", "随着消费升级，越来越多的人开始关注产品的品质而非价格。"]
  },
  society: {
    name: "社会类翻译", icon: "🌍",
    prompts: ["随着互联网的普及，在线教育为偏远地区的学生提供了更多的学习机会。", "环境保护已成为全社会共同关注的话题，每个人都应该为此贡献力量。"]
  }
};

export default function TranslationPage() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState("mixed");
  const [category, setCategory] = useState<keyof typeof CATEGORIES | null>(null);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [customPrompts, setCustomPrompts] = useState<any[]>([]);
  const [transRecordId, setTransRecordId] = useState<string | null>(null);

  // 恢复进度
  useEffect(() => {
    const saved = loadTrainingState("translation");
    if (!saved?.answers) return;
    const ans = saved.answers;
    if (ans.category) setCategory(ans.category);
    if (ans.current !== undefined) setCurrent(ans.current);
    if (ans.answer) setAnswer(ans.answer);
    if (ans.feedback) setFeedback(ans.feedback);
  }, []);

  // 辅助：直接保存
  const doSave = () => {
    if (!category && !answer) return;
    saveTrainingStateDirect("translation", { currentIndex: current, answers: { category, current, answer, feedback } });
  };

  const submit = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      const r = await fetch("/api/knowledge/content", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: "翻译批改", paraphrase: `原文：${prompts[current]}\n学生译文：${answer}`, action: "score" }),
      });
      if (r.ok) {
        const d = await r.json();
        setFeedback(d.score?.feedback || "翻译已提交");
        const rec = saveTrainingRecord({
          module: "translation", title: prompts[current], question: "汉译英",
          userAnswer: answer.slice(0, 200), correctAnswer: "参考AI反馈",
          isCorrect: true, explanation: d.score?.feedback || "",
        });
        setTransRecordId(rec.id);
      }
    } catch {}
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const resp = await fetch("/api/english/refresh", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: "translation", level: "cet4", count: 3, difficulty }),
      });
      const data = await resp.json();
      if (data.success && data.prompts?.length) {
        setCustomPrompts(prev => [...data.prompts, ...prev].slice(0, 12));
      }
    } catch {}
    setRefreshing(false);
  };

  const handleContentImported = (content: any) => {
    if (content.prompts?.length) {
      setCustomPrompts(prev => [...content.prompts, ...prev].slice(0, 12));
    }
  };

  const getAllPrompts = (cat: keyof typeof CATEGORIES) => {
    const builtIn = CATEGORIES[cat]?.prompts || [];
    const custom = customPrompts.filter((p: any) => p.category === cat).map((p: any) => p.prompt);
    return [...builtIn, ...custom];
  };

  if (!category) return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🌐 翻译训练</h1>
        <p className="text-xs text-zinc-500 mb-3">选卷难度：{difficulty==="easy"?"🟢 基础":difficulty==="medium"?"🟡 中等":difficulty==="hard"?"🔴 困难":"🔀 综合"}</p>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/english/history?tab=translation")}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1">
            <History className="w-3.5 h-3.5" /> 历史
          </button>
          <LinkImporter moduleName="翻译训练" onContentImported={handleContentImported} />
          <button onClick={handleRefresh} disabled={refreshing}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1">
            {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            刷新题库
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {Object.entries(CATEGORIES).map(([key, val]) => (
          <button key={key} onClick={() => { setCategory(key as keyof typeof CATEGORIES); doSave(); }}
            className="card-hover w-full text-left p-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{val.icon}</span>
              <div>
                <h3 className="font-bold">{val.name}</h3>
                <p className="text-sm text-zinc-500">AI 生成不限量</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      <AiSearchBox moduleName="翻译训练" placeholder="问关于翻译技巧、汉英差异、常见错误…" />
    </div>
  );

  const cat = CATEGORIES[category];
  const prompts = getAllPrompts(category);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => { setCategory(null); setCurrent(0); setAnswer(""); setFeedback(""); clearTrainingState("translation"); }}
        className="text-sm text-zinc-500 hover:text-zinc-700 mb-4 flex items-center gap-1">
        <ArrowLeft className="w-4 h-4"/> 返回
      </button>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{cat.name}</h1>
        <span className="text-sm text-zinc-500">{current + 1}/{prompts.length}</span>
      </div>
      <div className="card bg-primary-50 border-primary-200 mb-4">
        <div className="flex items-center gap-2 mb-1"><DiffBadge /><p className="font-bold text-primary-700">📝 请翻译</p></div>
        <p className="text-sm">{prompts[current]}</p>
        {current >= CATEGORIES[category].prompts.length && (
          <span className="badge badge-primary mt-2 text-xs">新题</span>
        )}
      </div>
      {!feedback ? (
        <>
          <textarea value={answer} onChange={e => { setAnswer(e.target.value); doSave(); }}
            placeholder="在此输入你的英文翻译…" rows={6}
            className="w-full px-4 py-3 border rounded-xl text-sm resize-none focus:outline-none focus:border-primary-400 mb-4"/>
          <button onClick={submit} disabled={loading || !answer.trim()}
            className="btn-primary">{loading ? <Loader2 className="w-4 h-4 animate-spin"/> : "提交翻译"}</button>
        </>
      ) : (
        <>
          <div className="card bg-emerald-50 border-emerald-200 mb-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-emerald-800 mb-2">✅ AI批改</h3>
              {transRecordId && (
                <button onClick={() => { import("@/lib/use-training-memory").then(m => m.toggleErrorBook(transRecordId!)); }}
                  className="shrink-0 text-xs text-amber-500 hover:text-amber-700 flex items-center gap-0.5">
                  <BookmarkPlus className="w-3 h-3" /> 加入错题本
                </button>
              )}
            </div>
            <p className="text-sm text-emerald-700">{feedback}</p>
          </div>
          <p className="text-sm text-zinc-500 mb-1">你的译文：</p>
          <p className="text-sm bg-white p-3 rounded-xl border mb-4">{answer}</p>
          <div className="flex gap-3">
            <button onClick={() => { setAnswer(""); setFeedback(""); }} className="btn-secondary">修改</button>
            {current < prompts.length - 1 && (
              <button onClick={() => { setCurrent(current + 1); setAnswer(""); setFeedback(""); }}
                className="btn-primary">下一题</button>
            )}
          </div>
        </>
      )}
      <AiSearchBox moduleName="翻译训练" placeholder="问关于翻译技巧、汉英差异、常见错误…" />
    </div>
  );
}
