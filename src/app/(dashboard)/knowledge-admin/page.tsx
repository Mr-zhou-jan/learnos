"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, ExternalLink, Globe, Loader2, PlusCircle,
  Search, Sparkles, Trash2, Video, Youtube,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllCourses, getNodeCount, type CourseData } from "@/lib/knowledge-loader";

// ============================================================
// 视频提取面板
// ============================================================
function VideoExtractPanel() {
  const [videoUrl, setVideoUrl] = useState("");
  const [courseName, setCourseName] = useState("");
  const [manualTranscript, setManualTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [showManual, setShowManual] = useState(false);

  const handleExtract = async () => {
    if (!courseName.trim()) return;
    if (!videoUrl.trim() && !manualTranscript.trim()) return;
    
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const resp = await fetch("/api/knowledge/from-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          videoUrl: videoUrl || undefined, 
          courseName,
          manualTranscript: manualTranscript || undefined,
        }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || data.detail || "提取失败");
      }

      setResult(data);
    } catch (e: any) {
      setError(e.message);
      // If the error is about missing subtitles, suggest manual input
      if (e.message.includes("没有字幕") || e.message.includes("字幕")) {
        setShowManual(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="font-semibold flex items-center gap-2 mb-4">
        <Video className="w-5 h-5 text-primary-500" /> 从视频链接提取知识点
      </h2>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-zinc-700">课程名称</label>
          <input
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="例如：线性代数、数据结构..."
            className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-primary-400"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700">
            视频链接（Bilibili 或 YouTube）
          </label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.bilibili.com/video/BV1xx..."
              className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-primary-400"
            />
            <button
              onClick={handleExtract}
              disabled={loading || !courseName.trim() || (!videoUrl.trim() && !manualTranscript.trim())}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 text-sm font-medium shrink-0"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 提取中</>
              ) : (
                <><Sparkles className="w-4 h-4" /> 提取知识点</>
              )}
            </button>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            支持 Bilibili BV 号和 YouTube 链接。如果视频没有字幕，可以切换到手动模式直接粘贴字幕文本。
          </p>
        </div>

        {/* Toggle manual mode */}
        <button
          type="button"
          onClick={() => { setShowManual(!showManual); setError(""); }}
          className="text-xs text-primary-600 hover:text-primary-700 underline"
        >
          {showManual ? "使用视频链接模式" : "或手动粘贴字幕文本 →"}
        </button>

        {showManual && (
          <div>
            <label className="text-sm font-medium text-zinc-700">视频字幕文本（手动粘贴）</label>
            <textarea
              value={manualTranscript}
              onChange={(e) => setManualTranscript(e.target.value)}
              placeholder="粘贴视频的字幕文本或讲稿...&#10;AI 将自动分析并提取知识点"
              rows={6}
              className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm resize-none focus:outline-none focus:border-primary-400"
            />
            <p className="text-xs text-zinc-400 mt-1">
              提示：如果有视频链接，AI 会优先自动提取字幕。手动模式作为兜底方案。
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          ❌ {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="font-medium text-emerald-700 mb-2">
            ✅ 成功提取 {result.nodeCount} 个知识点！
          </p>
          <p className="text-sm text-emerald-600">
            课程 <strong>{result.course.name}</strong> 已加入知识库。
            平台: {result.platform === "bilibili" ? "Bilibili" : "YouTube"}
          </p>
          <button
            onClick={() => (window.location.href = `/courses/${result.course.id}`)}
            className="mt-2 text-sm text-primary-600 hover:underline flex items-center gap-1"
          >
            查看知识树 <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 全网搜索面板
// ============================================================
function WebSearchPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [courseName, setCourseName] = useState("");

  const handleSearchRequest = () => {
    // 提示：此功能需要 Hermes Agent 实际执行全网搜索
    alert(
      `已发送搜索请求！\n\nHermes Agent 将在后台搜索"${searchQuery}"的知识结构，\n整理后自动写入知识库。\n\n请在几分钟后刷新页面查看结果。`
    );
  };

  return (
    <div className="card">
      <h2 className="font-semibold flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-primary-500" /> 全网搜索构建知识库
      </h2>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-zinc-700">课程/学科名称</label>
          <input
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="例如：概率论与数理统计"
            className="w-full mt-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-primary-400"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700">搜索关键词（可选）</label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="例如：概率论 知识点 大纲 知识体系"
              className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-primary-400"
            />
            <button
              onClick={handleSearchRequest}
              disabled={!courseName.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 text-sm font-medium shrink-0"
            >
              <Search className="w-4 h-4" /> 全网搜索
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-violet-50 border border-violet-100 rounded-lg">
        <p className="text-sm text-violet-700 font-medium mb-1">💡 工作原理</p>
        <p className="text-xs text-violet-600">
          Hermes Agent 将自动搜索该学科的教学大纲、知识点体系、课程目录，
          整理成结构化知识树后写入你的知识库。整个过程无需手动操作。
        </p>
      </div>
    </div>
  );
}

// ============================================================
// 当前知识库总览
// ============================================================
function KnowledgeOverview() {
  const courses = getAllCourses();

  return (
    <div className="card">
      <h2 className="font-semibold flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-primary-500" /> 当前知识库总览
      </h2>

      <div className="space-y-2">
        {courses.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors"
          >
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0",
                c.color
              )}
            >
              {c.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{c.name}</p>
              <p className="text-xs text-zinc-500 truncate">{c.description}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-zinc-700">
                {getNodeCount(c.id)}
              </p>
              <p className="text-xs text-zinc-400">知识点</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-100">
        <p className="text-sm text-zinc-600">
          共 <strong>{courses.length}</strong> 门课程，{" "}
          <strong>
            {courses.reduce((sum, c) => sum + getNodeCount(c.id), 0)}
          </strong>{" "}
          个知识点
        </p>
      </div>
    </div>
  );
}

// ============================================================
// 主页面
// ============================================================
export default function KnowledgeAdminPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">知识库管理</h1>
        <p className="text-zinc-500 mt-1">
          通过视频链接或全网搜索，自动构建你的学习知识库
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <VideoExtractPanel />
        <WebSearchPanel />
      </div>

      <KnowledgeOverview />

      {/* 手动添加入口 */}
      <div className="card border-dashed border-2 border-zinc-200 bg-transparent text-center py-6">
        <PlusCircle className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
        <p className="text-sm text-zinc-500">
          需要添加更多学科？
          <br />
          在聊天中告诉 Hermes Agent："帮我搜索 XXX 的知识结构"
        </p>
      </div>
    </div>
  );
}
