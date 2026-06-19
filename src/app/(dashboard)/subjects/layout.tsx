"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Compass, LayoutDashboard, Brain, BookmarkX, ChevronDown, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const SUBJECT_NAVS: Record<string, { href: string; label: string }[]> = {
  "高等数学": ["函数与极限","导数与微分","中值定理与导数应用","不定积分","定积分","微分方程"].map(l=>({href:`/subjects/高等数学/${encodeURIComponent(l)}`,label:l})),
  "大学物理": ["质点运动学","牛顿定律","动量与能量","刚体转动"].map(l=>({href:`/subjects/大学物理/${encodeURIComponent(l)}`,label:l})),
  "工程力学": ["静力学基础","平面力系","材料力学基础"].map(l=>({href:`/subjects/工程力学/${encodeURIComponent(l)}`,label:l})),
  "C++": ["基础语法","类和对象","指针与引用","STL容器","继承与多态"].map(l=>({href:`/subjects/C++/${encodeURIComponent(l)}`,label:l})),
  "Python": ["基础语法","函数与模块","面向对象","文件操作","常用库"].map(l=>({href:`/subjects/Python/${encodeURIComponent(l)}`,label:l})),
  "互换性测量": ["公差与配合","形位公差","表面粗糙度","测量技术"].map(l=>({href:`/subjects/互换性测量/${encodeURIComponent(l)}`,label:l})),
};

export default function SubjectsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const segs = pathname.split("/").filter(Boolean);
  const subject = segs.length > 1 ? decodeURIComponent(segs[1]) : "";
  const chapters = SUBJECT_NAVS[subject] || [{ href: `/subjects/${encodeURIComponent(subject)}`, label: "章节列表" }];
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try { setProgress(JSON.parse(localStorage.getItem(`learnos_progress_${subject}`) || "{}")); } catch {}
  }, [subject]);

  const done = Object.values(progress).filter((v: any) => v >= 80).length;
  const pct = chapters.length > 0 ? Math.round((done / chapters.length) * 100) : 0;

  return (
    <div className="flex h-screen bg-zinc-50">
      <aside className="w-60 bg-white border-r border-zinc-200 flex flex-col shrink-0">
        <Link href="/" className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 hover:bg-zinc-50">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"><Compass className="w-5 h-5 text-white"/></div>
          <span className="font-bold text-lg text-zinc-900">LearnOS</span>
        </Link>
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="mb-4 px-1">
            <div className="flex items-center gap-2 mb-1"><span className="text-lg">📐</span><p className="text-sm font-bold truncate">{subject||"学科"}</p></div>
            <p className="text-[10px] text-zinc-400">总进度 {done}/{chapters.length} · {pct}%</p>
            <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden mt-1"><div className="h-full bg-primary-500 rounded-full transition-all" style={{width:`${pct}%`}}/></div>
          </div>
          <div className="mb-3">
            <button onClick={()=>setCollapsed(!collapsed)} className="flex items-center justify-between w-full px-3 py-1 mb-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider hover:text-zinc-600"><span>章节</span><ChevronDown className={cn("w-3 h-3 transition-transform",collapsed&&"-rotate-90")}/></button>
            <div className={cn("space-y-0.5 overflow-hidden transition-all",collapsed?"max-h-0 opacity-0":"max-h-[600px]")}>
              {chapters.map(ch=>{const active=pathname.includes(encodeURIComponent(ch.label));const isDone=(progress[ch.label]||0)>=80;return(
                <Link key={ch.href} href={ch.href} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors",active?"bg-primary-50 text-primary-700 font-semibold":isDone?"text-emerald-600":"text-zinc-500 hover:bg-zinc-50")}><span className="shrink-0">{isDone?"✅":active?"🔵":"⬜"}</span><span className="truncate">{ch.label}</span></Link>
              );})}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-100">
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-3 mb-1">通用</p>
            {[{href:"/cockpit",label:"驾驶舱",icon:LayoutDashboard},{href:"/knowledge",label:"知识图谱",icon:Brain},{href:"/error-book",label:"错题集",icon:BookmarkX}].map(m=>
              <Link key={m.href} href={m.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",pathname===m.href?"bg-primary-50 text-primary-700":"text-zinc-600 hover:bg-zinc-100")}><m.icon className="w-5 h-5 text-zinc-400"/>{m.label}</Link>
            )}
          </div>
        </nav>
        <div className="border-t p-3">
          <button onClick={()=>router.push("/english")} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 text-primary-700 text-sm font-medium hover:bg-purple-50 transition-colors">📖 切换到英语</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-page">{children}</main>
    </div>
  );
}
