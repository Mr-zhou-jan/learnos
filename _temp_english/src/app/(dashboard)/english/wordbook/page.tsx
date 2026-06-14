"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, Trash2 } from "lucide-react";
import { useEnglishStore, WordbookItem } from "@/stores/english-store";

export default function WordbookPage() {
  const router = useRouter();
  const { wordbook, removeWord, loadFromStorage } = useEnglishStore();
  const [filter, setFilter] = useState("all");
  useEffect(() => { loadFromStorage(); }, []);

  const filtered = filter === "all" ? wordbook : wordbook.filter(w => w.type === filter);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <button onClick={() => router.push("/english")} className="text-sm text-zinc-500 hover:text-zinc-700 mb-6 flex items-center gap-1">← 返回</button>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">生词/好句本</h1>
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
          {["all", "word", "sentence", "chunk"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={"px-3 py-1.5 rounded-md text-xs font-medium " + (filter === f ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500")}>{f === "all" ? "全部" : f === "word" ? "单词" : f === "sentence" ? "好句" : "语块"}</button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>还没有收藏内容</p>
          <p className="text-sm mt-1">做题时点击"收藏句子"即可添加</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(w => (
            <div key={w.id} className="flex items-start gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
              <div className="flex-1 min-w-0">
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-500 mb-1 inline-block">{w.type === "word" ? "单词" : w.type === "sentence" ? "句子" : "语块"}</span>
                <p className="font-medium text-zinc-900 dark:text-white mt-1">{w.content}</p>
                {w.source && <p className="text-xs text-zinc-400 mt-1">来源：{w.source}</p>}
              </div>
              <button onClick={() => removeWord(w.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
