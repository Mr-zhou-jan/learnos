"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Trash2, BookOpen, Link2, FileText, Languages, PenLine, BookMarked, Headphones } from "lucide-react";
import { getErrorBookByModule, getStubbornVocabWords, toggleErrorBook, type TrainingRecord } from "@/lib/use-training-memory";
import { getMathErrors, removeMathError, getMathErrorCount, type MathError } from "@/lib/math-error-store";

const MODS: Record<string, { label: string; icon: any; bg: string }> = {
  reading: { label: "阅读训练", icon: BookOpen, bg: "bg-blue-50 text-blue-700" },
  listening: { label: "听力训练", icon: Headphones, bg: "bg-cyan-50 text-cyan-700" },
  writing: { label: "作文批改", icon: PenLine, bg: "bg-purple-50 text-purple-700" },
  translation: { label: "翻译训练", icon: Languages, bg: "bg-amber-50 text-amber-700" },
  matching: { label: "段落匹配", icon: Link2, bg: "bg-emerald-50 text-emerald-700" },
  cloze: { label: "选词填空", icon: FileText, bg: "bg-rose-50 text-rose-700" },
  vocab: { label: "单词背诵", icon: BookMarked, bg: "bg-orange-50 text-orange-700" },
};

function ErrorBookInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const targetId = sp.get("id") || "";
  const [grouped, setGrouped] = useState<Record<string, TrainingRecord[]>>({});
  const [stubborn, setStubborn] = useState<{ word: string; wrongCount: number }[]>([]);
  const [mathErrors, setMathErrors] = useState<MathError[]>([]);
  const [tab, setTab] = useState("all");
  const refresh = () => { setGrouped(getErrorBookByModule()); setStubborn(getStubbornVocabWords()); setMathErrors(getMathErrors()); };
  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    if (targetId) setTimeout(() => document.getElementById(`err-${targetId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 400);
  }, [targetId, grouped]);
  const mods = Object.keys(grouped);
  const allEnglish = Object.values(grouped).flat();
  const allCount = allEnglish.length + mathErrors.length;
  const englishList = tab === "all" ? allEnglish : (grouped[tab] || []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-zinc-100"><ArrowLeft className="w-5 h-5" /></button>
        <div><h1 className="text-2xl font-bold">📋 错题集</h1><p className="text-sm text-zinc-500">{allCount} 道错题</p></div>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setTab("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${tab==="all"?"bg-primary-500 text-white":"bg-zinc-100"}`}>全部({allCount})</button>
        {mathErrors.length>0&&<button onClick={()=>setTab("math")} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${tab==="math"?"bg-orange-500 text-white":"bg-orange-50 text-orange-700"}`}>📐 数学({mathErrors.length})</button>}
        {mods.map(m=> <button key={m} onClick={()=>setTab(m)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${tab===m?"bg-primary-500 text-white":"bg-zinc-100"}`}>{MODS[m]?.label||m}({grouped[m].length})</button>)}
        {stubborn.length>0&&<button onClick={()=>setTab("stubborn")} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${tab==="stubborn"?"bg-red-500 text-white":"bg-red-50 text-red-600"}`}>🔥顽固词({stubborn.length})</button>}
      </div>
      {tab==="stubborn"&&<div className="space-y-2">{stubborn.map((s,i)=><div key={i} className="card p-4 flex items-center justify-between"><div><p className="font-bold text-lg">{s.word}</p><p className="text-sm text-red-500">答错{s.wrongCount}次</p></div><button onClick={()=>router.push("/english/vocab")} className="btn-primary text-xs px-3 py-1.5">去背诵</button></div>)}</div>}
      {/* 数学错题 */}
      {(tab==="all"||tab==="math")&&mathErrors.length>0&&<div className="mb-6">
        {tab==="math"&&<h3 className="font-bold text-sm mb-2 text-orange-700">📐 高等数学 · {mathErrors.length} 道错题</h3>}
        <div className="space-y-2">
          {mathErrors.map(e=>(<div key={e.id} className="card p-4"><div className="flex items-start justify-between mb-2"><span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">{e.chapter}</span><button onClick={()=>{removeMathError(e.id);refresh();}} className="text-xs text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3 inline mr-0.5"/>移除</button></div><p className="text-sm font-medium mb-2">{e.question}</p><div className="grid grid-cols-2 gap-2 text-xs"><div className="p-2 bg-red-50 rounded"><span className="text-red-500">你的：</span>{e.options[e.userAnswer]}</div><div className="p-2 bg-emerald-50 rounded"><span className="text-emerald-600">正确：</span>{e.options[e.correctIndex]}</div></div><p className="text-xs text-zinc-500 mt-2">{e.explanation}</p><p className="text-xs text-zinc-400 mt-2">{new Date(e.timestamp).toLocaleString("zh-CN")}</p></div>))}
        </div>
      </div>}
      {tab==="math"&&mathErrors.length===0&&<div className="card text-center py-12"><p className="text-zinc-500">数学暂无错题 🎉</p></div>}
      {tab!=="stubborn"&&tab!=="math"&&<div className="space-y-3">
        {englishList.length===0&&<div className="card text-center py-12"><p className="text-zinc-500">{tab==="all"?"还没有错题":"该模块暂无错题"}</p></div>}
        {englishList.map(r=>{const m=MODS[r.module]||{label:r.module,bg:"bg-zinc-50 text-zinc-700"};return(<div key={r.id} id={`err-${r.id}`} className={`card p-4 ${r.id===targetId?"ring-2 ring-primary-400 bg-primary-50":""}`}><div className="flex items-start justify-between mb-2"><span className={`text-xs px-2 py-0.5 rounded-full ${m.bg}`}>{m.label}</span><button onClick={()=>{toggleErrorBook(r.id);refresh();}} className="text-xs text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3 inline mr-0.5"/>移除</button></div><p className="text-sm font-medium mb-2">{r.question}</p><div className="grid grid-cols-2 gap-2 text-xs"><div className="p-2 bg-red-50 rounded"><span className="text-red-500">你的：</span>{r.userAnswer}</div><div className="p-2 bg-emerald-50 rounded"><span className="text-emerald-600">正确：</span>{r.correctAnswer}</div></div>{r.explanation&&<p className="text-xs text-zinc-500 mt-2">{r.explanation}</p>}<p className="text-xs text-zinc-400 mt-2">{new Date(r.date).toLocaleString("zh-CN")}</p></div>)})}
      </div>}
    </div>
  );
}

export default function ErrorBookPage() {
  return <Suspense fallback={<div className="p-12 text-center text-zinc-400">加载中…</div>}><ErrorBookInner/></Suspense>;
}
