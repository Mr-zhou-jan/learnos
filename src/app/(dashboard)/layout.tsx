"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, BookmarkX, Brain, CalendarCheck, ChevronDown, Compass, FileText, Globe, GraduationCap, Headphones, Languages, LayoutDashboard, Lightbulb, Link2, LogOut, MessageSquare, PenLine, Target, User, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import ClickTranslate from "@/components/english/ClickTranslate";
import { getCurrentUser, logout } from "@/lib/user-store";

const MAIN_NAV = [
  { href: "/cockpit", label: "驾驶舱", icon: LayoutDashboard },
  { href: "/goals", label: "学习目标", icon: Target },
  { href: "/today", label: "今日任务", icon: CalendarCheck },
  { href: "/knowledge", label: "知识图谱", icon: Brain },
  { href: "/score-target", label: "分数目标", icon: GraduationCap },
];
const LEARN_NAV = [
  { href: "/english", label: "英语总览", icon: Globe },
  { href: "/english/exam", label: "整卷练习", icon: FileText },
  { href: "/english/reading", label: "阅读训练", icon: BookOpen },
  { href: "/english/listening", label: "听力训练", icon: Headphones },
  { href: "/english/writing", label: "作文批改", icon: PenLine },
  { href: "/english/translation", label: "翻译训练", icon: Languages },
  { href: "/english/matching", label: "段落匹配", icon: Link2 },
  { href: "/english/cloze", label: "选词填空", icon: FileText },
  { href: "/english/vocab", label: "词汇语法", icon: Zap },
];
const REVIEW_NAV = [
  { href: "/error-book", label: "错题集", icon: BookmarkX },
  { href: "/memory", label: "记忆卡片", icon: Lightbulb },
  { href: "/evaluation", label: "掌握度评估", icon: GraduationCap },
  { href: "/coach", label: "AI教练", icon: MessageSquare },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getCurrentUser();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleGroup = (title: string) => {
    setCollapsed(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const NavGroup = ({ title, items }: { title: string; items: typeof MAIN_NAV }) => {
    const isCollapsed = collapsed[title] || false;

    return (
      <div className="mb-3">
        <button
          onClick={() => toggleGroup(title)}
          className="flex items-center justify-between w-full px-3 py-1 mb-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider hover:text-zinc-600 transition-colors"
        >
          <span>{title}</span>
          <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", isCollapsed && "-rotate-90")} />
        </button>
        <div className={cn("space-y-0.5 overflow-hidden transition-all duration-300", isCollapsed ? "max-h-0 opacity-0" : "max-h-[600px] opacity-100")}>
          {items.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}
                className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  active ? "bg-primary-50 text-primary-700 shadow-sm" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900")}>
                <item.icon className={cn("w-5 h-5 transition-colors", active ? "text-primary-500" : "text-zinc-400")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-zinc-50">
      <aside className="w-60 bg-white border-r border-zinc-200 flex flex-col">
        <Link href="/cockpit" className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-zinc-900">LearnOS</span>
        </Link>
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <NavGroup title="核心" items={MAIN_NAV} />
          <NavGroup title="学习" items={LEARN_NAV} />
          <NavGroup title="复习" items={REVIEW_NAV} />
        </nav>
        <div className="border-t p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="w-4 h-4 text-primary-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user?.name || "学习者"}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email || "Lv.1 新生"}</p>
          </div>
          <button onClick={() => { logout(); router.push("/"); }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"
            title="切换账号">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><div className="animate-fade-in">{children}</div></main>
      <ClickTranslate />
    </div>
  );
}
