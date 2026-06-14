"use client";
import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BookmarkPlus, CheckCircle2, ChevronRight, GraduationCap, Loader2, Sparkles, XCircle, Volume2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveTrainingRecord, toggleErrorBook } from "@/lib/use-training-memory";
import { speakDialogue, speakText, stopSpeaking, toggleDialogue } from "@/lib/tts";

const TYPE_LABELS: Record<string, string> = { listening: "🎧 听力", matching: "🔗 段落匹配", cloze: "📝 选词填空", reading: "📖 阅读", writing: "✍️ 写作", translation: "🌐 翻译", grammar: "📐 语法", vocab: "📚 词汇", mcq: "📋 选择" };
interface Q { id:string; question:string; options:string[]; correctIndex:number; difficulty:string; explanation:string; nodeId:string; nodeTitle:string; courseName:string; type?:string; extraData?:any; }
interface A { questionId:string; selectedIndex:number; correct:boolean; nodeId:string; nodeTitle:string; }

/** 从问题文本中分离材料脚本和纯题目 */
function splitQuestion(q: Q): { script: string; question: string } {
  const fullText = q.question || "";
  const t = q.type || "";

  // 1. 优先从 extraData 获取材料（AI 单独返回的更准确）
  let script = "";
  if (t === "listening" && q.extraData?.audioScript) {
    script = String(q.extraData.audioScript).trim();
  } else if (q.extraData?.passage) {
    script = String(q.extraData.passage).trim();
  } else if (q.extraData?.paragraph) {
    script = String(q.extraData.paragraph).trim();
  }

  // 2. 如果 extraData 无材料，从问题文本中按 ❓ 分割
  if (!script) {
    const qmIdx = fullText.search(/❓/);
    if (qmIdx >= 0) {
      let before = fullText.slice(0, qmIdx);
      // 去掉材料部分的 emoji 标签，只保留纯文本
      before = before
        .replace(/^📖\s*(?:阅读材料)?[：:]?\s*\n?/im, "")
        .replace(/^📻\s*(?:听力文本)?[：:]?\s*\n?/im, "")
        .replace(/^📝\s*(?:选词填空)?[：:]?\s*\n?/im, "")
        .replace(/^📄\s*(?:阅读段落)?[：:]?\s*\n?/im, "")
        .trim();
      if (before.length > 15) script = before;

      // 问题文本 = ❓ 之后的部分
      let after = fullText.slice(qmIdx);
      after = after.replace(/^❓\s*(?:问题|匹配问题|划线词的含义是|选择最合适的词|[：:]?)?\s*/i, "").trim();
      return { script, question: after || fullText };
    }
  }

  // 3. 没有 ❓ 分隔符：尝试按双空行分割
  if (!script) {
    const doubleBlank = fullText.indexOf("\n\n");
    if (doubleBlank > 30) {
      script = fullText.slice(0, doubleBlank).trim();
      return { script, question: fullText.slice(doubleBlank).trim() };
    }
  }

  // 4. 清理问题文本：去掉残余 emoji 标签和 ❓
  let cleanQ = fullText
    .replace(/^📖\s*(?:阅读材料)?[：:]?\s*\n?/im, "")
    .replace(/^📻\s*(?:听力文本)?[：:]?\s*\n?/im, "")
    .replace(/^📝\s*(?:选词填空)?[：:]?\s*\n?/im, "")
    .replace(/^📄\s*(?:阅读段落)?[：:]?\s*\n?/im, "")
    .replace(/❓\s*(?:问题|匹配问题|划线词的含义是|选择最合适的词|[：:]?)?\s*/gi, "")
    .trim();

  // 5. 如果有 script 且问题文本中重复包含了材料内容，去除
  if (script && cleanQ.length > 30 && script.length > 20) {
    const scriptStart = script.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(scriptStart).test(cleanQ)) {
      const lines = cleanQ.split("\n");
      const mid = Math.floor(lines.length / 2);
      const secondHalf = lines.slice(mid).join("\n").trim();
      if (secondHalf.length > 5) cleanQ = secondHalf;
    }
  }

  // 6. 兜底
  if (!cleanQ || cleanQ.length < 3) {
    cleanQ = fullText.replace(/[📖📻📝📄]/g, "").trim() || fullText;
  }

  return { script, question: cleanQ };
}

