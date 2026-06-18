"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Headphones, ChevronRight, Loader2, Sparkles, Clock, BookOpen, BarChart3, History } from "lucide-react";
import { getAvailableLevels } from "@/data/listening-sets";
import AiSearchBox from "@/components/english/AiSearchBox";
import DifficultyPicker from "@/components/english/DifficultyPicker";

interface TestHistoryItem {
  id: string; level: string; title: string; score: number; total: number; date: string;
}

function loadHistory(): TestHistoryItem[] {
  try { return JSON.parse(localStorage.getItem("learnos_listening_history") || "[]"); } catch { return []; }
}

export default function ListeningPage() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState("mixed");
  const [selectedLevel, setSelectedLevel] = useState<"cet4" | "cet6" | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const levels = getAvailableLevels();
  const history = loadHistory();

  const startTest = async () => {
    if (!selectedLevel) return;
    setGenerating(true);
    setError("");
    try {
      const resp = await fetch("/api/english/listening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: selectedLevel, difficulty }),
      });
      const data = await resp.json();
      if (data.success && data.test) {
        sessionStorage.setItem("learnos_listening_test", JSON.stringify(data.test));
        router.push(`/english/listening/${data.test.id}`);
      } else {
        setError(data.error || "生成失败，请重试");
      }
    } catch {
      setError("网络错误，请检查连接后重试");
    }
    setGenerating(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">🎧 听力训练</h1>
          <p className="text-sm text-zinc-500 mt-1">四六级标准听力 · Section A/B/C · 25题 · 约30分钟</p>
        </div>
        <button onClick={() => router.push("/english/history?tab=listening")}
          className="btn-secondary text-xs px-3 py-2 flex items-center gap-1">
          <History className="w-3.5 h-3.5" /> 历史
        </button>
      </div>

      <div className="mb-4"><DifficultyPicker value={difficulty} onChange={setDifficulty} /></div>
      <p className="text-xs text-zinc-500 mb-2">当前难度：{difficulty==="easy"?"🟢 基础 ~1min/题":difficulty==="medium"?"🟡 中等 ~2min/题":difficulty==="hard"?"🔴 困难 ~3min/题":"🔀 综合难度"}</p>
      <h2 className="font-semibold mb-3 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-primary-500" /> 选择级别
      </h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {levels.map((lv) => (
          <button
            key={lv.id}
            onClick={() => setSelectedLevel(lv.id as "cet4" | "cet6")}
            className={`card-hover text-left p-5 border-2 rounded-xl transition-all ${
              selectedLevel === lv.id ? "border-primary-500 bg-primary-50/50 shadow-md" : "border-zinc-200"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                lv.id === "cet4" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
              }`}>
                <Headphones className="w-5 h-5" />
              </div>
              <h3 className="font-bold">{lv.label}</h3>
            </div>
            <p className="text-xs text-zinc-500">{lv.desc}</p>
          </button>
        ))}
      </div>

      {selectedLevel && (
        <div className="card text-center py-8 border-primary-200 bg-primary-50/50 mb-8 animate-slide-up">
          <Sparkles className="w-12 h-12 text-primary-400 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">AI 正在为你生成听力试卷...</h3>
          <p className="text-sm text-zinc-500 mb-6">
            基于 {selectedLevel === "cet4" ? "CET-4" : "CET-6"} 真题格式，AI 将生成 Section A/B/C 完整试卷（25题）
          </p>
          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
          <button
            onClick={startTest}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium disabled:opacity-50"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 生成中...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> 开始听力训练 <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Clock, label: "Section A", desc: selectedLevel === "cet6" ? "长对话 8题" : "短篇新闻 7题", color: "text-blue-600 bg-blue-50" },
          { icon: Headphones, label: "Section B", desc: selectedLevel === "cet6" ? "短文理解 7题" : "长对话 8题", color: "text-emerald-600 bg-emerald-50" },
          { icon: BarChart3, label: "Section C", desc: selectedLevel === "cet6" ? "讲座讲话 10题" : "短文理解 10题", color: "text-purple-600 bg-purple-50" },
        ].map((item) => (
          <div key={item.label} className="card p-4 text-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <p className="font-bold text-sm">{item.label}</p>
            <p className="text-xs text-zinc-500">{item.desc}</p>
          </div>
        ))}
      </div>

      {history.length > 0 && (
        <>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <History className="w-5 h-5 text-zinc-500" /> 历史记录
          </h2>
          <div className="space-y-2">
            {history.slice(0, 5).map((h) => (
              <button
                key={h.id}
                onClick={() => router.push(`/english/listening/result/${h.id}`)}
                className="card w-full text-left flex items-center gap-4 hover:bg-zinc-50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${
                  h.level === "cet4" ? "bg-blue-500" : "bg-purple-500"
                }`}>
                  <Headphones className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{h.title}</p>
                  <p className="text-xs text-zinc-500">
                    {h.level === "cet4" ? "CET-4" : "CET-6"} · {new Date(h.date).toLocaleDateString("zh-CN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${h.score >= h.total * 0.6 ? "text-emerald-600" : "text-red-500"}`}>
                    {h.score}/{h.total}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
      <AiSearchBox moduleName="听力训练" placeholder="问关于听力技巧、速记方法、常见陷阱…" />
    </div>
  );
}
