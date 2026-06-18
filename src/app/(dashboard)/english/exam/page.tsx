"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Clock, Send, AlertCircle, CheckCircle2, PenLine, Headphones, BookOpen, Languages, ChevronRight, RefreshCw, History, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { speakDialogue, speakText, stopSpeaking } from "@/lib/tts";
import ListeningPlayer from "@/components/english/ListeningPlayer";
import { saveTrainingStateDirect, loadTrainingState, clearTrainingState } from "@/lib/training-memory";
import DifficultyPicker from "@/components/english/DifficultyPicker";
import { DiffBadge } from "@/components/english/DiffBadge";

type Section = "list" | "writing" | "listening" | "cloze" | "matching" | "reading" | "translation" | "result";
const ORDER: Section[] = ["writing","listening","cloze","matching","reading","translation"];
const LABELS: Record<string,string> = { writing:"写作(30min)", listening:"听力(25min)", cloze:"选词填空(15min)", matching:"段落匹配(15min)", reading:"仔细阅读(25min)", translation:"翻译(30min)" };
const ICONS: Record<string,any> = { writing:PenLine, listening:Headphones, cloze:BookOpen, matching:BookOpen, reading:BookOpen, translation:Languages };

function ExamPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const isReal = sp.get("real") === "1";
  const realSet = sp.get("set") || "";

  const [view, setView] = useState<Section>("list");
  const [level, setLevel] = useState<"cet4"|"cet6">("cet4");
  const [difficulty, setDifficulty] = useState("mixed");
  const [exam, setExam] = useState<Record<string,any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 真题模式：自动加载并开始
  useEffect(() => {
    if (!isReal) return;
    try {
      const raw = localStorage.getItem("learnos_real_exam_data");
      if (!raw) { router.push("/english/real-exams"); return; }
      const data = JSON.parse(raw);
      setLevel(data.level || "cet4");
      (async () => {
        setLoading(true);
        try {
          const r = await fetch("/api/english/exam/generate", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ level: data.level || "cet4", real: true, writing: data.writing, translation: data.translation }),
          });
          const d = await r.json();
          if (d.success) {
            setExam(d.sections);
            timesRef.current = {}; setCurrentTime(0);
            startTimer(); setView("writing");
          } else setError(d.error || "生成失败");
        } catch { setError("网络错误"); }
        setLoading(false);
      })();
    } catch { router.push("/english/real-exams"); }
  }, [isReal]);

  const [currentTime, setCurrentTime] = useState(0);
  const timesRef = useRef<Record<string,number>>({});
  const timerRef = useRef<NodeJS.Timeout|null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [breakdown, setBreakdown] = useState<Record<string,number>>({});
  const [times, setTimes] = useState<Record<string,number>>({});

  // 辅助：直接保存（切 section、定期、交卷时都会调用）
  const doSaveExam = () => {
    if (view === "list" || view === "result") return;
    saveTrainingStateDirect("exam", {
      currentIndex: ORDER.indexOf(view),
      answers: { view, currentTime, times: { ...timesRef.current }, examData: exam },
    });
  };

  // 切 section 时保存
  useEffect(() => { doSaveExam(); }, [view]);

  // 每 10 秒自动保存（防止写作/翻译长文本丢失）
  useEffect(() => {
    if (view === "list" || view === "result") return;
    const t = setInterval(() => doSaveExam(), 10000);
    return () => { doSaveExam(); clearInterval(t); }; // 卸载时也保存
  }, [view, exam]);

  // 恢复进度
  useEffect(() => {
    if (view !== "list" || isReal) return;
    const saved = loadTrainingState("exam");
    if (!saved?.answers?.examData) return;
    const ans = saved.answers;
    if (!ans.examData?.writing?.prompt && !ans.examData?.listening) return;
    setExam(ans.examData);
    timesRef.current = ans.times || {};
    setCurrentTime(ans.currentTime || 0);
    const sv = ORDER[Math.max(0, saved.currentIndex || 0)] as Section;
    setView(sv);
    if (sv !== "list" && sv !== "result") startTimer();
  }, []);

  const fmt = (s:number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      setCurrentTime(Math.floor((Date.now() - start) / 1000));
    }, 200);
  };
  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  const switchTo = (to: Section) => {
    if (view !== "list" && view !== "result") timesRef.current[view] = (timesRef.current[view]||0) + currentTime;
    stopSpeaking();
    setCurrentTime(0);
    setView(to);
    stopTimer();
    if (to !== "list" && to !== "result") startTimer();
  };

  useEffect(() => () => { stopTimer(); stopSpeaking(); }, []);

  const generateExam = async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/english/exam/generate", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({level,difficulty}) });
      const d = await r.json();
      if (d.success) { setExam(d.sections); timesRef.current = {}; setCurrentTime(0); switchTo("writing"); }
      else setError(d.error||"失败");
    } catch { setError("网络错误"); }
    setLoading(false);
  };

  const submitExam = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (view !== "result") timesRef.current[view] = (timesRef.current[view]||0) + currentTime;
    setTimes({...timesRef.current});
    setLoading(true);
    const answers: any[] = [];
    if (exam.writing?.userAnswer) answers.push({section:"writing",type:"writing",userAnswer:exam.writing.userAnswer,question:exam.writing.prompt,score:106});
    for (const sec of ["A","B","C"]) for (const g of exam.listening?.sections?.[sec]?.groups||[]) for (const q of g.questions||[]) if (q.userAnswer) answers.push({section:"listening",type:"listening",userAnswer:q.userAnswer,options:q.options,correctIndex:q.correctIndex,score:7});
    for (const [n,ans] of Object.entries(exam.cloze?.userAnswers||{})) answers.push({section:"cloze",type:"cloze",userAnswer:ans,blank:n,answers:exam.cloze?.answers,score:3.5});
    for (const q of exam.matching?.questions||[]) if (q.userAnswer) answers.push({section:"matching",type:"matching",userAnswer:q.userAnswer,correctAnswer:q.correctParagraph,score:7});
    for (const art of exam.reading?.articles||[]) for (const q of art.questions||[]) if (q.userAnswer) answers.push({section:"reading",type:"reading",userAnswer:q.userAnswer,options:q.options,correctIndex:q.correctIndex,score:14});
    if (exam.translation?.userAnswer) answers.push({section:"translation",type:"translation",userAnswer:exam.translation.userAnswer,question:exam.translation.prompt,score:106});

    try {
      const r = await fetch("/api/english/exam/score", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({level,answers}) });
      const d = await r.json();
      if (d.success) { setTotalScore(d.totalScore); setBreakdown(d.breakdown||{}); }
    } catch {}
    setLoading(false); setView("result");
    clearTrainingState("exam");
  };

  const updateExam = (path: string[], value: any) => {
    setExam((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      let obj = next;
      for (let i=0;i<path.length-1;i++) obj = obj[path[i]];
      obj[path[path.length-1]] = value;
      return next;
    });
  };

  // ===== LIST =====
  if (view==="list") {
    if (isReal && loading) return <div className="p-12 text-center"><div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin mx-auto mb-3"/><p className="text-zinc-500">正在加载真题…</p></div>;
    if (isReal && error) return <div className="p-12 text-center"><AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3"/><p className="text-red-500">{error}</p><button onClick={()=>router.push("/english/real-exams")} className="btn-secondary mt-4">返回真题列表</button></div>;
    const savedExam = loadTrainingState("exam");
    const hasProgress = savedExam?.answers?.examData?.writing?.prompt;
    return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">📝 整卷练习</h1>
        <button onClick={() => router.push("/english/history?tab=exam")}
          className="btn-secondary text-xs px-3 py-2 flex items-center gap-1">
          <History className="w-3.5 h-3.5" /> 历史
        </button>
      </div>
      <p className="text-zinc-500 mb-6">全真模拟四六级 · 写作→听力(SecA/B/C)→选词填空→段落匹配→仔细阅读→翻译</p>
      {hasProgress && !isReal && (
        <div className="card border-amber-200 bg-amber-50 mb-4 p-4 flex items-center justify-between">
          <div><p className="font-medium text-amber-800">有未完成的考试</p><p className="text-xs text-amber-600">上次做到 {LABELS[savedExam.answers.view]?.split("(")[0] || "?"}</p></div>
          <div className="flex gap-2">
            <button onClick={() => { clearTrainingState("exam"); window.location.reload(); }} className="text-xs text-zinc-400 hover:text-red-500">放弃</button>
            <button onClick={() => {
              setExam(savedExam.answers.examData);
              timesRef.current = savedExam.answers.times || {};
              setCurrentTime(savedExam.answers.currentTime || 0);
              setView(savedExam.answers.view || "writing");
              startTimer();
            }} className="btn-primary text-xs">继续答题</button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card border-primary-200 bg-primary-50/30 p-5"><RefreshCw className="w-8 h-8 text-primary-500 mb-3"/><h3 className="font-bold">全真模拟</h3><p className="text-sm text-zinc-500 mt-1">AI按四六级标准生成</p></div>
        <button onClick={()=>router.push("/english/real-exams")} className="card border-amber-200 bg-amber-50/30 p-5 text-left hover:shadow"><History className="w-8 h-8 text-amber-500 mb-3"/><h3 className="font-bold">真题汇总</h3><p className="text-sm text-zinc-500 mt-1">近10年真题</p></button>
      </div>
      <div className="card p-6">
        <h2 className="font-bold text-lg mb-4">模拟考试</h2>
        <div className="flex gap-3 mb-3">{(["cet4","cet6"]as const).map(l=><button key={l} onClick={()=>setLevel(l)} disabled={loading} className={cn("flex-1 py-3 rounded-xl border-2 font-bold transition-all duration-200",level===l?"border-primary-500 bg-primary-50 text-primary-700":"border-zinc-200 hover:border-zinc-300")}>{l==="cet4"?"CET-4":"CET-6"}</button>)}</div>
        <div className="mb-4"><DifficultyPicker value={difficulty} onChange={setDifficulty} /></div>
        {!loading ? (
          <button onClick={generateExam} className="btn-primary w-full py-3.5 text-base">
            开始考试 <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <div className="animate-scale-in">
            <div className="bg-primary-50 rounded-2xl p-6 border border-primary-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-white animate-spin-slow" />
                </div>
                <div>
                  <p className="font-bold text-primary-700">AI 正在生成试卷</p>
                  <p className="text-xs text-primary-500">写作 · 听力 · 阅读 · 翻译 — 四六级标准</p>
                </div>
              </div>
              <div className="space-y-2">
                {["写作题目", "听力 Section A/B/C", "选词填空 · 段落匹配", "仔细阅读 2篇", "翻译段落"].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-primary-600 animate-slide-up" style={{ animationDelay: `${i * 0.15}s`, animationFillMode: "backwards" }}>
                    <div className="w-5 h-5 rounded-full bg-primary-200 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                    </div>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-primary-400 mt-4 text-center">AI 逐题原创，请耐心等待约 30 秒</p>
            </div>
          </div>
        )}
        {error&&<p className="text-red-500 text-sm mt-3 flex items-center gap-1"><AlertCircle className="w-4 h-4"/>{error}</p>}
      </div>
    </div>
  );
  }

  // ===== RESULT =====
  if (view==="result") return (
    <div className="p-6 max-w-2xl mx-auto text-center">
      <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4"><CheckCircle2 className="w-10 h-10 text-emerald-500"/></div>
      <h1 className="text-3xl font-bold mb-2">考试完成</h1>
      <div className="flex flex-wrap justify-center gap-2 mb-5 text-xs">{Object.entries(times).map(([k,v])=><div key={k} className="px-3 py-1.5 bg-zinc-100 rounded-full font-medium">{LABELS[k]?.split("(")[0]||k} {fmt(v as number)}</div>)}</div>
      <div className="card-glass p-8 mb-6"><span className={cn("text-7xl font-extrabold",totalScore>=425?"text-emerald-600":totalScore>=380?"text-amber-600":"text-red-600")}>{totalScore}</span><span className="text-zinc-300 text-2xl ml-2">/710</span>{totalScore>=425&&<p className="text-emerald-500 font-bold mt-1">🎉 恭喜通过！</p>}{totalScore<425&&<p className="text-zinc-400 text-sm mt-1">425分通过线</p>}</div>
      <div className="grid grid-cols-3 gap-3 mb-6">{Object.entries(breakdown).map(([k,v])=><div key={k} className="card p-4"><p className="text-xs text-zinc-400 mb-1">{k}</p><p className="text-2xl font-bold text-primary-600">{v}</p></div>)}</div>
      <div className="flex gap-3 justify-center"><button onClick={()=>{setView("list");setExam({});}} className="btn-secondary px-6 py-3">再做一套</button><button onClick={()=>router.push("/cockpit")} className="btn-primary px-6 py-3">去驾驶舱</button></div>
    </div>
  );

  // ===== MCQ子组件 =====
  const MCQ = ({q,onAns,hideQuestion}:{q:any;onAns:(id:string,ans:string)=>void;hideQuestion?:boolean}) => (
    <div className="mb-4 p-4 card">
      {!hideQuestion && <div className="flex items-center gap-2 mb-3"><DiffBadge /><p className="text-sm font-medium leading-relaxed">{q.question}</p></div>}
      <div className="space-y-2">
        {q.options?.map((opt:string,j:number)=>{const L=String.fromCharCode(65+j);return(
          <button key={j} onClick={()=>onAns(q.id,L)} className={cn("w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200",q.userAnswer===L?"border-primary-400 bg-primary-50 text-primary-700 shadow-sm":"border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50")}>
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-100 text-xs font-bold mr-3">{L}</span>{opt.replace(/^[A-D][.、．\s]+/,"")}
          </button>
        );})}
      </div>
    </div>
  );

  // ===== EXAM CONTENT =====
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-zinc-50/90 backdrop-blur-sm py-3 px-4 -mx-4 rounded-b-2xl border-b border-zinc-200/60 z-10">
        <button onClick={()=>{if(timerRef.current)clearInterval(timerRef.current);setView("list");}} className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1 font-medium"><ArrowLeft className="w-4 h-4"/>退出</button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-full"><Clock className="w-3.5 h-3.5 inline mr-1"/>{fmt(currentTime)}</span>
          <button onClick={submitExam} className="btn-primary text-xs px-4 py-2"><Send className="w-3.5 h-3.5 inline mr-1"/>交卷</button>
        </div>
      </div>
      <div className="flex gap-1.5 mb-6 bg-zinc-100 p-1 rounded-xl">
        {ORDER.map(s=>{const I=ICONS[s];return(
          <button key={s} onClick={()=>switchTo(s)} className={cn("flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 whitespace-nowrap transition-all duration-200",view===s?"bg-white text-zinc-900 shadow-sm":"text-zinc-500 hover:text-zinc-700")}>
            <I className="w-3 h-3"/>{LABELS[s]?.split("(")[0]}
          </button>
        );})}
      </div>
      <h2 className="font-bold text-lg mb-4">{LABELS[view]||""}</h2>

      {/* WRITING */}
      {view==="writing"&&(
        <div className="card p-6">
          <p className="text-sm whitespace-pre-wrap leading-relaxed mb-4">{exam.writing?.prompt||""}</p>
          <textarea value={exam.writing?.userAnswer||""} onChange={e=>updateExam(["writing","userAnswer"],e.target.value)}
            className="w-full px-4 py-3 border rounded-xl text-sm min-h-[300px]" placeholder="在此写作…"/>
        </div>
      )}

      {/* LISTENING — 真题格式：每个对话/段落共享一个音频播放器 */}
      {view==="listening"&&Object.entries(exam.listening?.sections||{}).map(([key,sec]:[string,any])=>(
        <div key={key} className="mb-8">
          <h3 className="font-bold text-base text-primary-700 mb-2">{sec.label}</h3>
          <p className="text-xs text-zinc-500 mb-4 italic">{sec.direction}</p>
          {(sec.groups||[]).map((group:any, gi:number) => {
            const onAns = (id:string,ans:string)=>{
              const qi = group.questions.findIndex((x:any)=>x.id===id);
              if(qi>=0) updateExam(["listening","sections",key,"groups",gi,"questions",qi,"userAnswer"],ans);
            };
            return (
            <div key={gi} className="mb-6 border-l-4 border-blue-300 pl-4">
              <h4 className="text-xs font-semibold text-blue-500 mb-3 uppercase tracking-wide">{group.label}</h4>
              {/* 整个组共享一个音频播放器 */}
              <ListeningPlayer script={group.audioScript || group.questions?.[0]?.audioScript || ""} />
              <div className="mt-3 space-y-1">
                {group.questions.map((q:any) => (
                  <MCQ key={q.id} q={q} onAns={onAns} hideQuestion />
                ))}
              </div>
            </div>
            );
          })}
        </div>
      ))}

      {/* CLOZE */}
      {view==="cloze"&&(
        <div className="card p-6">
          <h3 className="text-xs font-bold text-zinc-400 mb-3">选词填空（15选10）</h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap mb-4">{exam.cloze?.passage||""}</p>
          <div className="mb-4"><p className="text-xs font-bold text-zinc-400 mb-2">词库</p>
            <div className="flex flex-wrap gap-1.5">{(exam.cloze?.wordBank||[]).map((w:string,i:number)=><span key={i} className="px-2 py-1 bg-zinc-100 rounded text-xs font-mono">{w}</span>)}</div>
          </div>
          {[...Array(10)].map((_,i)=>{const n=26+i;return(
            <div key={n} className="flex items-center gap-2 mb-2"><span className="text-xs font-bold w-6">{n}.</span>
              <input value={(exam.cloze?.userAnswers||{})[n]||""} onChange={e=>updateExam(["cloze","userAnswers"],{...exam.cloze?.userAnswers,[n]:e.target.value.toUpperCase().slice(0,1)})} className="w-10 px-2 py-1 border rounded text-center text-sm font-mono" maxLength={1} placeholder="?"/>
            </div>
          );})}
        </div>
      )}

      {/* MATCHING */}
      {view==="matching"&&(
        <div className="card p-6">
          <h3 className="text-xs font-bold text-zinc-400 mb-3">段落匹配（A-K共11段）</h3>
          <div className="mb-4 p-3 bg-zinc-50 rounded-lg max-h-80 overflow-y-auto text-xs leading-relaxed whitespace-pre-wrap">{exam.matching?.passage||""}</div>
          {(exam.matching?.questions||[]).map((q:any,i:number)=>(
            <div key={q.id} className="flex items-center gap-3 mb-2 p-2 border rounded-lg">
              <span className="text-xs font-bold w-6">{36+i}.</span><p className="flex-1 text-sm">{q.text||q.question}</p>
              <select value={q.userAnswer||""} onChange={e=>{const idx=(exam.matching?.questions||[]).findIndex((x:any)=>x.id===q.id);if(idx>=0)updateExam(["matching","questions",idx,"userAnswer"],e.target.value);}} className="px-2 py-1 border rounded text-sm"><option value="">选</option>{(exam.matching?.paragraphs||[]).map((p:string)=><option key={p}>{p}</option>)}</select>
            </div>
          ))}
        </div>
      )}

      {/* READING */}
      {view==="reading"&&(exam.reading?.articles||[]).map((art:any,ai:number)=>(
        <div key={ai} className="card p-6 mb-4">
          <h3 className="text-xs font-bold text-zinc-400 mb-3">Passage {ai+1}</h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap mb-4">{art.passage}</p>
          {art.questions.map((q:any,i:number)=><MCQ key={q.id} q={q} onAns={(id,ans)=>{const qi=art.questions.findIndex((x:any)=>x.id===id);if(qi>=0)updateExam(["reading","articles",ai,"questions",qi,"userAnswer"],ans);}}/>)}
        </div>
      ))}

      {/* TRANSLATION */}
      {view==="translation"&&(
        <div className="card p-6">
          <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap">{exam.translation?.prompt||""}</p>
          <textarea value={exam.translation?.userAnswer||""} onChange={e=>updateExam(["translation","userAnswer"],e.target.value)}
            className="w-full px-4 py-3 border rounded-xl text-sm min-h-[300px]" placeholder="在此翻译…"/>
        </div>
      )}
    </div>
  );
}

export default function ExamPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center"><div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin mx-auto mb-3"/><p className="text-zinc-500">加载考试页面…</p></div>}>
      <ExamPageInner />
    </Suspense>
  );
}
