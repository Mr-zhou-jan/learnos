"use client";
import { useState } from "react";
import { Link2, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";

interface Props {
  moduleName: string;
  onContentImported?: (content: any) => void;
}

export default function LinkImporter({ moduleName, onContentImported }: Props) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleImport = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      const resp = await fetch("/api/english/import-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, module: moduleName }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setStatus("success");
        setMessage(data.message || "内容导入成功！");
        if (onContentImported && data.content) {
          onContentImported(data.content);
        }
        setTimeout(() => { setOpen(false); setUrl(""); setStatus("idle"); }, 2000);
      } else {
        setStatus("error");
        setMessage(data.error || "导入失败，请检查链接是否有效");
      }
    } catch {
      setStatus("error");
      setMessage("网络错误，请稍后再试");
    }
    setLoading(false);
  };

  const moduleHints: Record<string, string> = {
    "阅读训练": "粘贴包含英语阅读文章的链接（如真题网站、英语学习博客等）",
    "听力训练": "粘贴包含英语听力材料的链接（如听力真题、播客页面等）",
    "作文批改": "粘贴包含作文题目或范文的链接",
    "翻译训练": "粘贴包含翻译练习题目的链接",
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:underline"
      >
        <Link2 className="w-4 h-4" /> 导入链接
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">导入{moduleName}内容</h3>
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-zinc-500 mb-4">
              {moduleHints[moduleName] || "粘贴包含英语学习内容的链接，系统将自动解析并导入"}
            </p>

            <input
              type="url"
              value={url}
              onChange={e => { setUrl(e.target.value); setStatus("idle"); }}
              placeholder="https://..."
              className="w-full px-4 py-3 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:border-primary-500 mb-4"
              autoFocus
            />

            {status === "success" && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {message}
              </div>
            )}
            {status === "error" && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {message}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setOpen(false)} className="flex-1 btn-secondary">取消</button>
              <button
                onClick={handleImport}
                disabled={loading || !url.trim()}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                导入
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
