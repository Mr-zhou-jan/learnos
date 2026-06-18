"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Sparkles, RefreshCw, Clock, History } from "lucide-react";
import AiSearchBox from "@/components/english/AiSearchBox";
import DifficultyPicker from "@/components/english/DifficultyPicker";
import LinkImporter from "@/components/english/LinkImporter";
import { loadTrainingState } from "@/lib/training-memory";

export default function ReadingList() {
  const router = useRouter();
  const [articles, setArticles] = useState<any[]>([]);
  const [difficulty, setDifficulty] = useState("mixed");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadArticles = () => {
    setLoading(true);
    fetch("/api/english/articles" + (filter !== "all" ? "?difficulty=" + filter : ""))
      .then(r => r.json()).then(d => {
        const local = JSON.parse(localStorage.getItem("learnos_ai_articles") || "[]");
        const filteredLocal = filter === "all" ? local : local.filter((a: any) => a.difficulty === filter);
        setArticles([...(filteredLocal || []), ...(d.articles || [])]);
        setLoading(false);
      }).catch(() => setLoading(false));
  };

  useEffect(() => { loadArticles(); }, [filter]);

  const generateArticle = async () => {
    setGenerating(true);
    const resp = await fetch("/api/english/reading/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level: filter === "cet6" ? "cet6" : "cet4", topic: "education and technology", difficulty }),
    });
    const article = await resp.json();
    const saved = JSON.parse(localStorage.getItem("learnos_ai_articles") || "[]");
    localStorage.setItem("learnos_ai_articles", JSON.stringify([article, ...saved].slice(0, 20)));
    setArticles((prev) => [article, ...prev]);
    setGenerating(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const resp = await fetch("/api/english/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: "reading", level: filter === "cet6" ? "cet6" : "cet4", count: 2, difficulty }),
      });
      const data = await resp.json();
      if (data.success && data.articles?.length) {
        const saved = JSON.parse(localStorage.getItem("learnos_ai_articles") || "[]");
        const merged = [...data.articles, ...saved].slice(0, 20);
        localStorage.setItem("learnos_ai_articles", JSON.stringify(merged));
        loadArticles();
      }
    } catch {}
    setRefreshing(false);
  };

  const handleContentImported = (content: any) => {
    if (content.paragraphs) {
      const article = { ...content, id: content.id || `imported-${Date.now()}` };
      const saved = JSON.parse(localStorage.getItem("learnos_ai_articles") || "[]");
      localStorage.setItem("learnos_ai_articles", JSON.stringify([article, ...saved].slice(0, 20)));
      setArticles(prev => [article, ...prev]);
    }
  };

  const levels: Record<string, string> = { cet4: "四级", cet6: "六级" };
  const colors: Record<string, string> = { cet4: "badge-success", cet6: "badge-warning" };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">📖 阅读理解</h1>
          <p className="text-sm text-zinc-500 mt-1">限时做题 · AI解析 · 原文定位 · 全文翻译 · 长难句分析</p>
        </div>
        <DifficultyPicker value={difficulty} onChange={setDifficulty} />
        <div className="flex items-center gap-2 mt-3">
          <LinkImporter moduleName="阅读训练" onContentImported={handleContentImported} />
          <button onClick={handleRefresh} disabled={refreshing}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1">
            {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            刷新题库
          </button>
          <button onClick={() => router.push("/english/history?tab=reading")}
            className="btn-secondary text-xs px-3 py-2 flex items-center gap-1">
            <History className="w-3.5 h-3.5" /> 历史
          </button>
          <button onClick={generateArticle} disabled={generating}
            className="btn-primary text-xs px-3 py-2 flex items-center gap-1">
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI生成新题
          </button>
          <div className="flex gap-1 bg-zinc-100 rounded-lg p-1">
            {["all", "cet4", "cet6"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={"px-3 py-1.5 rounded-md text-xs font-medium transition-all " + (filter === f ? "bg-white shadow-sm" : "text-zinc-500")}>
                {f === "all" ? "全部" : levels[f]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 继续上次 */}
      {(() => {
        const saved = loadTrainingState("reading");
        if (saved?.answers?.articleId) {
          const local = JSON.parse(localStorage.getItem("learnos_ai_articles") || "[]");
          const art = local.find((a: any) => a.id === saved.answers.articleId);
          return (
            <button onClick={() => router.push(`/english/reading/${saved.answers.articleId}`)}
              className="card border-amber-200 bg-amber-50 mb-4 p-4 w-full text-left hover:shadow flex items-center justify-between">
              <div>
                <p className="font-medium text-amber-800 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> 继续上次阅读
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  {art?.title || "未命名"} · 第 {saved.currentIndex + 1} 题 · {saved.answers.userAnswers?.length || 0} 题已答
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-500" />
            </button>
          );
        }
        return null;
      })()}

      {loading ? <p className="text-zinc-400 text-center py-12">加载中…</p> :
        articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400 mb-4">暂无文章</p>
            <p className="text-sm text-zinc-400">点击"AI生成新题"或"刷新题库"获取阅读材料，也可"导入链接"添加外部题目</p>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((a: any) => (
              <button key={a.id} onClick={() => router.push("/english/reading/" + a.id)}
                className="card-hover w-full text-left flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={colors[a.difficulty] || "badge"}>{levels[a.difficulty] || a.difficulty}</span>
                    <span className={"text-xs font-semibold px-1.5 py-0.5 rounded "+(difficulty==="easy"?"text-emerald-600 bg-emerald-50":difficulty==="medium"?"text-amber-600 bg-amber-50":difficulty==="hard"?"text-red-600 bg-red-50":"text-zinc-500 bg-zinc-100")}>{difficulty==="easy"?"🟢基础":difficulty==="medium"?"🟡中等":difficulty==="hard"?"🔴困难":"🔀综合"}</span>
                    <span className="text-xs text-zinc-400">{a.topic}</span>
                    {a.id?.startsWith("ai-") && <span className="badge badge-primary">AI原创</span>}
                    {a.id?.startsWith("refreshed-") && <span className="badge badge-success">新题</span>}
                    {a.id?.startsWith("imported-") && <span className="badge badge-warning">链接导入</span>}
                  </div>
                  <h3 className="font-semibold">{a.title}</h3>
                  <p className="text-xs text-zinc-400 mt-1">{a.wordCount}词 · {a.questionCount}题</p>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-300" />
              </button>
            ))}
          </div>
        )}

      <AiSearchBox moduleName="阅读训练" placeholder="问关于阅读技巧、题型解析、长难句理解…" />
    </div>
  );
}
