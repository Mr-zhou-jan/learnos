"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Link2, Sparkles, User, LogOut, AlertCircle, ArrowRight, Check, Download, Mail, UserPlus, Lock, Eye, EyeOff, Shield, Zap, TrendingUp } from "lucide-react";
import { getCurrentUser, getAllUsers, switchUser, loginWithEmail, registerWithEmail, findUserByEmail, isValidEmail, isValidPassword, logout, type UserInfo } from "@/lib/user-store";
import { restoreFromCloud, syncAllToCloud } from "@/lib/cloud-store";

type Step = "auth" | "verifyEmail" | "input" | "extracting";
type AuthTab = "login" | "register";

export default function LandingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("auth");
  const [authTab, setAuthTab] = useState<AuthTab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [userName, setUserName] = useState("");
  const [currentUser, setCurrentUserState] = useState<UserInfo | null>(null);
  const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
  const [subject, setSubject] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [showVideo, setShowVideo] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // 初始化
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUserState(user);
    setAllUsers(getAllUsers());
    if (user) {
      setEmail(user.email || "");
      setUserName(user.name || "");
      setStep("input");
    }
  }, []);

  // 验证码倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // 切换 tab 时清空错误和密码
  const switchTab = (tab: AuthTab) => {
    setAuthTab(tab);
    setAuthError("");
    setPassword("");
  };

  // ============ 邮箱真实性验证 ============
  const verifyEmail = async (emailAddr: string): Promise<boolean> => {
    try {
      const r = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailAddr }),
      });
      const d = await r.json();
      if (!d.valid) {
        setAuthError(d.reason || "邮箱验证失败");
        return false;
      }
      return true;
    } catch {
      setAuthError("邮箱验证服务暂不可用，请稍后重试");
      return false;
    }
  };

  // ============ 登录 ============
  const handleLogin = async () => {
    setAuthError("");
    const emailErr = isValidEmail(email.trim());
    if (emailErr) { setAuthError(emailErr); return; }
    const pwCheck = isValidPassword(password);
    if (!password || !pwCheck.valid) { setAuthError(pwCheck.reason || "请输入密码"); return; }

    setAuthLoading(true);
    try {
      const valid = await verifyEmail(email.trim());
      if (!valid) { setAuthLoading(false); return; }
      const user = await loginWithEmail(email.trim(), password);
      if (!user) {
        const exists = findUserByEmail(email.trim());
        setAuthError(exists ? "密码错误，请重试" : "该邮箱尚未注册。如之前注册过，数据已从云端恢复，请重试");
        setAuthLoading(false); return;
      }
      setCurrentUserState(user);
      setUserName(user.name);
      setAllUsers(getAllUsers());
      setPassword("");
      setStep("input");
      // 从云端恢复所有学习数据
      restoreFromCloud(user.id).then(n => { if (n > 0) console.log(`已从云端恢复 ${n} 条数据`); });
      // 同步本地数据到云端
      setTimeout(() => syncAllToCloud(user.id), 2000);
    } catch { setAuthError("登录失败，请重试"); }
    setAuthLoading(false);
  };

  // ============ 注册 ============
  const handleRegister = async () => {
    setAuthError("");
    const emailErr = isValidEmail(email.trim());
    if (emailErr) { setAuthError(emailErr); return; }
    const pwCheck = isValidPassword(password);
    if (!password || !pwCheck.valid) { setAuthError(pwCheck.reason || "请输入密码"); return; }
    if (!userName.trim()) { setAuthError("请输入你的昵称"); return; }

    setAuthLoading(true);
    try {
      const valid = await verifyEmail(email.trim());
      if (!valid) { setAuthLoading(false); return; }
      const existingUser = findUserByEmail(email.trim());
      if (existingUser) { setAuthError("该邮箱已注册，请切换到「登录」"); setAuthLoading(false); return; }
      setVerifyCode("");
      setCodeSent(false);
      setCountdown(0);
      setStep("verifyEmail");
    } catch { setAuthError("注册失败，请重试"); }
    setAuthLoading(false);
  };

  // ============ 发送验证码 ============
  const handleSendCode = async () => {
    setSendingCode(true);
    setAuthError("");
    try {
      const r = await fetch("/api/auth/send-code", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const d = await r.json();
      if (d.success) {
        setCodeSent(true);
        setCountdown(60);
        if (d.devCode) setVerifyCode(d.devCode);
      } else {
        setAuthError(d.reason || "发送失败");
      }
    } catch { setAuthError("发送失败，请稍后重试"); }
    setSendingCode(false);
  };

  // ============ 验证验证码并完成注册 ============
  const handleVerifyAndRegister = async () => {
    setAuthError("");
    if (verifyCode.length !== 6) { setAuthError("请输入6位验证码"); return; }
    setAuthLoading(true);
    try {
      const r = await fetch("/api/auth/verify-code", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: verifyCode }),
      });
      const d = await r.json();
      if (!d.valid) { setAuthError(d.reason || "验证码错误"); setAuthLoading(false); return; }
      const user = await registerWithEmail(email.trim(), userName.trim(), password);
      setCurrentUserState(user);
      setAllUsers(getAllUsers());
      setPassword("");
      setStep("input");
      // 新注册用户同步数据到云端
      setTimeout(() => syncAllToCloud(user.id), 2000);
    } catch { setAuthError("注册失败，请重试"); }
    setAuthLoading(false);
  };

  // ============ 切换已有用户 ============
  const handleSwitchUser = (user: UserInfo) => {
    switchUser(user);
    setCurrentUserState(user);
    setEmail(user.email || "");
    setUserName(user.name || "");
    setPassword("");
    setStep("input");
  };

  // ============ 退出登录 ============
  const handleLogout = () => {
    logout();
    setCurrentUserState(null);
    setEmail(""); setPassword(""); setUserName("");
    setAuthTab("login"); setStep("auth");
    setAllUsers(getAllUsers());
  };

  // ============ 开始诊断 ============
  const handleStart = async () => {
    if (!subject.trim()) return;
    setError(""); setStep("extracting"); setLogs([]);
    const cid = "custom-" + Date.now();
    let url = videoUrl.trim();
    if (url && url.includes("b23.tv")) {
      setLogs(p => [...p, "🔗 解析短链接…"]);
      try {
        const r = await fetch("/api/knowledge/resolve-short?url=" + encodeURIComponent(url));
        if (r.ok) { const d = await r.json(); if (d.bvid) url = "https://www.bilibili.com/video/" + d.bvid; }
      } catch {}
    }
    setLogs(p => [...p, "🧠 AI 正在分析知识结构…"]);
    try {
      const r = await fetch("/api/knowledge/from-video", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: url || undefined, courseName: subject, courseId: cid }),
      });
      const d = await r.json();
      if (r.ok && d.course) {
        const nodes = d.course.knowledgeNodes || [];
        setLogs(p => [...p, `✅ 已提取 ${nodes.length} 个知识点`]);
        localStorage.setItem("learnos_extracted_knowledge", JSON.stringify({ courseId: cid, nodes: nodes, courseName: subject }));
        localStorage.setItem("learnos_user_state", JSON.stringify({ selectedCourses: [cid], selectedCourseNames: [subject], currentXp: 0, currentLevel: 1 }));
        setLogs(p => [...p, "🎯 正在跳转诊断…"]);
        setTimeout(() => router.push("/quiz?courses=" + cid + "&names=" + subject), 600);
      } else {
        setError(d.error || "知识提取失败，请重试");
        setStep("input");
      }
    } catch (e: any) {
      setError(e?.message || "网络请求失败，请检查连接后重试");
      setStep("input");
    }
  };

  // ============ 知识提取加载页 ============
  if (step === "extracting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="relative mx-auto mb-6 w-20 h-20">
            <div className="absolute inset-0 rounded-2xl bg-primary-500 animate-pulse opacity-20" />
            <div className="absolute inset-0 rounded-2xl bg-primary-500/10 backdrop-blur flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">正在构建知识库</h2>
          <p className="text-zinc-500 mb-8">AI 正在分析「{subject}」的知识结构并生成诊断题目</p>
          <div className="space-y-3 text-left bg-white/60 backdrop-blur rounded-2xl p-5 shadow-sm border border-zinc-100">
            {logs.map((l, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-zinc-600">
                {l.includes("✅") || l.includes("🎯") ? (
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : l.includes("❌") ? (
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-primary-300 border-t-transparent animate-spin shrink-0" />
                )}
                <span>{l}</span>
              </div>
            ))}
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 text-left">
              <AlertCircle className="w-4 h-4 inline mr-1" />{error}
              <button onClick={() => { setError(""); setStep("input"); }} className="ml-2 underline font-medium">返回</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ 验证邮箱页 ============
  if (step === "verifyEmail") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-200">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">验证邮箱</h1>
            <p className="text-zinc-500 mt-2">
              验证码已发送至 <span className="text-primary-600 font-semibold">{email}</span>
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-200/60 p-6 sm:p-8">
            {authError && (
              <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <div className="mb-5">
              <label className="text-sm font-semibold text-zinc-700 mb-2 block">验证码</label>
              <input
                type="text" inputMode="numeric" maxLength={6}
                value={verifyCode}
                onChange={(e) => { setVerifyCode(e.target.value.replace(/\D/g, "")); setAuthError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyAndRegister()}
                placeholder="000000"
                className="w-full px-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-center tracking-[0.5em] text-2xl font-bold outline-none transition-all focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-50"
                autoFocus
              />
              <p className="text-xs text-zinc-400 mt-2 text-center">
                {verifyCode.length === 6 ? "✅ 验证码已就绪" : "验证码 5 分钟内有效"}
              </p>
            </div>

            {!codeSent ? (
              <button onClick={handleSendCode} disabled={sendingCode}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-200 disabled:opacity-40 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2">
                {sendingCode ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> 发送中…</span>
                ) : (
                  <span className="flex items-center gap-1.5">发送验证码 <ArrowRight className="w-4 h-4" /></span>
                )}
              </button>
            ) : (
              <button onClick={handleSendCode} disabled={sendingCode || countdown > 0}
                className="w-full py-2.5 text-sm text-primary-600 font-semibold disabled:text-zinc-400 hover:text-primary-700 transition-colors">
                {countdown > 0 ? `${countdown}秒后可重发` : "重新发送验证码"}
              </button>
            )}

            <button onClick={handleVerifyAndRegister} disabled={authLoading || verifyCode.length !== 6}
              className="w-full py-3.5 bg-emerald-500 text-white rounded-2xl font-bold text-sm disabled:opacity-40 hover:bg-emerald-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 mt-3 flex items-center justify-center gap-2">
              {authLoading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> 验证中…</span>
              ) : (
                <span className="flex items-center gap-1.5">完成注册 <Check className="w-4 h-4" /></span>
              )}
            </button>

            <button onClick={() => { setStep("auth"); setAuthError(""); }}
              className="w-full mt-3 py-2.5 text-sm text-zinc-400 hover:text-zinc-600 transition-colors font-medium">
              ← 返回修改邮箱
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ 登录/注册页 ============
  if (step === "auth") {
    return (
      <div className="min-h-screen flex">
        {/* ===== 左侧品牌面板（桌面端可见） ===== */}
        <div className="hidden lg:flex w-[480px] relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex-col justify-between p-10">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-yellow-300/20 rounded-full blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">LearnOS</h1>
                <p className="text-white/60 text-sm">AI 主动学习平台</p>
              </div>
            </div>

            <div className="space-y-6">
              {[
                { icon: Zap, title: "AI 知识诊断", desc: "精准定位知识薄弱点，告别盲目学习" },
                { icon: TrendingUp, title: "掌握度追踪", desc: "量化学习进度，可视化成长轨迹" },
                { icon: Shield, title: "个性化训练", desc: "基于弱项定制练习方案，高效提分" },
              ].map((f, i) => (
                <div key={i} className="flex gap-4 items-start" style={{ animationDelay: `${i * 150}ms` }}>
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">{f.title}</h3>
                    <p className="text-white/55 text-sm mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-4 text-white/40 text-xs">
            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> 数据加密</span>
            <span>·</span>
            <span>本地优先</span>
            <span>·</span>
            <span>零数据泄露</span>
          </div>
        </div>

        {/* ===== 右侧表单 ===== */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-gradient-to-br from-zinc-50 via-white to-indigo-50">
          <div className="w-full max-w-[420px]">
            <div className="lg:hidden text-center mb-8">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3 shadow-lg shadow-purple-200">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold">LearnOS</h1>
              <p className="text-zinc-500 text-sm mt-1">AI 驱动的主动学习平台</p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-200/60 p-6 sm:p-8">
              {/* 滑动指示器 Tab */}
              <div className="relative flex bg-zinc-100 rounded-xl p-1 mb-6">
                <div className={"absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm transition-transform duration-300 ease-out " +
                  (authTab === "register" ? "translate-x-[calc(100%+4px)]" : "translate-x-0")} />
                <button onClick={() => switchTab("login")}
                  className={"flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-300 relative z-10 " +
                    (authTab === "login" ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600")}>登录</button>
                <button onClick={() => switchTab("register")}
                  className={"flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-300 relative z-10 " +
                    (authTab === "register" ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600")}>注册</button>
              </div>

              {/* 错误提示 */}
              {authError && (
                <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 flex items-start gap-2.5 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* 邮箱 */}
                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-1.5 block">邮箱地址</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-primary-500 transition-colors duration-300" />
                    <input type="email" value={email}
                      onChange={(e) => { setEmail(e.target.value); setAuthError(""); }}
                      placeholder="yourname@qq.com"
                      className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm outline-none transition-all duration-300 focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-50" />
                  </div>
                </div>

                {/* 密码 */}
                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-1.5 block">密码</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-primary-500 transition-colors duration-300" />
                    <input type={showPassword ? "text" : "password"} value={password}
                      onChange={(e) => { setPassword(e.target.value); setAuthError(""); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { authTab === "login" ? handleLogin() : handleRegister(); } }}
                      placeholder={authTab === "login" ? "输入密码" : "至少6位，包含字母和数字"}
                      className="w-full pl-11 pr-12 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm outline-none transition-all duration-300 focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-50" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors p-1">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 昵称（仅注册） */}
                {authTab === "register" && (
                  <div className="animate-fade-in">
                    <label className="text-sm font-semibold text-zinc-700 mb-1.5 block">昵称</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-primary-500 transition-colors duration-300" />
                      <input type="text" value={userName}
                        onChange={(e) => { setUserName(e.target.value); setAuthError(""); }}
                        placeholder="你的昵称"
                        className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm outline-none transition-all duration-300 focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-50" />
                    </div>
                  </div>
                )}
              </div>

              {/* CTA 按钮 */}
              <button
                onClick={authTab === "login" ? handleLogin : handleRegister}
                disabled={authLoading || !email.trim() || !password || (authTab === "register" && !userName.trim())}
                className="w-full mt-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-purple-200 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2">
                {authLoading ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />验证中…</span>
                ) : (
                  <span className="flex items-center gap-1.5">{authTab === "login" ? "登录" : "创建账号"}<ArrowRight className="w-4 h-4" /></span>
                )}
              </button>

              {/* 切换 Tab */}
              <p className="text-sm text-zinc-400 mt-4 text-center">
                {authTab === "login" ? "还没有账号？" : "已有账号？"}
                <button onClick={() => switchTab(authTab === "login" ? "register" : "login")}
                  className="text-primary-600 font-semibold hover:text-primary-700 transition-colors ml-1">
                  {authTab === "login" ? "立即注册" : "去登录"}
                </button>
              </p>

              {/* 快速切换已有用户 */}
              {allUsers.length > 0 && (
                <div className="mt-5 pt-5 border-t border-zinc-100">
                  <p className="text-xs text-zinc-400 mb-2.5 font-medium">快速切换账号</p>
                  <div className="flex flex-wrap gap-2">
                    {allUsers.map((u) => (
                      <button key={u.id} onClick={() => handleSwitchUser(u)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-medium hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-all duration-200">
                        <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="w-3 h-3 text-primary-600" />
                        </div>
                        <span>{u.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <p className="text-center text-xs text-zinc-400 mt-5">
              支持 QQ邮箱 · 163邮箱 · Gmail · 数据本地加密存储
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============ 学科输入页 ============
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-200">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold">LearnOS</h1>
          <p className="text-zinc-500 mt-2">AI 驱动的主动学习平台</p>

          {/* 当前用户 */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full border border-zinc-200/60 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-primary-600" />
              </div>
              <span className="text-sm font-semibold">{currentUser?.name || "学习者"}</span>
              <span className="text-xs text-zinc-400">({currentUser?.email || ""})</span>
              <button onClick={handleLogout} className="ml-1 p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors" title="退出登录">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-200/60 p-6 sm:p-8">
          <div className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-zinc-700 mb-2 block">你想学什么？</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="例如：四级英语、Python编程、大学物理…"
                className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm outline-none transition-all duration-300 focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-50"
                autoFocus />
            </div>

            <div className={showVideo ? "" : "hidden"}>
              <label className="text-sm font-semibold text-zinc-700 mb-2 block">
                视频链接（可选）
                <button type="button" onClick={() => { setShowVideo(false); setVideoUrl(""); }}
                  className="ml-2 text-xs text-zinc-400 underline font-normal cursor-pointer hover:text-zinc-600">移除</button>
              </label>
              <input type="text" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                placeholder="粘贴 B站 / YouTube 链接…"
                className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm outline-none transition-all duration-300 focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-50" />
            </div>

            <button type="button" onClick={() => setShowVideo(true)}
              className={showVideo ? "hidden" : "flex items-center gap-2 text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors"}>
              <Link2 className="w-4 h-4" /> 添加视频链接（可选）
            </button>
          </div>

          <button onClick={handleStart} disabled={!subject.trim()}
            className={"w-full mt-6 py-4 rounded-2xl font-bold text-lg transition-all duration-200 " + (subject.trim()
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-200 hover:shadow-xl hover:-translate-y-0.5"
              : "bg-zinc-100 text-zinc-400 cursor-not-allowed")}>
            {subject.trim() ? "开始诊断 →" : "输入学科开始学习"}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