/** 渲染问题文本：**word** → 高亮下划线词 */
function renderQuestion(text: string) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const word = part.slice(2, -2);
      return <strong key={i} className="text-primary-600 underline decoration-primary-300 decoration-2 underline-offset-2">{word}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function QuizContent() {
  const router = useRouter(); const sp = useSearchParams();
  const courses = sp.get("courses")?.split(",")||[]; const names = sp.get("names")?.split(",").map(decodeURIComponent)||[];
  const [questions,setQuestions] = useState<Q[]>([]); const [cur,setCur] = useState(0);
  const [answers,setAnswers] = useState<A[]>([]); const [loading,setLoading] = useState(true);
  const [submitted,setSubmitted] = useState(false); const [showExp,setShowExp] = useState(false);
  const [showScript, setShowScript] = useState(true);
  const [quizRecordId, setQuizRecordId] = useState<string | null>(null);
  const [inErrorBook, setInErrorBook] = useState(false);
  const [errorBookToggled, setErrorBookToggled] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");
  const [textSubmitted, setTextSubmitted] = useState(false);
  const fetched = useRef(false);

  useEffect(() => { if(fetched.current)return; fetched.current=true; if(courses.length===0){router.push("/");return;}
    let en=null; try{en=JSON.parse(localStorage.getItem("learnos_extracted_knowledge")||"{}").nodes||null;}catch{}
    fetch("/api/quiz",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({courseIds:courses,extractedNodes:en,courseName:names[0]||""})}).then(r=>r.json()).then(d=>{if(d.questions)setQuestions(d.questions);setLoading(false);}).catch(()=>setLoading(false));
  },[]);
  useEffect(() => () => { stopSpeaking(); }, []);

  const select = useCallback((i:number)=>{if(submitted||!questions[cur])return;stopSpeaking();const q=questions[cur];const isCorrect = i===q.correctIndex;setAnswers(p=>{const f=p.filter(a=>a.questionId!==q.id);return[...f,{questionId:q.id,selectedIndex:i,correct:isCorrect,nodeId:q.nodeId,nodeTitle:q.nodeTitle}];});setShowExp(true);const rec = saveTrainingRecord({module:(q.type==="listening"?"listening":q.type==="matching"?"matching":q.type==="cloze"?"cloze":q.type==="writing"?"writing":q.type==="translation"?"translation":"reading"),title:q.nodeTitle,question:q.question.replace(/📻.*?\\n/g,"").replace(/📄.*?\\n/g,"").replace(/📖.*?\\n/g,"").replace(/📝.*?\\n/g,"").slice(0,150),userAnswer:q.options[i]||"(未作答)",correctAnswer:q.options[q.correctIndex],isCorrect,explanation:q.explanation});setQuizRecordId(rec.id);setInErrorBook(!isCorrect);setErrorBookToggled(false);},[submitted,questions,cur]);

  // 写作/翻译提交
  const submitText = useCallback(() => {
    if (!textAnswer.trim() || !questions[cur]) return;
    const q = questions[cur];
    const isCorrect = true; // 开放题默认正确，展示参考
    setAnswers(p => [...p.filter(a=>a.questionId!==q.id), {questionId:q.id,selectedIndex:0,correct:true,nodeId:q.nodeId,nodeTitle:q.nodeTitle}]);
    setShowExp(true);
    setTextSubmitted(true);
    const rec = saveTrainingRecord({module: q.type==="writing"?"writing":"translation", title:q.nodeTitle, question: q.question.slice(0,150), userAnswer: textAnswer.slice(0,300), correctAnswer: q.extraData?.reference || q.explanation || "参考解析", isCorrect: true, explanation: q.explanation});
    setQuizRecordId(rec.id);
    setInErrorBook(false);
    setErrorBookToggled(false);
  }, [textAnswer, questions, cur]);

  const next = useCallback(()=>{stopSpeaking();setShowExp(false);setTextAnswer("");setTextSubmitted(false);cur+1>=questions.length?setSubmitted(true):setCur(cur+1);},[cur,questions.length]);
  const finish = useCallback(()=>{const ns:Record<string,any>={};answers.forEach(a=>{if(!ns[a.nodeId])ns[a.nodeId]={correct:0,total:0,title:a.nodeTitle};ns[a.nodeId].total++;if(a.correct)ns[a.nodeId].correct++;});localStorage.setItem("learnos_quiz_results",JSON.stringify({answers,totalCorrect:answers.filter(a=>a.correct).length,totalQuestions:answers.length,nodeScores:Object.entries(ns).map(([id,d])=>({nodeId:id,title:d.title,score:Math.round((d.correct/d.total)*100),correct:d.correct,total:d.total})),completedAt:new Date().toISOString()}));router.push("/plan?name="+encodeURIComponent(names[0]||""));},[answers,router,names]);

  if(loading)return<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500"/></div>;
  if(submitted){const c=answers.filter(a=>a.correct).length;const s=answers.length>0?Math.round((c/answers.length)*100):0;const bd:Record<string,{correct:number;total:number}>={};answers.forEach(a=>{if(!bd[a.nodeTitle])bd[a.nodeTitle]={correct:0,total:0};bd[a.nodeTitle].total++;if(a.correct)bd[a.nodeTitle].correct++;});
    return(<div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6"><div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 animate-bounce-in"><div className="text-center"><GraduationCap className="w-14 h-14 text-primary-400 mx-auto mb-4"/><h2 className="text-2xl font-bold">诊断完成</h2><div className="mt-4"><span className={cn("text-6xl font-extrabold",s>=80?"text-emerald-600":s>=50?"text-amber-600":"text-red-600")}>{s}</span><span className="text-zinc-300 text-2xl ml-1">/100</span></div><p className="text-zinc-500 mt-2">答对 {c}/{answers.length} 题</p></div><div className="mt-6 space-y-1 max-h-48 overflow-y-auto">{Object.entries(bd).slice(0,8).map(([t,d])=>(<div key={t} className="flex justify-between py-1.5 px-2 rounded-lg hover:bg-zinc-50"><span className="text-sm truncate max-w-[200px]">{t}</span><span className={cn("text-sm font-bold",d.correct===d.total?"text-emerald-600":d.correct===0?"text-red-600":"text-amber-600")}>{d.correct}/{d.total}</span></div>))}</div><button onClick={finish} className="btn-primary w-full mt-6 text-base"><Sparkles className="w-5 h-5"/>查看专属计划<ArrowRight className="w-5 h-5"/></button></div></div>);}
  if(questions.length===0)return<div className="min-h-screen flex items-center justify-center"><p className="text-zinc-500">题目生成中...</p></div>;
  const q=questions[cur];if(!q)return<div className="min-h-screen flex items-center justify-center"><p className="text-zinc-500">加载失败</p></div>;
  const ca=answers.find(a=>a.questionId===q.id);const isLast=cur>=questions.length-1;const prog=((cur+1)/questions.length)*100;
  const { script, question: questionText } = splitQuestion(q);
  const isListening = q.type === "listening";

  return(<div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4"><div className="w-full max-w-2xl">
    <div className="mb-5"><div className="flex justify-between mb-2"><span className="text-sm font-bold text-zinc-500">诊断测验</span><span className="text-sm font-bold">{cur+1}<span className="text-zinc-300">/</span>{questions.length}</span></div><div className="progress-bar"><div className="progress-fill-primary" style={{width:`${prog}%`}}/></div></div>
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-8 animate-slide-up" key={cur}>
      <div className="flex items-center gap-2 mb-5">
        <span className={cn("badge",q.difficulty==="easy"?"badge-success":q.difficulty==="medium"?"badge-warning":"badge-danger")}>{q.difficulty==="easy"?"基础":q.difficulty==="medium"?"中等":"困难"}</span>
        {q.type && TYPE_LABELS[q.type] && <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 border border-primary-200">{TYPE_LABELS[q.type]}</span>}
        <span className="text-xs text-zinc-400 ml-auto">{q.nodeTitle}</span>
      </div>

      {/* 听力题：脚本 + 播放 */}
      {isListening && script && (
        <div className="mb-5 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-600">🎧 听力文本</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => toggleDialogue(script)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors">
                <Volume2 className="w-3.5 h-3.5" /> 播放/暂停
              </button>
              <button onClick={() => setShowScript(!showScript)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white text-blue-600 text-xs hover:bg-blue-50 transition-colors">
                {showScript ? <><EyeOff className="w-3 h-3" /> 隐藏</> : <><Eye className="w-3 h-3" /> 显示</>}
              </button>
            </div>
          </div>
          {showScript && <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">{renderQuestion(script)}</p>}
          {!showScript && <p className="text-xs text-zinc-400 italic">听力原文已隐藏，点击"显示"查看</p>}
        </div>
      )}

      {/* 材料显示区 — 阅读/匹配/选词/词汇 */}
      {(q.type === "reading" || q.type === "matching" || q.type === "cloze" || q.type === "vocab") && script && !isListening && (
        <div className="mb-5 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
          <span className="text-xs font-bold text-amber-600">
            {q.type === "cloze" ? "📝 选词填空" : q.type === "matching" ? "📄 阅读段落" : q.type === "vocab" ? "📚 词汇句子" : "📖 阅读材料"}
          </span>
          <p className="text-sm leading-relaxed text-zinc-700 mt-1.5 whitespace-pre-wrap">{renderQuestion(script)}</p>
        </div>
      )}

      {/* 问题文本 — 纯题目，材料已在上面单独显示 */}
      <h3 className="text-base font-bold mb-6 leading-relaxed">{renderQuestion(questionText)}</h3>

      {/* 选项（写作/翻译用文本框，其他用MCQ） */}
      {(q.type === "writing" || q.type === "translation") && q.options?.length === 0 ? (
        <div className="space-y-4 mb-2">
          <textarea
            value={textAnswer}
            onChange={e => setTextAnswer(e.target.value)}
            disabled={textSubmitted}
            placeholder={q.type === "writing" ? "在此输入你的英文作文（不少于120词）…" : "在此输入你的英文翻译…"}
            rows={q.type === "writing" ? 10 : 5}
            className="input min-h-[120px] resize-y"
            autoFocus
          />
          {!textSubmitted && (
            <button onClick={submitText} disabled={!textAnswer.trim()}
              className="btn-primary w-full text-base h-12">
              提交答案 <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5 mb-2">
          {q.options.map((o,i)=>{
            const sel=ca?.selectedIndex===i;
            const cor=i===q.correctIndex;
            let cls="quiz-option";
            if(showExp&&ca){if(cor)cls="quiz-option-correct";else if(sel&&!cor)cls="quiz-option-wrong";}else if(sel)cls="quiz-option-selected";
            const label = String.fromCharCode(65+i);
            const text = o.replace(/^[A-D][.、．\s]+/, "");
            return(
              <button key={i} onClick={()=>select(i)}
                className={cn(cls, "w-full text-left px-5 py-4 rounded-xl border-2 transition-all flex items-center gap-4 animate-slide-up")}
                style={{animationDelay:`${i*60}ms`}}>
                <span className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors",
                  sel
                    ? (showExp
                        ? (cor ? "bg-emerald-500 text-white" : "bg-red-500 text-white")
                        : "bg-primary-500 text-white")
                    : "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200"
                )}>{label}</span>
                <span className="text-sm flex-1">{text}</span>
                {showExp&&cor&&<CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0"/>}
                {showExp&&sel&&!cor&&<XCircle className="w-5 h-5 text-red-500 shrink-0"/>}
              </button>
            );
          })}
        </div>
      )}

      {showExp&&(
        q.type === "writing" || q.type === "translation" ? (
          // 写作/翻译反馈区
          <div className="mt-5 p-4 rounded-xl text-sm animate-slide-up bg-blue-50 text-blue-800">
            <p className="font-bold mb-2">📝 你的作答</p>
            <div className="bg-white p-3 rounded-lg mb-3 text-sm whitespace-pre-wrap">{textAnswer}</div>
            {q.explanation && (
              <>
                <p className="font-bold mb-1">💡 参考要点</p>
                <p className="text-sm">{q.explanation}</p>
              </>
            )}
            {q.extraData?.reference && (
              <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
                <p className="font-bold text-emerald-700 mb-1">✅ 参考译文</p>
                <p className="text-sm text-emerald-700">{q.extraData.reference}</p>
              </div>
            )}
            {q.extraData?.rubric && (
              <p className="text-xs text-zinc-400 mt-2">📊 评分标准：{q.extraData.rubric}</p>
            )}
          </div>
        ) : ca && (
        <div className={cn("mt-5 p-4 rounded-xl text-sm animate-slide-up",ca.correct?"bg-emerald-50 text-emerald-800":"bg-red-50 text-red-800")}>
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold mb-1">{ca.correct?"✅ 正确":"❌ 错误"}</p>
            {quizRecordId && (
              <button onClick={() => { toggleErrorBook(quizRecordId!); setInErrorBook(!inErrorBook); setErrorBookToggled(true); }}
                className={`shrink-0 text-xs flex items-center gap-0.5 transition-colors ${
                  errorBookToggled ? (inErrorBook ? "text-emerald-500" : "text-zinc-400") :
                  inErrorBook ? "text-amber-500 hover:text-amber-700" : "text-amber-500 hover:text-amber-700"
                }`}>
                {inErrorBook ? (
                  <><CheckCircle2 className="w-3 h-3" /> {errorBookToggled ? "已加入错题本" : "在错题本中"}</>
                ) : (
                  <><BookmarkPlus className="w-3 h-3" /> 加入错题本</>
                )}
              </button>
            )}
          </div>
          <p className="whitespace-pre-wrap">{q.explanation}</p>
        </div>
      ))}

      <div className="mt-6">
        {!showExp ? (
          <div className="h-10"/>
        ) : (
          <button onClick={isLast?finish:next} className="btn-primary w-full text-base flex items-center justify-center gap-2 h-12">
            {isLast?"完成诊断":"下一题"}<ChevronRight className="w-5 h-5"/>
          </button>
        )}
      </div>
    </div>
  </div></div>);
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500"/></div>}>
      <QuizContent />
    </Suspense>
  );
}
