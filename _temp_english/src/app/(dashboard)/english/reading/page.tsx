"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Clock, Filter } from "lucide-react";

interface ArticleItem {
  id: string; title: string; difficulty: string; topic: string; wordCount: number; questionCount: number;
}

export default function ReadingListPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const url = filter === "all" ? "/api/english/articles" : "/api/english/articles?difficulty=" + filter;
    fetch(url).then(r => r.json()).then(d => setArticles(d.articles || [])).catch(() => {});
  }, [filter]);

  const levelLabel: Record<string, string> = { cet4: "四级", cet6: "六级", postgraduate: "考研" };
  const levelColor: Record<string, string> = { cet4: "bg-emerald-100 text-emerald-700", cet6: "bg-amber-100 text-amber-700", postgraduate: "bg-red-100 text-red-700" };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <button onClick={() => router.push("/english")} className="text-sm text-zinc-500 hover:text-zinc-700 mb-6 flex items-center gap-1">
        ← 返回英语学习
      </button>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">阅读理解</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">{articles.length} 篇文章</p>
        </div>
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
          {["all", "cet4", "cet6", "postgraduate"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={"px-3 py-1.5 rounded-md text-xs font-medium transition-all " + (filter === f ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700")}>
              {f === "all" ? "全部" : levelLabel[f] || f}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {articles.map(a => (
          <button key={a.id} onClick={() => router.push("/english/reading/" + a.id)}
            className="w-full p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-left hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={"text-xs px-2 py-0.5 rounded-full font-medium " + (levelColor[a.difficulty] || "bg-zinc-100 text-zinc-600")}>{levelLabel[a.difficulty] || a.difficulty}</span>
                  <span className="text-xs text-zinc-400">{a.topic}</span>
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white group-hover:text-primary-600 transition-colors">{a.title}</h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400">
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{a.wordCount}词</span>
                  <span>{a.questionCount}道题</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-primary-500 shrink-0 ml-4 transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
