"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, Headphones, PenLine, Languages, Link2, FileText, Trash2 } from "lucide-react";
import { getTrainingRecords, type TrainingRecord } from "@/lib/use-training-memory";
import { userKey } from "@/lib/user-store";

const MODS: Record<string, { label: string; icon: any }> = {
  reading: { label: "阅读训练", icon: BookOpen },
  listening: { label: "听力训练", icon: Headphones },
  writing: { label: "作文批改", icon: PenLine },
  translation: { label: "翻译训练", icon: Languages },
  matching: { label: "段落匹配", icon: Link2 },
  cloze: { label: "选词填空", icon: FileText },
  exam: { label: "整卷练习", icon: FileText },
  vocab: { label: "词汇背诵", icon: BookOpen },
};

function EnglishHistoryInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [tab, setTab] = useState(sp.get("tab") || "all");
  const targetId = sp.get("id") || "";

  const load = () => setRecords(getTrainingRecords());
  useEffect(() => { load(); }, []);
  // 滚动到指定记录
  useEffect(() => {
    if (targetId) setTimeout(() => document.getElementById(`hist-${targetId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 400);
  }, [targetId, records]);

  const modules = ["reading","listening","writing","translation","matching","cloze","exam","vocab"];
  const englishRecords = records.filter(r => modules.includes(r.module));
  const filtered = tab === "all" ? englishRecords : englishRecords.filter(r => r.module === tab);
  const correct = englishRecords.filter(r => r.isCorrect).length;

  const clearHistory = () => {
    if (!confirm(`确定清除「${tab === "all" ? "全部模块" : MODS[tab]?.label || tab}」的历史记录？不可恢复。`)) return;
    const toRemove = tab === "all" ? englishRecords : englishRecords.filter(r => r.module === tab);
    const remaining = records.filter(r => !toRemove.includes(r));
    localStorage.setItem(userKey("learnos_training_records"), JSON.stringify(remaining));
    setRecords(remaining);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-zinc-100"><ArrowLeft className="w-5 h-5"/></button>
          <div>
            <h1 className="text-2xl font-bold">训练历史</h1>
            <p className="text-sm text-zinc-500">{filtered.length}条 · 正确{correct}题{englishRecords.length > 0 ? ` (${Math.round(correct/englishRecords.length*100)}%)` : ""}</p>
          </div>
        </div>
        {filtered.length > 0 && (
          <button onClick={clearHistory} className="btn-secondary text-xs px-3 py-2 flex items-center gap-1 text-red-500 hover:bg-red-50">
            <Trash2 className="w-3.5 h-3.5"/> 清除{tab==="all"?"全部":"本模块"}记录
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {["all",...modules].map(m => {
          const count = m === "all" ? englishRecords.length : englishRecords.filter(r => r.module === m).length;
          const mod = MODS[m] || { label: m, icon: BookOpen };
          return (
            <button key={m} onClick={() => setTab(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab===m?"bg-primary-500 text-white":"bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
              {m==="all"?"全部":mod.label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12"><BookOpen className="w-12 h-12 text-zinc-300 mx-auto mb-3"/><p className="text-zinc-500">暂无记录</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.slice(0, 200).map(r => {
            const mod = MODS[r.module] || { label: r.module, icon: BookOpen };
            return (
              <div key={r.id} id={`hist-${r.id}`} className={`card p-4 ${r.id===targetId?"ring-2 ring-primary-400 bg-primary-50":""}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <mod.icon className="w-4 h-4 text-zinc-400"/><span className="text-xs font-medium text-zinc-500">{mod.label}</span>
                    {r.title && <span className="text-xs text-zinc-400">· {r.title}</span>}
                  </div>
                  <span className={`text-xs font-bold ${r.isCorrect?"text-emerald-600":"text-red-500"}`}>{r.isCorrect?"正确":"错误"}</span>
                </div>
                <p className="text-sm text-zinc-700 mb-2 line-clamp-2">{r.question}</p>
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span>你的答案：<span className={r.isCorrect?"text-emerald-600":"text-red-500"}>{r.userAnswer}</span></span>
                  {!r.isCorrect && <span>正确答案：<span className="text-emerald-600">{r.correctAnswer}</span></span>}
                  <span className="ml-auto">{new Date(r.date).toLocaleString("zh-CN")}</span>
                </div>
                {r.explanation && <details className="mt-2 text-xs"><summary className="cursor-pointer text-primary-500">查看解析</summary><p className="mt-1 p-2 bg-zinc-50 rounded">{r.explanation}</p></details>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function EnglishHistoryPage() {
  return <Suspense fallback={<div className="p-12 text-center text-zinc-400">加载中…</div>}><EnglishHistoryInner/></Suspense>;
}
