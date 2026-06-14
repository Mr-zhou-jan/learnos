"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, TrendingUp } from "lucide-react";
import { useEnglishStore } from "@/stores/english-store";

export default function HistoryPage() {
  const router = useRouter();
  const { readingHistory, loadFromStorage } = useEnglishStore();
  useEffect(() => { loadFromStorage(); }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <button onClick={() => router.push("/english")} className="text-sm text-zinc-500 hover:text-zinc-700 mb-6 flex items-center gap-1">← 返回</button>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">做题历史</h1>
      {readingHistory.length === 0 ? (
        <div className="text-center py-16 text-zinc-400"><TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>还没有做题记录</p></div>
      ) : (
        <div className="space-y-2">
          {readingHistory.map(r => (
            <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
              <div className={"w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 " + (r.score >= 80 ? "bg-emerald-100 text-emerald-700" : r.score >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>{r.score}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-900 dark:text-white">{r.articleTitle}</p>
                <p className="text-xs text-zinc-400">{r.correctAnswers || r.score/100 * r.totalQuestions}/{r.totalQuestions} 正确 · {Math.floor(r.totalTime/60)}分{r.totalTime%60}秒</p>
              </div>
              <span className="text-xs text-zinc-400">{new Date(r.completedAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
