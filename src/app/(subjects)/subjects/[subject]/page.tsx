"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, CheckCircle2, Zap, BookOpen, Star } from "lucide-react";
import { classifySubject, isCalcSubject, getSubjectApproach } from "@/lib/engine/learning-methods";
import { getChapterList } from "@/data/math";

function getChapters(sub: string) {
  const fromPreset = getChapterList(sub);
  if (fromPreset.length > 0) return fromPreset.map(c => ({ name: c.name, desc: `${c.score} · ${"★".repeat(c.weight)}`, progress: 0 }));
  // fallback
  const FALLBACKS: Record<string, string[]> = {
    "大学物理": ["质点运动学","牛顿定律","动量与能量","刚体转动"],
    "工程力学": ["静力学基础","平面力系","材料力学基础"],
  };
  for (const [k, v] of Object.entries(FALLBACKS)) if (sub.includes(k)) return v.map(n => ({ name: n, desc: "", progress: 0 }));
  return [{ name: `${sub}基础`, desc: "", progress: 0 }, { name: `${sub}核心`, desc: "", progress: 0 }, { name: `${sub}进阶`, desc: "", progress: 0 }];
}

export default function SubjectPage() {
  const { subject } = useParams() as { subject: string };
  const router = useRouter();
  const decoded = decodeURIComponent(subject);
  const cat = classifySubject(decoded);
  const isCalc = isCalcSubject(decoded);
  const chapters = getChapters(decoded);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`learnos_progress_${decoded}`) || "{}");
      chapters.forEach(ch => { if (saved[ch.name]) ch.progress = saved[ch.name]; });
    } catch {}
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="card-glass p-6 mb-6">
        <div className="flex items-center gap-3 mb-3"><span className="text-3xl">{isCalc ? "📐" : "📚"}</span><div><h1 className="text-2xl font-bold">{decoded}</h1><p className="text-sm text-zinc-500">{isCalc ? "计算型·题型闯关" : cat === "programming" ? "技能型·项目驱动" : "理解型·概念辨析"}</p></div></div>
        <p className="text-sm text-zinc-600 bg-zinc-50 rounded-xl p-4">{getSubjectApproach(cat)}</p>
      </div>

      <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary-500"/>{isCalc ? "速通：概念→例题→同类×3→变式×2→测试" : "学习章节"}</h2>
      <div className="space-y-2">
        {chapters.map((ch, i) => (
          <button key={ch.name} onClick={() => router.push(`/subjects/${encodeURIComponent(decoded)}/${encodeURIComponent(ch.name)}`)}
            className="card-hover w-full text-left p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ch.progress >= 80 ? "bg-emerald-100 text-emerald-600" : ch.progress > 0 ? "bg-amber-100 text-amber-600" : "bg-zinc-100 text-zinc-400"}`}>
              {ch.progress >= 80 ? <CheckCircle2 className="w-5 h-5"/> : ch.progress > 0 ? <Zap className="w-5 h-5"/> : <span className="text-sm font-bold">{i + 1}</span>}
            </div>
            <div className="flex-1"><p className="font-semibold text-sm">{ch.name}</p>{ch.desc && <p className="text-xs text-zinc-400">{ch.desc}</p>}</div>
            <ChevronRight className="w-5 h-5 text-zinc-300"/>
          </button>
        ))}
      </div>
    </div>
  );
}
