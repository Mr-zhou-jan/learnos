"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, BookmarkX, Brain, CalendarCheck, Camera, ChevronDown, Compass, FileText, Globe, GraduationCap, Headphones, Info, Languages, LayoutDashboard, Lightbulb, Link2, LogOut, Menu, MessageSquare, Moon, PenLine, Send, Shuffle, Smile, Sun, Target, User, UserPlus, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import ClickTranslate from "@/components/english/ClickTranslate";
import AvatarCropper from "@/components/shared/AvatarCropper";
import { getCurrentUser, getAllUsers, switchUser, logout } from "@/lib/user-store";
import { syncAllToCloud } from "@/lib/cloud-store";
import { useTheme } from "@/components/shared/ThemeProvider";

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

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getCurrentUser();
  const { dark, toggle: toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [modalAbout, setModalAbout] = useState(false);
  const [modalFeedback, setModalFeedback] = useState(false);
  const [modalSwitch, setModalSwitch] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSidebarOpen(false); }, [pathname]); // 路由变化关闭移动端侧边栏

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`learnos_avatar_${user.id}`);
      if (saved) setAvatar(saved); else setAvatar("");
    }
  }, [user]);

  // 定期同步所有用户数据到云端（每60秒）
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => { syncAllToCloud(user.id).catch(() => {}); }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAvatarSave = (dataUrl: string) => {
    if (!user) return;
    setAvatar(dataUrl);
    localStorage.setItem(`learnos_avatar_${user.id}`, dataUrl);
  };

  const handleFeedback = async () => {
    if (!feedbackText.trim()) return;
    setFeedbackLoading(true);
    try { await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: feedbackText, userName: user?.name, userEmail: user?.email }) }); } catch {}
    setFeedbackSent(true);
    setFeedbackLoading(false);
    setTimeout(() => { setModalFeedback(false); setFeedbackSent(false); setFeedbackText(""); }, 1500);
  };

  const toggleGroup = (title: string) => setCollapsed(prev => ({ ...prev, [title]: !prev[title] }));

  const NavGroup = ({ title, items }: { title: string; items: typeof MAIN_NAV }) => {
    const isCollapsed = collapsed[title] || false;
    return (
      <div className="mb-3">
        <button onClick={() => toggleGroup(title)} className="flex items-center justify-between w-full px-3 py-1 mb-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider hover:text-zinc-600 transition-colors">
          <span>{title}</span><ChevronDown className={cn("w-3 h-3 transition-transform duration-200", isCollapsed && "-rotate-90")} />
        </button>
        <div className={cn("space-y-0.5 overflow-hidden transition-all duration-300", isCollapsed ? "max-h-0 opacity-0" : "max-h-[600px] opacity-100")}>
          {items.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} prefetch className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200", active ? "bg-primary-50 text-primary-700 shadow-sm" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900")}>
                <item.icon className={cn("w-5 h-5 transition-colors", active ? "text-primary-500" : "text-zinc-400")} />{item.label}
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-zinc-50">
      {/* 桌面端侧边栏 */}
      <aside className="hidden lg:flex w-60 bg-white border-r border-zinc-200 flex-col shrink-0">
        <Link href="/cockpit" className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-zinc-900">LearnOS</span>
        </Link>
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <NavGroup title="核心" items={MAIN_NAV} /><NavGroup title="学习" items={LEARN_NAV} /><NavGroup title="复习" items={REVIEW_NAV} />
        </nav>

        {/* ===== 用户区 ===== */}
        <div className="border-t p-3 relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(!menuOpen)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 transition-colors group">
            <div className="relative shrink-0">
              {avatar ? (
                <img src={avatar} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-zinc-100" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center border-2 border-zinc-100">
                  <User className="w-4 h-4 text-indigo-400" />
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-2.5 h-2.5 text-zinc-400" />
              </div>
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-semibold truncate">{user?.name || "学习者"}</p>
              <p className="text-[11px] text-zinc-400 truncate">{user?.email || "Lv.1 新生"}</p>
            </div>
            <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-400 transition-transform duration-200", menuOpen && "rotate-180")} />
          </button>

          {menuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-2xl shadow-xl border border-zinc-200/60 overflow-hidden animate-slide-up z-50">
              <button onClick={() => { setMenuOpen(false); setCropperOpen(true); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"><Camera className="w-4 h-4 text-zinc-400" />更换头像</button>
              <button onClick={() => { setMenuOpen(false); setModalSwitch(true); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"><Shuffle className="w-4 h-4 text-zinc-400" />切换账号</button>
              <button onClick={() => { setMenuOpen(false); setModalAbout(true); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"><Info className="w-4 h-4 text-zinc-400" />关于我们</button>
              <button onClick={() => { setMenuOpen(false); setModalFeedback(true); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"><Smile className="w-4 h-4 text-zinc-400" />意见反馈</button>
              <button onClick={() => { setMenuOpen(false); toggleTheme(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors">{dark ? <><Sun className="w-4 h-4 text-amber-400"/>浅色模式</> : <><Moon className="w-4 h-4 text-zinc-400"/>暗色模式</>}</button>
              <div className="border-t border-zinc-100" />
              <button onClick={() => { logout(); router.push("/"); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"><LogOut className="w-4 h-4" />退出登录</button>
            </div>
          )}
        </div>
      </aside>

      {/* 移动端汉堡菜单按钮 + 标题 */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur border-b border-zinc-200/60 px-4 py-3 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-1 rounded-lg hover:bg-zinc-100"><Menu className="w-5 h-5 text-zinc-600"/></button>
        <span className="font-bold text-zinc-900">LearnOS</span>
        <div className="flex-1" />
        <button onClick={() => { logout(); router.push("/"); }} className="text-xs text-zinc-400"><LogOut className="w-4 h-4"/></button>
      </div>

      {/* 移动端侧边栏（滑入覆盖层） */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl flex flex-col animate-slide-up overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b"><span className="font-bold text-lg">LearnOS</span><button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-zinc-100"><X className="w-5 h-5"/></button></div>
            <nav className="flex-1 px-3 py-4"><NavGroup title="核心" items={MAIN_NAV} /><NavGroup title="学习" items={LEARN_NAV} /><NavGroup title="复习" items={REVIEW_NAV} /></nav>
            <div className="border-t p-3 space-y-1">
              <button onClick={() => { setSidebarOpen(false); setCropperOpen(true); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-zinc-50"><Camera className="w-4 h-4 text-zinc-400"/>更换头像</button>
              <button onClick={() => { setSidebarOpen(false); setModalSwitch(true); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-zinc-50"><Shuffle className="w-4 h-4 text-zinc-400"/>切换账号</button>
              <button onClick={() => { setSidebarOpen(false); setModalAbout(true); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-zinc-50"><Info className="w-4 h-4 text-zinc-400"/>关于我们</button>
              <button onClick={() => { setSidebarOpen(false); setModalFeedback(true); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-zinc-50"><Smile className="w-4 h-4 text-zinc-400"/>意见反馈</button>
            </div>
          </div>
        </div>
      )}

      {/* 移动端底部导航栏 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur border-t border-zinc-200/60 px-2 py-1.5 flex items-center justify-around safe-area-bottom">
        {[{ href:"/cockpit", icon:LayoutDashboard, label:"驾驶舱" },{ href:"/today", icon:CalendarCheck, label:"今日" },{ href:"/english", icon:Globe, label:"英语" },{ href:"/knowledge", icon:Brain, label:"知识" }].map(t=>{
          const act = pathname === t.href || pathname.startsWith(t.href+"/");
          return <Link key={t.href} href={t.href} prefetch className={cn("flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-medium transition-colors",act?"text-primary-600":"text-zinc-400")}><t.icon className="w-5 h-5"/>{t.label}</Link>;
        })}
      </div>

      <main className="flex-1 overflow-auto bg-page pt-14 pb-16 lg:pt-0 lg:pb-0"><div className="animate-fade-in">{children}</div></main>
      <ClickTranslate />

      {/* 关于我们 */}
      <Modal open={modalAbout} onClose={() => setModalAbout(false)} title="关于 LearnOS">
        <div className="space-y-5 text-sm text-zinc-600 leading-relaxed">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200"><Compass className="w-6 h-6 text-white" /></div>
            <div><p className="font-bold text-zinc-900 text-base">LearnOS v1.0</p><p className="text-xs text-zinc-500">AI 主动学习操作系统</p></div>
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 mb-2">产品定位</h3>
            <p>LearnOS 是一款面向大学生和自学者的<span className="text-primary-600 font-semibold"> AI 驱动的主动学习操作系统</span>。不同于被动观看视频的网课平台，LearnOS 通过 AI 诊断、知识图谱、费曼训练和艾宾浩斯记忆引擎，帮助学习者从「被动浏览」转变为「主动掌握」。</p>
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 mb-2">核心理念</h3>
            <div className="space-y-2">
              {[{ icon: "🧠", t: "诊断驱动", d: "先测后学，AI 精准定位薄弱点" }, { icon: "📊", t: "量化掌握", d: "每个知识点的掌握度一目了然" }, { icon: "🎯", t: "刻意练习", d: "基于弱项生成针对性训练" }, { icon: "🔄", t: "科学复习", d: "FSRS 间隔重复，遗忘临界点提醒" }].map((f, i) => (
                <div key={i} className="flex gap-3 p-3 bg-zinc-50 rounded-xl"><span className="text-xl shrink-0">{f.icon}</span><div><p className="font-semibold text-zinc-800">{f.t}</p><p className="text-xs text-zinc-500">{f.d}</p></div></div>
              ))}
            </div>
          </div>
          <div><h3 className="font-bold text-zinc-900 mb-2">技术栈</h3><p className="text-xs text-zinc-400">Next.js 15 · React 19 · TypeScript · Tailwind CSS · DeepSeek AI</p></div>
        </div>
      </Modal>

      {/* 意见反馈 */}
      <Modal open={modalFeedback} onClose={() => { setModalFeedback(false); setFeedbackSent(false); setFeedbackText(""); }} title="意见反馈">
        {feedbackSent ? (
          <div className="text-center py-8"><div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-3"><Send className="w-6 h-6 text-emerald-600" /></div><p className="font-bold text-emerald-700">感谢反馈！</p><p className="text-sm text-zinc-500 mt-1">我们会认真阅读每一条意见</p></div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">你的意见将直接发送到开发团队邮箱。</p>
            <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} placeholder="描述你的建议或遇到的问题…" rows={5} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm outline-none resize-none transition-all focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-50" autoFocus />
            <button onClick={handleFeedback} disabled={feedbackLoading || !feedbackText.trim()} className="btn-primary w-full py-3 text-sm">
              {feedbackLoading ? (<span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />发送中…</span>) : (<span className="flex items-center gap-2"><Send className="w-4 h-4" />提交反馈</span>)}
            </button>
          </div>
        )}
      </Modal>

      {/* 切换账号 */}
      <Modal open={modalSwitch} onClose={() => setModalSwitch(false)} title="切换账号">
        {(() => {
          const allUsers = getAllUsers();
          if (allUsers.length === 0) return <p className="text-sm text-zinc-500 text-center py-6">暂无其他账号</p>;
          return (
            <div className="space-y-2">
              {allUsers.map(u => (
                <button key={u.id} onClick={() => { switchUser(u); setModalSwitch(false); router.refresh(); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors text-left">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shrink-0"><User className="w-5 h-5 text-indigo-400" /></div>
                  <div className="min-w-0"><p className="text-sm font-semibold truncate">{u.name}</p><p className="text-xs text-zinc-400 truncate">{u.email}</p></div>
                  {u.id === user?.id && <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium shrink-0">当前</span>}
                </button>
              ))}
              <div className="border-t border-zinc-100 pt-2 mt-2">
                <button onClick={() => { setModalSwitch(false); logout(); router.push("/"); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 text-primary-600 transition-colors text-sm font-semibold"><UserPlus className="w-4 h-4" />登录其他账号</button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* 头像裁剪器 */}
      <AvatarCropper open={cropperOpen} onClose={() => setCropperOpen(false)} onCrop={handleAvatarSave} />
    </div>
  );
}
