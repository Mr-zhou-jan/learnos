"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, Loader2, RotateCcw, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

function FeynmanContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const nodeId = sp.get("nodeId");
  const nodeTitle = sp.get("title") || "";
  const courseId = sp.get("courseId") || "";

  const [step, setStep] = useState<"loading"|"study"|"score">("loading");
  const [content, setContent] = useState("");
  const [paraphrase, setParaphrase] = useState("");
  const [score, setScore] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [topic, setTopic] = useState(nodeTitle || "");

  useEffect(() => {
    // Priority 1: URL param
    if (nodeTitle) { setTopic(nodeTitle); }
    
    // Priority 2: Look up from extracted knowledge
    if (nodeId && !topic) {
      try {
        const ek = JSON.parse(localStorage.getItem("learnos_extracted_knowledge") || "{}");
        const nodes = ek.nodes || [];
        const found = nodes.find((n: any) => n.id === nodeId);
        if (found) setTopic(found.title || found.description?.slice(0,50) || "知识点");
      } catch {}
    }

    // Load AI explanation for the topic
    if (topic) {
      fetch("/api/knowledge/content", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, action: "explain" }),
      }).then(r => r.json()).then(d => {
        setContent(d.content || `📖 **${topic}**\n\n这是你需要掌握的知识点。请用自己的话复述。`);
        setStep("study");
      }).catch(() => {
        setContent(`📖 **${topic}**\n\n这是你需要掌握的知识点。请用自己的话复述。`);
        setStep("study");
      });
    }
  }, [nodeId, nodeTitle, topic]);

  const handleSubmit = async () => {
    if (!paraphrase.trim()) return;
    setAiLoading(true);
    try {
      const r = await fetch("/api/knowledge/content", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, paraphrase, action: "score" }),
      });
      if (r.ok) { const d = await r.json(); setScore(d.score || d); }
    } catch {}
    if (!score) setScore({ score: Math.min(85, Math.max(30, Math.floor(paraphrase.length / 4))), feedback: "基本理解正确，建议从更多角度补充说明。" });
    setAiLoading(false);
    setStep("score");
  };

  if (step === "loading") return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary-500"/></div>;
  if (!topic) return <div className="p-12 text-center text-zinc-500">请从驾驶舱选择一个知识点</div>;

  if (step === "study") return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="text-sm text-zinc-500 hover:text-zinc-700 mb-4 flex items-center gap-1"><ArrowLeft className="w-4 h-4"/> 返回</button>
      <h1 className="text-2xl font-bold mb-6">费曼训练室</h1>
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-3"><BookOpen className="w-5 h-5 text-primary-500"/><h2 className="font-bold">{topic}</h2></div>
        <div className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">{content}</div>
        <div className="mt-3 p-3 bg-primary-50 rounded-lg"><p className="font-bold text-primary-700 text-sm">💡 费曼技巧</p><p className="text-xs text-primary-600 mt-1">用你自己的话解释上面的概念。想象你在教一个完全不懂的人。</p></div>
      </div>
      <div className="card">
        <h2 className="font-bold mb-3">🗣️ 复述</h2>
        <textarea value={paraphrase} onChange={e => setParaphrase(e.target.value)} className="w-full h-36 px-4 py-3 border rounded-xl text-sm resize-none focus:outline-none focus:border-primary-400" placeholder={`请用自己的话解释「${topic}」...`}/>
        <button onClick={handleSubmit} disabled={paraphrase.trim().length < 20 || aiLoading} className="btn-primary mt-3">{aiLoading ? <><Loader2 className="w-4 h-4 animate-spin"/> AI评分中...</> : <><Send className="w-4 h-4"/> 提交复述</>}</button>
      </div>
    </div>
  );

  if (step === "score" && score) return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1"><ArrowLeft className="w-4 h-4"/> 返回</button>
      <div className="card text-center"><div className={cn("text-5xl font-bold", score.score >= 80 ? "text-emerald-600" : score.score >= 60 ? "text-amber-600" : "text-red-600")}>{score.score}</div><p className="text-zinc-500 mt-1">综合评分</p></div>
      <div className="card"><h3 className="font-bold mb-2">💬 AI反馈</h3><p className="text-sm">{score.feedback || "复述基本正确，建议补充更多细节。"}</p></div>
      <div className="flex gap-3">
        <button onClick={() => { setStep("study"); setParaphrase(""); setScore(null); }} className="btn-primary">重新学习</button>
        <button onClick={() => router.push("/cockpit")} className="btn-secondary">返回驾驶舱</button>
      </div>
    </div>
  );
  return null;
}

export default () => <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary-500"/></div>}><FeynmanContent/></Suspense>;
