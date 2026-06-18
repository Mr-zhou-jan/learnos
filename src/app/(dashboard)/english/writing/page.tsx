"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Send, RefreshCw, BookmarkPlus, History } from "lucide-react";
import AiSearchBox from "@/components/english/AiSearchBox";
import DifficultyPicker from "@/components/english/DifficultyPicker";
import { DiffBadge } from "@/components/english/DiffBadge";
import LinkImporter from "@/components/english/LinkImporter";
import { saveTrainingRecord } from "@/lib/use-training-memory";
import { loadTrainingState, clearTrainingState } from "@/lib/training-memory";
import { userKey } from "@/lib/user-store";

const TOPICS = {
  argumentative: {
    name: "议论文写作",
    prompts: [
      "Should college students be required to take physical education classes?",
      "Is online learning as effective as traditional classroom learning?",
      "Should social media platforms be regulated by the government?",
    ]
  },
  letter: {
    name: "书信写作",
    prompts: [
      "Write a letter to your university suggesting improvements to the library.",
      "Write a job application letter for a summer internship position.",
      "Write a letter to a friend sharing your college life experience.",
    ]
  },
  chart: {
    name: "图表作文",
    prompts: [
      "Describe the changes in mobile phone usage from 2015 to 2025 shown in the chart.",
      "Compare the energy consumption of different sources over the past decade.",
      "Analyze the employment rate trends among college graduates.",
    ]
  }
};

