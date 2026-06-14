"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// CET-4 category structure for knowledge graph
const CET_CATEGORIES = [
  {
    name: "阅读理解", icon: "📖", color: "border-l-blue-500",
    items: [
      { name: "选词填空", mastery: 0, total: 6 },
      { name: "段落匹配", mastery: 0, total: 4 },
      { name: "仔细阅读", mastery: 0, total: 8 },
    ]
  },
  {
    name: "听力训练", icon: "🎧", color: "border-l-purple-500",
    items: [
      { name: "短篇新闻听力", mastery: 0, total: 6 },
      { name: "长对话听力", mastery: 0, total: 4 },
      { name: "短文理解听力", mastery: 0, total: 6 },
    ]
  },
  {
    name: "写作训练", icon: "✍️", color: "border-l-emerald-500",
    items: [
      { name: "议论文写作", mastery: 0, total: 8 },
      { name: "书信写作", mastery: 0, total: 6 },
      { name: "图表作文", mastery: 0, total: 4 },
    ]
  },
  {
    name: "翻译训练", icon: "🌐", color: "border-l-amber-500",
    items: [
      { name: "文化类翻译", mastery: 0, total: 6 },
      { name: "经济类翻译", mastery: 0, total: 4 },
      { name: "社会类翻译", mastery: 0, total: 6 },
    ]
  },
  {
    name: "词汇语法", icon: "📚", color: "border-l-rose-500",
    items: [
      { name: "核心词汇", mastery: 0, total: 2000 },
      { name: "语法考点", mastery: 0, total: 24 },
      { name: "固定搭配", mastery: 0, total: 120 },
    ]
  },
];

export default function KnowledgePage() {
  const router = useRouter();
  const [quizResult, setQuizResult] = useState<any>(null);

  useEffect(() => {
    const quiz = localStorage.getItem("learnos_quiz_results");
    if (quiz) setQuizResult(JSON.parse(quiz));
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">知识图谱</h1>
      <p className="text-zinc-500 mb-6">CET-4/6 全题型掌握度追踪</p>

      {quizResult && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card text-center"><p className="text-2xl font-bold text-primary-600">{quizResult.totalQuestions}</p><p className="text-xs text-zinc-500">已诊断题数</p></div>
          <div className="card text-center"><p className="text-2xl font-bold text-emerald-600">{quizResult.totalCorrect}</p><p className="text-xs text-zinc-500">正确题数</p></div>
          <div className="card text-center"><p className="text-2xl font-bold text-amber-600">{quizResult.totalQuestions - quizResult.totalCorrect}</p><p className="text-xs text-zinc-500">待提升</p></div>
        </div>
      )}

      {!quizResult && (
        <div className="card text-center py-8 mb-6 border-amber-200 bg-amber-50">
          <Brain className="w-10 h-10 text-amber-500 mx-auto mb-2"/>
          <p className="font-semibold text-amber-800">尚未诊断</p>
          <p className="text-sm text-amber-600">完成诊断测验后自动生成掌握度数据</p>
        </div>
      )}

      <div className="space-y-4">
        {CET_CATEGORIES.map((cat, i) => (
          <div key={i} className={cn("card border-l-4", cat.color)}>
            <h3 className="font-bold mb-3">{cat.icon} {cat.name}</h3>
            <div className="space-y-2">
              {cat.items.map((item, j) => (
                <div key={j} className="flex items-center justify-between">
                  <span className="text-sm">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-zinc-100 rounded-full h-2">
                      <div className={cn("h-2 rounded-full", item.mastery>0?"bg-primary-500":"bg-zinc-200")} style={{width:`${Math.max(2,item.mastery)}%`}}/>
                    </div>
                    <span className="text-xs text-zinc-400 w-12 text-right">{item.total}题</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
