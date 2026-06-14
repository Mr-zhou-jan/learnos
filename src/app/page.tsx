"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Link2, Sparkles, User, LogOut, AlertCircle, ArrowRight, Check, Mail, UserPlus, Lock, Eye, EyeOff } from "lucide-react";
import { getCurrentUser, getAllUsers, switchUser, loginWithEmail, registerWithEmail, findUserByEmail, isValidEmail, isValidPassword, logout, type UserInfo } from "@/lib/user-store";

type Step = "auth" | "verifyEmail" | "input" | "extracting";
type AuthTab = "login" | "register";

export default function LandingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("auth");
  const [authTab, setAuthTab] = useState<AuthTab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // 验证码相关
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
    if (emailErr) {
      setAuthError(emailErr);
      return;
    }
    const pwCheck = isValidPassword(password);
    if (!password || !pwCheck.valid) {
      setAuthError(pwCheck.reason || "请输入密码");
      return;
    }

    setAuthLoading(true);
    try {
      // 验证邮箱真实性
      const valid = await verifyEmail(email.trim());
      if (!valid) { setAuthLoading(false); return; }

      const existingUser = findUserByEmail(email.trim());
      if (!existingUser) {
        setAuthError("该邮箱尚未注册，请切换到「注册」创建账号");
        setAuthLoading(false);
        return;
      }

      const user = await loginWithEmail(email.trim(), password);
      if (!user) {
        setAuthError("密码错误，请重试");
        setAuthLoading(false);
        return;
      }

      setCurrentUserState(user);
      setUserName(user.name);
      setAllUsers(getAllUsers());
      setPassword("");
      setStep("input");
    } catch {
      setAuthError("登录失败，请重试");
    }
    setAuthLoading(false);
  };

  // ============ 注册 ============
  const handleRegister = async () => {
    setAuthError("");
    const emailErr = isValidEmail(email.trim());
    if (emailErr) {
      setAuthError(emailErr);
      return;
    }
    const pwCheck = isValidPassword(password);
    if (!password || !pwCheck.valid) {
      setAuthError(pwCheck.reason || "请输入密码");
      return;
    }
    if (!userName.trim()) {
      setAuthError("请输入你的昵称");
      return;
    }

    setAuthLoading(true);
    try {
      // 验证邮箱真实性
      const valid = await verifyEmail(email.trim());
      if (!valid) { setAuthLoading(false); return; }

      const existingUser = findUserByEmail(email.trim());
      if (existingUser) {
        setAuthError("该邮箱已注册，请切换到「登录」");
        setAuthLoading(false);
        return;
      }

      // 跳到验证码页面
      setVerifyCode("");
      setCodeSent(false);
      setCountdown(0);
      setStep("verifyEmail");
    } catch {
      setAuthError("注册失败，请重试");
    }
    setAuthLoading(false);
  };

  // ============ 发送验证码 ============
  const handleSendCode = async () => {
    setSendingCode(true);
    setAuthError("");
    try {
      const r = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const d = await r.json();
      if (d.success) {
        setCodeSent(true);
        setCountdown(60);
      } else {
        setAuthError(d.reason || "发送失败");
      }
    } catch {
      setAuthError("发送失败，请稍后重试");
    }
    setSendingCode(false);
  };

  // ============ 验证验证码并完成注册 ============
  const handleVerifyAndRegister = async () => {
    setAuthError("");
    if (verifyCode.length !== 6) {
      setAuthError("请输入6位验证码");
      return;
    }

    setAuthLoading(true);
    try {
      const r = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: verifyCode }),
      });
      const d = await r.json();
      if (!d.valid) {
        setAuthError(d.reason || "验证码错误");
        setAuthLoading(false);
        return;
      }

      // 验证通过，创建账号
      const user = await registerWithEmail(email.trim(), userName.trim(), password);
      setCurrentUserState(user);
      setAllUsers(getAllUsers());
      setPassword("");
      setStep("input");
    } catch {
      setAuthError("注册失败，请重试");
    }
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
    setEmail("");
    setPassword("");
    setUserName("");
    setAuthTab("login");
    setStep("auth");
    setAllUsers(getAllUsers());
  };

  // ============ 开始诊断 ============
  const handleStart = async () => {
    if (!subject.trim()) return;
    setError("");
    setStep("extracting");
    setLogs([]);

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
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary-500 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold mb-2">正在构建知识库</h2>
          <p className="text-sm text-zinc-500 mb-6">
            AI 正在分析「{subject}」的知识结构并生成诊断题目
          </p>
          <div className="space-y-2.5 text-left">
            {logs.map((l, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-zinc-600">
                {l.includes("✅") || l.includes("🎯") ? (
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : l.includes("❌") ? (
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-primary-300 border-t-transparent animate-spin shrink-0" />
                )}
                <span>{l}</span>
              </div>
            ))}
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-left">
              <AlertCircle className="w-4 h-4 inline mr-1" />{error}
              <button onClick={() => { setError(""); setStep("input"); }} className="ml-2 underline">返回</button>
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
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-500 flex items-center justify-center mb-4 shadow-lg shadow-primary-200">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">验证邮箱</h1>
            <p className="text-zinc-500 mt-2">
              我们已向 <span className="text-primary-600 font-medium">{email}</span> 发送验证码
            </p>
          </div>

          <div className="card p-6">
            {/* 错误提示 */}
            {authError && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {/* 验证码输入 */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-1.5 block">验证码</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => { setVerifyCode(e.target.value.replace(/\D/g, "")); setAuthError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyAndRegister()}
                placeholder="请输入6位验证码"
                className="w-full px-4 py-3 border border-zinc-300 rounded-xl text-sm text-center tracking-[0.3em] text-lg font-bold focus:outline-none focus:border-primary-500"
                autoFocus
              />
              <p className="text-xs text-zinc-400 mt-1.5 text-center">验证码 5 分钟内有效</p>
            </div>

            {/* 发送验证码按钮 */}
            {!codeSent ? (
              <button
                onClick={handleSendCode}
                disabled={sendingCode}
                className="w-full py-3 bg-primary-500 text-white rounded-xl font-bold disabled:opacity-40 hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
              >
                {sendingCode ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> 发送中…</>
                ) : (
                  <>发送验证码 <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            ) : (
              <button
                onClick={handleSendCode}
                disabled={sendingCode || countdown > 0}
                className="w-full py-2.5 text-sm text-primary-600 font-medium disabled:text-zinc-400 hover:underline transition-colors"
              >
                {countdown > 0 ? `${countdown}秒后可重发` : "重新发送验证码"}
              </button>
            )}

            {/* 验证按钮 */}
            <button
              onClick={handleVerifyAndRegister}
              disabled={authLoading || verifyCode.length !== 6}
              className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold disabled:opacity-40 hover:bg-emerald-600 transition-colors mt-3 flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> 验证中…</>
              ) : (
                <>完成注册 <Check className="w-4 h-4" /></>
              )}
            </button>

            <button
              onClick={() => { setStep("auth"); setAuthError(""); }}
              className="w-full mt-3 py-2 text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
            >
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-500 flex items-center justify-center mb-4 shadow-lg shadow-primary-200">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">LearnOS</h1>
            <p className="text-zinc-500 mt-2">AI 驱动的主动学习平台</p>
          </div>

          <div className="card p-6">
            {/* 登录/注册 Tab */}
            <div className="flex bg-zinc-100 rounded-xl p-1 mb-6">
              <button onClick={() => switchTab("login")}
                className={"flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 " +
                  (authTab === "login" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700")}
              >
                <Mail className="w-4 h-4" /> 登录
              </button>
              <button onClick={() => switchTab("register")}
                className={"flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 " +
                  (authTab === "register" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700")}
              >
                <UserPlus className="w-4 h-4" /> 注册
              </button>
            </div>

            {/* 错误提示 */}
            {authError && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {/* 邮箱 */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-1.5 block">邮箱地址</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setAuthError(""); }}
                  placeholder="yourname@qq.com"
                  className="w-full pl-10 pr-4 py-3 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            {/* 密码 */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-1.5 block">密码</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setAuthError(""); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      authTab === "login" ? handleLogin() : handleRegister();
                    }
                  }}
                  placeholder={authTab === "login" ? "输入密码" : "设置密码（至少6位）"}
                  className="w-full pl-10 pr-10 py-3 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 注册时显示昵称 */}
            {authTab === "register" && (
              <div className="mb-4">
                <label className="text-sm font-medium mb-1.5 block">昵称</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => { setUserName(e.target.value); setAuthError(""); }}
                    placeholder="输入你想显示的昵称"
                    className="w-full pl-10 pr-4 py-3 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            )}

            {/* 按钮 */}
            <button
              onClick={authTab === "login" ? handleLogin : handleRegister}
              disabled={authLoading || !email.trim() || !password || (authTab === "register" && !userName.trim())}
              className="w-full py-3 bg-primary-500 text-white rounded-xl font-bold disabled:opacity-40 hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> 处理中…</>
              ) : (
                <>{authTab === "login" ? "登录" : "注册"} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <p className="text-xs text-zinc-400 mt-3 text-center">
              {authTab === "login" ? "没有账号？" : "已有账号？"}
              <button onClick={() => switchTab(authTab === "login" ? "register" : "login")}
                className="text-primary-600 font-medium hover:underline ml-1">
                {authTab === "login" ? "立即注册" : "去登录"}
              </button>
            </p>

            {/* 已有用户快速切换 */}
            {allUsers.length > 0 && (
              <div className="mt-5 pt-4 border-t border-zinc-100">
                <p className="text-xs text-zinc-400 mb-2">快速切换账号</p>
                <div className="flex flex-wrap gap-2">
                  {allUsers.map((u) => (
                    <button key={u.id} onClick={() => handleSwitchUser(u)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 text-sm hover:bg-primary-50 hover:text-primary-700 transition-colors">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{u.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-zinc-400 mt-6">
            支持 QQ邮箱 · 163邮箱 · Gmail · 数据本地加密存储
          </p>
        </div>
      </div>
    );
  }

  // ============ 学科输入 ============
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="w-14 h-14 mx-auto rounded-xl bg-primary-500 flex items-center justify-center mb-4">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold">LearnOS</h1>
          <p className="text-zinc-500 mt-2">AI 驱动的主动学习平台</p>

          {/* 当前用户 */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-zinc-200 shadow-sm">
              <User className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium">{currentUser?.name || "学习者"}</span>
              <span className="text-xs text-zinc-400">({currentUser?.email || ""})</span>
              <button onClick={handleLogout} className="ml-1 p-1 rounded hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors" title="退出登录">
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm font-medium mb-1.5 block">你想学什么？</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="例如：四级英语、Python编程、大学物理…"
              className="w-full px-4 py-3 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:border-primary-500"
              autoFocus
            />
          </div>

          <div className={showVideo ? "" : "hidden"}>
            <label className="text-sm font-medium mb-1.5 block">
              视频链接（可选）
              <button type="button" onClick={() => { setShowVideo(false); setVideoUrl(""); }} className="ml-2 text-xs text-zinc-400 underline cursor-pointer">移除</button>
            </label>
            <input
              type="text"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="粘贴 B站 / YouTube 链接…"
              className="w-full px-4 py-3 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:border-primary-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowVideo(true)}
            className={showVideo ? "hidden" : "flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:underline cursor-pointer"}
          >
            <Link2 className="w-4 h-4" /> 添加视频链接（可选）
          </button>
        </div>

        <button
          onClick={handleStart}
          disabled={!subject.trim()}
          className={"w-full py-4 rounded-2xl font-bold text-lg transition-all " + (subject.trim() ? "bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-200" : "bg-zinc-200 text-zinc-400 cursor-not-allowed")}
        >
          {subject.trim() ? "开始诊断 →" : "输入学科开始学习"}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
          </div>
        )}
      </div>
    </div>
  );
}
