"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, CheckCircle2, Zap, BookOpen } from "lucide-react";
import { classifySubject, isCalcSubject, getSubjectApproach } from "@/lib/engine/learning-methods";

interface Section { name: string; desc: string; progress: number; }

const CALC_CHAPTERS: Record<string, Section[]> = {
  "高等数学": [
    { name: "函数与极限", desc: "极限概念·无穷小·连续性", progress: 0 },
    { name: "导数与微分", desc: "定义·求导法则·高阶导数·微分", progress: 0 },
    { name: "中值定理与导数应用", desc: "罗尔·拉格朗日·洛必达·单调极值", progress: 0 },
    { name: "不定积分", desc: "原函数·换元积分·分部积分", progress: 0 },
    { name: "定积分", desc: "牛莱公式·广义积分·定积分应用", progress: 0 },
    { name: "微分方程", desc: "一阶·二阶常系数·可降阶", progress: 0 },
  ],
  "大学物理": [
    { name: "质点运动学", desc: "位移·速度·加速度·圆周运动", progress: 0 },
    { name: "牛顿定律", desc: "三大定律·受力分析·摩擦力", progress: 0 },
    { name: "动量与能量", desc: "动量守恒·动能定理·机械能守恒", progress: 0 },
    { name: "刚体转动", desc: "转动惯量·角动量·转动动能", progress: 0 },
  ],
  "工程力学": [
    { name: "静力学基础", desc: "力·力矩·力偶·约束·受力图", progress: 0 },
    { name: "平面力系", desc: "汇交力系·力偶系·任意力系简化", progress: 0 },
    { name: "材料力学基础", desc: "应力·应变·胡克定律·拉压", progress: 0 },
  ],
};

function getChapters(sub: string): Section[] {
  for (const [k, v] of Object.entries(CALC_CHAPTERS)) if (sub.includes(k)) return v;
  return [{ name: `${sub}基础`, desc: "核心定义与原理", progress: 0 },{ name: `${sub}核心`, desc: "关键公式与方法", progress: 0 },{ name: `${sub}进阶`, desc: "综合题型与技巧", progress: 0 }];
}

export default function SubjectPage() {
  const { subject } = useParams() as { subject: string };
  const router = useRouter();
  const decoded = decodeURIComponent(subject);
  const cat = classifySubject(decoded);
  const isCalc = isCalcSubject(decoded);
  const approach = getSubjectApproach(cat);
  const chapters = getChapters(decoded);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`learnos_progress_${decoded}`) || "{}");
      chapters.forEach(ch => { if (saved[ch.name]) ch.progress = saved[ch.name]; });
    } catch {}
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => router.push("/")} className="text-sm text-zinc-500 hover:text-zinc-700 mb-4 flex items-center gap-1"><ArrowLeft className="w-4 h-4"/>切换学科</button>

      <div className="card-glass p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{isCalc ? "📐" : "📚"}</span>
          <div><h1 className="text-2xl font-bold">{decoded}</h1><p className="text-sm text-zinc-500">{isCalc ? "计算型·题型闯关" : cat === "programming" ? "技能型·项目驱动" : "理解型·概念辨析"}</p></div>
        </div>
        <p className="text-sm text-zinc-600 bg-zinc-50 rounded-xl p-4">{approach}</p>
      </div>

      <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary-500"/>{isCalc ? "速通路径：概念→例题→同类题×3→变式×2→章节测试" : "学习章节"}</h2>

      <div className="space-y-2">
        {chapters.map((ch, i) => (
          <button key={ch.name} onClick={() => router.push(`/subjects/${encodeURIComponent(decoded)}/${encodeURIComponent(ch.name)}`)}
            className="card-hover w-full text-left p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ch.progress >= 80 ? "bg-emerald-100 text-emerald-600" : ch.progress > 0 ? "bg-amber-100 text-amber-600" : "bg-zinc-100 text-zinc-400"}`}>
              {ch.progress >= 80 ? <CheckCircle2 className="w-5 h-5"/> : ch.progress > 0 ? <Zap className="w-5 h-5"/> : <span className="text-sm font-bold">{i + 1}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2"><p className="font-semibold text-sm">{ch.name}</p>{ch.progress > 0 && ch.progress < 80 && <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">{ch.progress}%</span>}</div>
              <p className="text-xs text-zinc-500">{ch.desc}</p>
              {ch.progress > 0 && <div className="mt-1.5 w-full h-1 bg-zinc-100 rounded-full overflow-hidden"><div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${ch.progress}%` }}/></div>}
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-300 shrink-0"/>
          </button>
        ))}
      </div>
    </div>
  );
}
