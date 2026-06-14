"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { BookOpen, History, PenLine, Sun, Moon } from "lucide-react";
import { useEnglishStore } from "@/stores/english-store";

export default function EnglishHome() {
  const router = useRouter();
  const pathname = usePathname();
  const { darkMode, toggleDark, loadFromStorage } = useEnglishStore();
  useEffect(() => { loadFromStorage(); }, []);

  const tabs = [
    { label: "阅读训练", icon: BookOpen, path: "/english/reading" },
    { label: "生词本", icon: PenLine, path: "/english/wordbook" },
    { label: "做题历史", icon: History, path: "/english/history" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 transition-colors">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">英语学习</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">AI 驱动的智能英语训练平台</p>
          </div>
          <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            {darkMode ? <Sun className="w-5 h-5 text-zinc-400" /> : <Moon className="w-5 h-5 text-zinc-500" />}
          </button>
        </div>
        <div className="flex gap-1 mb-8 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
          {tabs.map(t => {
            const active = pathname.startsWith(t.path);
            return (
              <button key={t.path} onClick={() => router.push(t.path)}
                className={"flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all " + (active ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}>
                <t.icon className="w-4 h-4" />{t.label}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <QuickCard icon="📖" title="开始阅读训练" desc="四级/六级/考研文章，带题目和解析" onClick={() => router.push("/english/reading")} />
          <QuickCard icon="📝" title="我的生词本" desc="收藏的单词和好句随时复习" onClick={() => router.push("/english/wordbook")} />
        </div>
      </div>
    </div>
  );
}

function QuickCard({ icon, title, desc, onClick }: { icon: string; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-left hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm transition-all group">
      <div className="text-2xl mb-3">{icon}</div>
      <h3 className="font-semibold text-zinc-900 dark:text-white group-hover:text-primary-600 transition-colors">{title}</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{desc}</p>
    </button>
  );
}