export default function WritingPage() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState("mixed");
  const [category, setCategory] = useState<keyof typeof TOPICS | null>(null);
  const [prompt, setPrompt] = useState("");
  const [essay, setEssay] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [customPrompts, setCustomPrompts] = useState<any[]>([]);
  const [writeRecordId, setWriteRecordId] = useState<string | null>(null);

  // 恢复进度
  useEffect(() => {
    const saved = loadTrainingState("writing");
    if (!saved?.answers) return;
    const ans = saved.answers;
    if (ans.category) setCategory(ans.category);
    if (ans.prompt) setPrompt(ans.prompt);
    if (ans.essay) setEssay(ans.essay);
    if (ans.feedback) setFeedback(ans.feedback);
  }, []);

  // 辅助：直接保存
  const doSave = () => {
    if (!prompt && !essay) return;
    try {
      localStorage.setItem(userKey("learnos_ts_writing"), JSON.stringify({
        module: "writing", currentIndex: 0,
        answers: { category, prompt, essay, feedback },
        updatedAt: new Date().toISOString(),
      }));
    } catch {}
  };

  const submitEssay = async () => {
    if (!essay.trim()) return;
    setLoading(true);
    try {
      const r = await fetch("/api/knowledge/content", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: prompt, paraphrase: essay, action: "score" }),
      });
      if (r.ok) {
        const d = await r.json();
        setFeedback(d.score?.feedback || d.feedback || "作文已提交，AI正在评估…");
        const rec = saveTrainingRecord({
          module: "writing", title: prompt, question: "作文批改",
          userAnswer: essay.slice(0, 200), correctAnswer: "参考AI反馈",
          isCorrect: true, explanation: d.score?.feedback || "",
        });
        setWriteRecordId(rec.id);
      }
    } catch {}
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const resp = await fetch("/api/english/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: "writing", level: "cet4", count: 3, difficulty }),
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

  const getAllPrompts = (cat: keyof typeof TOPICS) => {
    const builtIn = TOPICS[cat]?.prompts || [];
    const custom = customPrompts.filter((p: any) => p.category === cat).map((p: any) => p.prompt);
    return [...builtIn, ...custom];
  };

  if (!category) return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">✍️ 作文批改</h1>
        <p className="text-xs text-zinc-500 mb-3">选卷难度：{difficulty==="easy"?"🟢 基础":difficulty==="medium"?"🟡 中等":difficulty==="hard"?"🔴 困难":"🔀 综合"}</p>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/english/history?tab=writing")}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1">
            <History className="w-3.5 h-3.5" /> 历史
          </button>
          <LinkImporter moduleName="作文批改" onContentImported={handleContentImported} />
          <button onClick={handleRefresh} disabled={refreshing}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1">
            {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            刷新题库
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {Object.entries(TOPICS).map(([key, val]) => (
          <button key={key} onClick={() => setCategory(key as keyof typeof TOPICS)}
            className="card-hover w-full text-left p-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{key === "argumentative" ? "✍️" : key === "letter" ? "📨" : "📊"}</span>
              <div>
                <h3 className="font-bold">{val.name}</h3>
                <p className="text-sm text-zinc-500">AI 生成不限量</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      <AiSearchBox moduleName="作文批改" placeholder="问关于作文结构、论点展开、高分句型…" />
    </div>
  );

  const cat = TOPICS[category];
  const allPrompts = getAllPrompts(category);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => { setCategory(null); setPrompt(""); setEssay(""); setFeedback(""); clearTrainingState("writing"); }}
        className="text-sm text-zinc-500 hover:text-zinc-700 mb-4 flex items-center gap-1">
        <ArrowLeft className="w-4 h-4"/> 返回
      </button>
      <h1 className="text-2xl font-bold mb-2">{cat.name}</h1>

      {!prompt ? (
        <div className="space-y-3 mt-6">
          <div className="mb-3"><DifficultyPicker value={difficulty} onChange={setDifficulty} /></div>
          <p className="text-sm text-zinc-500">选择作文题目：</p>
          {allPrompts.map((p, i) => (
            <button key={i} onClick={() => { setPrompt(p); doSave(); }}
              className="card-hover w-full text-left p-4 text-sm font-medium">
              {i + 1}. {p}
              {i >= cat.prompts.length && <span className="badge badge-primary ml-2 text-xs">新题</span>}
            </button>
          ))}
        </div>
      ) : !feedback ? (
        <div className="mt-6 space-y-4">
          <div className="card bg-primary-50 border-primary-200">
            <div className="flex items-center gap-2 mb-1"><DiffBadge /><p className="font-bold text-primary-700">📝 作文题目</p></div>
            <p className="text-sm">{prompt}</p>
          </div>
          <textarea value={essay} onChange={e => { setEssay(e.target.value); doSave(); }}
            placeholder="在此输入你的作文（120-180词）…" rows={12}
            className="w-full px-4 py-3 border rounded-xl text-sm resize-none focus:outline-none focus:border-primary-400"/>
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-400">词数: {essay.split(/\s+/).filter(w => w).length}</span>
            <button onClick={submitEssay} disabled={loading || !essay.trim()}
              className="btn-primary">{loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}提交批改</button>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-5 animate-fade-in">
          <div className="card-glass p-6 border-emerald-200/60 bg-emerald-50/30">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="font-bold text-emerald-800 text-lg flex items-center gap-2">✨ AI 批改反馈</h3>
              {writeRecordId && (
                <button onClick={() => { import("@/lib/use-training-memory").then(m => m.toggleErrorBook(writeRecordId!)); }}
                  className="shrink-0 text-xs text-amber-500 hover:text-amber-700 flex items-center gap-0.5 font-medium">
                  <BookmarkPlus className="w-3 h-3" /> 加入错题本
                </button>
              )}
            </div>
            <div className="prose prose-sm max-w-none text-emerald-800 leading-relaxed whitespace-pre-wrap">{feedback}</div>
          </div>
          <div className="card p-5">
            <h3 className="font-bold mb-3 text-zinc-700">📝 你的原文</h3>
            <p className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed bg-zinc-50 rounded-xl p-4">{essay}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setPrompt(""); setEssay(""); setFeedback(""); clearTrainingState("writing"); }} className="btn-primary">重选题目</button>
            <button onClick={() => setFeedback("")} className="btn-secondary">修改作文</button>
          </div>
        </div>
      )}

      <AiSearchBox moduleName="作文批改" placeholder="问关于作文评分标准、高分技巧、语法纠错…" />
    </div>
  );
}
