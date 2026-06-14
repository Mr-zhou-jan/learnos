"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookmarkX, CalendarCheck, ChevronDown, Compass, Download, Ellipsis, Globe, GraduationCap, LayoutDashboard, LogOut, MessageSquare, Target, User } from "lucide-react";
import { cn } from "@/lib/utils";
import ClickTranslate from "@/components/english/ClickTranslate";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { getCurrentUser, logout } from "@/lib/user-store";

// 桌面侧边栏
const PRIMARY_NAV = [
  { href: "/today", label: "今日任务", icon: CalendarCheck },
  { href: "/english", label: "英语训练", icon: Globe },
  { href: "/error-book", label: "错题集", icon: BookmarkX },
  { href: "/coach", label: "AI 教练", icon: MessageSquare },
];
const MORE_NAV = [
  { href: "/cockpit", label: "驾驶舱", icon: LayoutDashboard },
  { href: "/goals", label: "学习目标", icon: Target },
  { href: "/knowledge", label: "知识图谱", icon: GraduationCap },
  { href: "/score-target", label: "分数目标", icon: GraduationCap },
  { href: "/memory", label: "记忆卡片", icon: LayoutDashboard },
  { href: "/evaluation", label: "掌握度评估", icon: GraduationCap },
];

// 移动端底部TabBar
const MOBILE_TABS = [
  { href: "/today", label: "今日", icon: CalendarCheck },
  { href: "/english", label: "英语", icon: Globe },
  { href: "/error-book", label: "错题", icon: BookmarkX },
  { href: "/coach", label: "AI", icon: MessageSquare },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getCurrentUser();
  const [showMore, setShowMore] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const handleExport = () => {
    const data: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("learnos_")) {
        try { data[key] = JSON.parse(localStorage.getItem(key) || ""); } catch { data[key] = localStorage.getItem(key); }
      }
    }
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data })], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `learnos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  // 桌面侧边栏
  const DesktopSidebar = () => (
    <aside className="w-56 bg-white border-r border-zinc-200 flex flex-col h-full">
      <Link href="/today" className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
        <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
          <Compass className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg text-zinc-900">LearnOS</span>
      </Link>
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        <p className="px-3 mb-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">核心</p>
        {PRIMARY_NAV.map(item => (
          <Link key={item.href} href={item.href}
            className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isActive(item.href) ? "bg-primary-50 text-primary-700 shadow-sm" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900")}>
            <item.icon className={cn("w-5 h-5", isActive(item.href) ? "text-primary-500" : "text-zinc-400")} />{item.label}
          </Link>
        ))}
        <div className="mt-4">
          <button onClick={() => setShowMore(!showMore)}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-all duration-200">
            <span className="flex items-center gap-3"><Ellipsis className="w-5 h-5 text-zinc-400" />更多</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", showMore && "-rotate-180")} />
          </button>
          {showMore && (
            <div className="mt-1 ml-2 border-l-2 border-zinc-100 pl-2 space-y-0.5 animate-slide-up">
              {MORE_NAV.map(item => (
                <Link key={item.href} href={item.href}
                  className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive(item.href) ? "bg-primary-50 text-primary-700" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900")}>
                  <item.icon className={cn("w-5 h-5", isActive(item.href) ? "text-primary-500" : "text-zinc-400")} />{item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
      <div className="border-t p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
          <User className="w-4 h-4 text-primary-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{user?.name || "学习者"}</p>
          <p className="text-xs text-zinc-500 truncate">{user?.email || "Lv.1 新生"}</p>
        </div>
        <button onClick={handleExport} className="p-1.5 rounded-lg hover:bg-primary-50 text-zinc-400 hover:text-primary-500 transition-colors" title="导出数据">
          <Download className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => { logout(); router.push("/"); }} className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors" title="切换账号">
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );

  // 移动端底部TabBar
  const MobileTabBar = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {MOBILE_TABS.map(tab => {
          const active = isActive(tab.href);
          return (
            <Link key={tab.href} href={tab.href}
              className={cn("flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                active ? "text-primary-600" : "text-zinc-400")}>
              <tab.icon className={cn("w-5 h-5", active && "text-primary-500")} />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {active && <div className="w-1 h-1 rounded-full bg-primary-500" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );

  return (
    <div className="flex h-screen bg-zinc-50">
      {/* 桌面侧边栏 */}
      <div className="hidden md:flex h-full"><DesktopSidebar /></div>

      {/* 主内容 */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <ErrorBoundary><div className="animate-fade-in p-4 md:p-6">{children}</div></ErrorBoundary>
      </main>

      {/* 移动端底部TabBar */}
      <div className="md:hidden"><MobileTabBar /></div>

      <ClickTranslate />
    </div>
  );
}
