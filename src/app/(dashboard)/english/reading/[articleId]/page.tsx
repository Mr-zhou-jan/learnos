"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookmarkPlus, Check, Clock, FileText, Languages, ListTree, Loader2, ScanText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveTrainingRecord } from "@/lib/use-training-memory";
import { saveTrainingState, loadTrainingState, clearTrainingState } from "@/lib/training-memory";
import { userKey } from "@/lib/user-store";
import { DiffBadge } from "@/components/english/DiffBadge";

export default function ReadingPage() {
  const { articleId } = useParams() as { articleId: string };
  const router = useRouter();
  const [article, setArticle] = useState<any>(null);
  const [cur, setCur] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [showExp, setShowExp] = useState<any>(null);
  const [hl, setHl] = useState(-1);
  const [timer, setTimer] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState("");
  const timerRef = useRef<any>(null);

  // 加载文章 & 恢复进度
  useEffect(() => {
    const local = JSON.parse(localStorage.getItem("learnos_ai_articles") || "[]").find((a:any) => a.id === articleId);
    const onLoaded = (art: any) => {
      setArticle(art);
      setLoading(false);
      // 尝试恢复进度
      const saved = loadTrainingState("reading");
      if (saved?.answers?.articleId === articleId) {
        setCur(saved.currentIndex || 0);
        setAnswers(saved.answers.userAnswers || []);
        setTimer(saved.answers.timer || 0);
      }
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    };
    if (local) { onLoaded(local); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }
    fetch("/api/english/articles/" + articleId).then(r => r.json()).then(d => onLoaded(d)).catch(() => setLoading(false));
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [articleId]);

  // 辅助：直接保存当前进度到 localStorage
  const doSave = () => {
    if (!article || done) return;
    try {
      localStorage.setItem(userKey("learnos_ts_reading"), JSON.stringify({
        module: "reading", currentIndex: cur,
        answers: { articleId, userAnswers: answers, timer },
        updatedAt: new Date().toISOString(),
      }));
    } catch {}
  };

  const runAnalysis = async (action: string) => {
    setAnalysisLoading(action);
    const resp = await fetch("/api/english/reading/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ article, action }) });
    const data = await resp.json();
    setAnalysis({ action, content: data.content });
    setAnalysisLoading("");
  };

  // 本地评分 + 每次操作后立即保存
  const select = (i: number) => {
    if (done||!article) return;
    const q = article.questions[cur];
    const isCorrect = i === q.correctIndex;
    setAnswers(p=>[...p.filter(a=>a.questionId!==q.id),{questionId:q.id,selectedIndex:i}]);
    setShowExp({ correct: isCorrect, correctIndex: q.correctIndex, explanation: q.explanation || "请参考原文理解" });
    // 立即保存
    try {
      localStorage.setItem(userKey("learnos_ts_reading"), JSON.stringify({
        module: "reading", currentIndex: cur,
        answers: { articleId, userAnswers: [...answers.filter(a=>a.questionId!==q.id),{questionId:q.id,selectedIndex:i}], timer },
        updatedAt: new Date().toISOString(),
      }));
    } catch {}
  };

  const submitAll = () => {
    clearInterval(timerRef.current);
    const qs = article.questions || [];
    // 构建完整结果（含本地评分）
    const results = answers.map((a: any) => {
      const q = qs.find((x: any) => x.id === a.questionId);
      const correct = q ? a.selectedIndex === q.correctIndex : false;
      if (q) {
        saveTrainingRecord({
          module: "reading", title: article.title,
          question: q.questionText,
          userAnswer: q.options[a.selectedIndex] ?? "(未作答)",
          correctAnswer: q.options[q.correctIndex],
          isCorrect: correct,
          explanation: q.explanation || "",
        });
      }
      return { ...a, correct, correctIndex: q?.correctIndex, explanation: q?.explanation || "" };
    });
    // 补上未作答的题
    for (const q of qs) {
      if (!results.find((r: any) => r.questionId === q.id)) {
        results.push({ questionId: q.id, selectedIndex: -1, correct: false, correctIndex: q.correctIndex, explanation: q.explanation || "" });
      }
    }
    setAnswers(results);
    clearTrainingState("reading");
    setDone(true);
  };

  const next = () => {
    setShowExp(null); setHl(-1);
    if (cur+1 >= article.questions.length) {
      submitAll();
    } else {
      const nextIdx = cur + 1;
      setCur(nextIdx);
      // 保存新位置
      try {
        localStorage.setItem(userKey("learnos_ts_reading"), JSON.stringify({
          module: "reading", currentIndex: nextIdx,
          answers: { articleId, userAnswers: answers, timer },
          updatedAt: new Date().toISOString(),
        }));
      } catch {}
    }
  };

  const fmt = (s:number) => Math.floor(s/60)+":"+(s%60<10?"0":"")+(s%60);

  if (loading) return <div className="p-12 text-center text-zinc-400">加载中...</div>;
  if (!article) return <div className="p-12 text-center text-zinc-400">文章未找到</div>;

  if (done) {
    const correct = (answers||[]).filter((a:any)=>a.correct).length;
    const qs = article.questions || [];
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">{correct===qs.length?"🎉":"👍"}</div>
          <h2 className="text-2xl font-bold mb-2">练习完成</h2>
          <p className="text-zinc-500">正确 {correct}/{qs.length} 题 · 用时 {fmt(timer)}</p>
        </div>
        <h3 className="font-bold text-lg mb-4">逐题解析</h3>
        <div className="space-y-4">
          {(answers||[]).map((a:any,i:number)=>{
            const q=qs.find((x:any)=>x.id===a.questionId);
            if(!q)return null;
            const ok=a.correct;
            return(<div key={i} className={`card p-4 border-l-4 ${ok?"border-l-emerald-500":"border-l-red-500"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">第{i+1}题</span>
                <span className={`text-xs font-bold ${ok?"text-emerald-600":"text-red-500"}`}>{ok?"正确":"错误"}</span>
              </div>
              <p className="text-sm font-medium mb-3">{q.questionText}</p>
              <div className="space-y-1 mb-3">
                {q.options.map((o:string,j:number)=>{
                  const sel=a.selectedIndex===j,cor=q.correctIndex===j;
                  let cls="text-xs px-3 py-1.5 rounded border ";
                  if(cor)cls+="border-emerald-300 bg-emerald-50 text-emerald-800";
                  else if(sel&&!cor)cls+="border-red-300 bg-red-50 text-red-800";
                  else cls+="border-zinc-100 text-zinc-500";
                  return(<div key={j} className={cls}><span className="font-bold mr-1">{String.fromCharCode(65+j)}.</span>{o.replace(/^[A-D][.\s]+/,"")}{cor?" ✓":""}{sel&&!cor?" ✗":""}</div>);
                })}
              </div>
              {a.explanation&&<p className={`text-xs p-3 rounded-lg ${ok?"bg-emerald-50 text-emerald-700":"bg-red-50 text-red-700"}`}><span className="font-bold">解析：</span>{a.explanation}</p>}
            </div>);
          })}
        </div>
        <div className="flex justify-center gap-3 mt-8 pb-8">
          <button onClick={()=>router.push("/english/reading")} className="btn-primary">再做一篇</button>
          <button onClick={()=>router.push("/english/history")} className="btn-outline">查看历史</button>
        </div>
      </div>
    );
  }

  const q = article.questions[cur];
  return (
    <div className="flex h-screen">
      <div className="flex-1 overflow-y-auto p-8 border-r">
        <button onClick={()=>router.push("/english/reading")} className="text-sm text-zinc-500 mb-4 flex items-center gap-1"><ArrowLeft className="w-4 h-4"/>返回</button>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1"><DiffBadge /><h1 className="text-xl font-bold">{article.title}</h1></div>
            <p className="text-sm text-zinc-500 mt-1">{article.wordCount} 词 · 建议 9 分钟内完成</p>
          </div>
          <div className="grid grid-cols-2 gap-2 shrink-0">
            {[
              ["summary", FileText, "总结"],
              ["translate", Languages, "翻译"],
              ["structure", ListTree, "结构"],
              ["sentences", ScanText, "长难句"],
            ].map(([action, Icon, label]: any) => (
              <button key={action} onClick={() => runAnalysis(action)} className="btn-secondary text-xs px-3 py-2">
                {analysisLoading === action ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}{label}
              </button>
            ))}
          </div>
        </div>
        {analysis && <div className="mb-6 p-4 rounded-xl bg-primary-50 border border-primary-100 text-sm text-primary-900 whitespace-pre-wrap">{analysis.content}</div>}
        {article.paragraphs.map((p:string,i:number)=>(
          <p key={i} id={"p-"+i} className={cn("text-base leading-relaxed mb-4 p-2 rounded-lg transition-all",hl===i?"bg-amber-50 border-l-2 border-amber-400":"")}>{p}</p>
        ))}
      </div>
      <div className="w-[400px] flex flex-col bg-zinc-50">
        <div className="flex justify-between px-6 py-4 border-b"><span className="text-sm">{cur+1}/{article.questions.length}</span><span className="text-sm flex items-center gap-1"><Clock className="w-4 h-4"/>{fmt(timer)}</span></div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="font-semibold mb-4">{q.questionText}</p>
          <div className="space-y-2">
            {q.options.map((o:string,i:number)=>{
              const sel = (answers.find((a:any)=>a.questionId===q.id)||{}).selectedIndex===i;
              const cor = showExp?.correctIndex===i;
              let sty = "border-zinc-200 bg-white hover:border-zinc-300";
              if (showExp) { if (cor) sty="border-emerald-500 bg-emerald-50"; else if (sel) sty="border-red-500 bg-red-50"; }
              else if (sel) sty="border-primary-500 bg-primary-50";
              return <button key={i} onClick={()=>select(i)} className={cn("w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",sty)}><span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",sel?(showExp?(cor?"bg-emerald-500 text-white":"bg-red-500 text-white"):"bg-primary-500 text-white"):"bg-zinc-100")}>{String.fromCharCode(65+i)}</span><span className="text-sm">{o.replace(/^[A-D]\.\s*/,"")}</span>{showExp&&cor&&<Check className="w-5 h-5 text-emerald-500 ml-auto"/>}{showExp&&sel&&!cor&&<X className="w-5 h-5 text-red-500 ml-auto"/>}</button>;
            })}
          </div>
          {showExp&&<div className={cn("mt-4 p-4 rounded-xl text-sm",showExp.correct?"bg-emerald-50 text-emerald-800":"bg-red-50 text-red-800")}><p className="font-medium mb-1">{showExp.correct?"✅ 正确":"❌ 错误"}</p><p>{showExp.explanation}</p>{showExp.sourceText&&<p className="text-xs mt-2 pt-2 border-t">📍 出处：{showExp.sourceText}</p>}</div>}
        </div>
        {showExp&&<div className="px-6 py-4 border-t"><button onClick={next} className="btn-primary w-full">{cur+1>=article.questions.length?"提交答案":"下一题"}</button></div>}
      </div>
    </div>
  );
}
