"use client";
import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Languages, X } from "lucide-react";

interface P { text: string; x: number; y: number; translation: string; loading: boolean; }

export default function ClickTranslate() {
  const [mounted, setMounted] = useState(false);
  const [p, setP] = useState<P | null>(null);
  const [hint, setHint] = useState(true);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { const t = setTimeout(() => setHint(false), 10000); return () => clearTimeout(t); }, []);

  const trans = useCallback(async (text: string, x: number, y: number) => {
    const t = text.trim();
    if (t.length < 2 || t.length > 500) return;
    setP({ text: t, x, y, translation: "", loading: true });
    try {
      const isWord = t.split(/\s+/).length === 1 && t.length < 30 && /^[a-zA-Z]+$/.test(t);
      const prompt = isWord
        ? `翻译"${t}"为中文。输出JSON: {"meaning":"中文释义","pos":"词性","example":"英文例句"}`
        : `翻译成中文并简要分析句式结构: ${t}`;
      const r = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }) });
      const d = await r.json();
      let result = d.reply || "翻译出错";
      if (isWord) { try { const j = JSON.parse(result); result = `${j.meaning} [${j.pos}]\n${j.example}`; } catch {} }
      setP({ text: t, x, y, translation: result, loading: false });
    } catch { setP({ text: t, x, y, translation: "翻译出错", loading: false }); }
  }, []);

  // 双击单词翻译
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("button,input,textarea,[contenteditable]")) return;
      const sel = window.getSelection()?.toString().trim();
      if (sel && sel.length > 1 && /[a-zA-Z]/.test(sel)) { trans(sel, e.clientX, e.clientY); return; }
      const r = document.caretRangeFromPoint(e.clientX, e.clientY);
      if (!r) return;
      const tn = r.startContainer;
      if (!tn || tn.nodeType !== 3) return;
      const txt = tn.textContent || "";
      let s = r.startOffset; while (s > 0 && /[a-zA-Z]/.test(txt[s - 1])) s--;
      let en = r.startOffset; while (en < txt.length && /[a-zA-Z]/.test(txt[en])) en++;
      const w = txt.slice(s, en).trim();
      if (w && w.length > 1 && w.length < 30) trans(w, e.clientX, e.clientY - 30);
    };
    document.addEventListener("dblclick", h);
    return () => document.removeEventListener("dblclick", h);
  }, [trans]);

  // 选中文本自动翻译
  useEffect(() => {
    const h = (e: MouseEvent) => {
      setTimeout(() => {
        const sel = window.getSelection()?.toString().trim();
        if (sel && sel.length > 1 && /[a-zA-Z]/.test(sel)) {
          trans(sel, e.clientX + 10, e.clientY + 10);
          window.getSelection()?.removeAllRanges();
        }
      }, 150);
    };
    document.addEventListener("mouseup", h);
    return () => document.removeEventListener("mouseup", h);
  }, [trans]);

  useEffect(() => { if (!p) return; const c = () => setP(null); setTimeout(() => document.addEventListener("click", c), 0); return () => document.removeEventListener("click", c); }, [p]);

  if (!mounted) return null;
  return (
    <>
      {hint && createPortal(
        <div className="fixed bottom-4 right-4 z-[9998] bg-white/90 backdrop-blur shadow-lg rounded-xl border border-primary-200 px-4 py-2 text-xs text-zinc-500 animate-slide-up">
          💡 选中英文句子自动翻译 · 双击英文单词查看释义
        </div>, document.body
      )}
      {p && createPortal(
        <div className="fixed z-[9999] bg-white shadow-xl rounded-xl border border-zinc-200 p-3 max-w-sm animate-slide-up"
          style={{ left: Math.min(p.x, window.innerWidth - 320), top: Math.min(p.y + 10, window.innerHeight - 200), maxWidth: 320 }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1"><Languages className="w-3 h-3 text-primary-500"/><p className="text-xs font-bold text-primary-600 truncate max-w-[200px]">{p.text}</p></div>
            <button onClick={() => setP(null)} className="text-zinc-300 hover:text-zinc-500"><X className="w-3 h-3"/></button>
          </div>
          {p.loading ? <p className="text-sm text-zinc-400">翻译中...</p> : <p className="text-sm text-zinc-700 whitespace-pre-wrap">{p.translation}</p>}
        </div>, document.body
      )}
    </>
  );
}
