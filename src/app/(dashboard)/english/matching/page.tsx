"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle, Languages, Link2, BookmarkPlus, Shuffle, History } from "lucide-react";
import AiSearchBox from "@/components/english/AiSearchBox";
import DifficultyPicker from "@/components/english/DifficultyPicker";
import { DiffBadge } from "@/components/english/DiffBadge";
import LinkImporter from "@/components/english/LinkImporter";
import { saveTrainingRecord } from "@/lib/use-training-memory";
import { saveTrainingState, loadTrainingState, clearTrainingState } from "@/lib/training-memory";

interface Paragraph { label: string; text: string; }
interface MatchQuestion { id: number; text: string; textZh?: string; answerLabel: string; locateSentence: string; paraphraseNote: string; }

const dPara: Paragraph[] = [
  { label: "A", text: "The nature of work is undergoing a profound transformation. Automation and artificial intelligence are reshaping industries at an unprecedented pace. While many fear that machines will replace human workers entirely, the reality is more nuanced. Certain tasks are indeed being automated." },
  { label: "B", text: "One sector that has seen significant change is manufacturing. Robots now handle assembly lines that once employed thousands of workers. Yet the same factories now need technicians who can program and maintain these robots. The skill requirements have shifted rather than disappeared." },
  { label: "C", text: "The service industry presents a different picture. While chatbots handle basic customer inquiries, complex complaints still require human intervention. Research suggests that customers prefer human agents for emotionally sensitive issues." },
  { label: "D", text: "Education systems worldwide are struggling to keep pace with these changes. Traditional curricula often emphasize rote memorization over critical thinking. Forward-thinking institutions are introducing courses in data literacy and design thinking." },
  { label: "E", text: "The gig economy has exploded in recent years, with millions of workers choosing flexible arrangements over traditional employment. However, this model also raises concerns about job security, benefits, and worker protections." },
  { label: "F", text: "Remote work, accelerated by the global pandemic, has become a permanent fixture for many organizations. Studies show that productivity often remains stable or even improves when employees work from home." },
  { label: "G", text: "Demographic shifts add another layer of complexity to the labor market. As populations age in developed countries, fewer young workers enter the workforce. This creates challenges for pension systems." },
  { label: "H", text: "Emotional intelligence is becoming increasingly valued in the modern workplace. The ability to understand and manage emotions—both one's own and others'—sets human workers apart from machines." },
  { label: "I", text: "Looking ahead, the most successful workers will likely be those who can adapt continuously. The concept of a single career path is giving way to portfolio careers with multiple income streams." },
  { label: "J", text: "Government policies have not kept up with rapid changes in the labor market. Many countries still lack comprehensive frameworks for regulating gig work and ensuring fair treatment of freelancers." },
  { label: "K", text: "Technology companies are investing heavily in retraining programs for displaced workers. These initiatives offer free online courses in high-demand fields such as data science and cybersecurity." },
  { label: "L", text: "The mental health implications of job insecurity cannot be overlooked. Studies indicate that workers in unstable employment experience higher rates of anxiety and depression." },
  { label: "M", text: "International cooperation will be essential in addressing global challenges posed by automation. No single country can solve these problems alone in an interconnected world." },
];

const dQs: MatchQuestion[] = [
  { id: 1, text: "Automation and AI are reshaping industries at an unprecedented speed, but the outcome is more complex than most people assume.", answerLabel: "A", locateSentence: "Automation and artificial intelligence are reshaping industries at an unprecedented pace.", paraphraseNote: "'speed'='pace', 'outcome more complex'='reality is more nuanced'" },
  { id: 2, text: "In manufacturing, skill requirements have transformed rather than vanished, with workers being retrained for technical roles.", answerLabel: "B", locateSentence: "The skill requirements have shifted rather than disappeared.", paraphraseNote: "'transformed'='shifted', 'technical roles'='oversee automated systems'" },
  { id: 3, text: "Customers prefer speaking to human agents when dealing with emotionally sensitive issues rather than chatbots.", answerLabel: "C", locateSentence: "customers prefer human agents for emotionally sensitive issues.", paraphraseNote: "'speaking to'→'prefer...for'" },
  { id: 4, text: "Lifelong learning has transformed from a mere slogan into an essential requirement for surviving in today's career landscape.", answerLabel: "D", locateSentence: "Lifelong learning is no longer a buzzword but a necessity for career survival.", paraphraseNote: "'mere slogan'='buzzword', 'essential requirement'='necessity'" },
  { id: 5, text: "The gig economy offers workers flexibility but simultaneously creates concerns about employment security and benefits.", answerLabel: "E", locateSentence: "this model also raises concerns about job security, benefits, and worker protections.", paraphraseNote: "'offers flexibility' vs 'concerns about security'" },
  { id: 6, text: "Hybrid work arrangements that combine in-office and remote days have emerged as the most widely accepted solution.", answerLabel: "F", locateSentence: "Hybrid models—combining office and remote days—are emerging as the most popular compromise.", paraphraseNote: "'widely accepted'='most popular'" },
  { id: 7, text: "Teams composed of different age groups tend to produce superior decisions by merging life experience with innovative thinking.", answerLabel: "G", locateSentence: "Age-diverse teams have been shown to make better decisions by combining experience with fresh perspectives.", paraphraseNote: "'different age groups'='age-diverse', 'innovative thinking'='fresh perspectives'" },
  { id: 8, text: "As machines take over routine mental tasks, emotional abilities are becoming a key differentiator for human employees.", answerLabel: "H", locateSentence: "As routine cognitive tasks are automated, the ability to understand and manage emotions...sets human workers apart.", paraphraseNote: "'machines take over'='are automated', 'key differentiator'='sets...apart'" },
  { id: 9, text: "The most competitive professionals in the future will be characterized by their capacity for continuous adaptation.", answerLabel: "I", locateSentence: "the most successful workers will likely be those who can adapt continuously.", paraphraseNote: "'competitive'='successful', 'capacity for'='can'" },
  { id: 10, text: "Rather than following a single career trajectory, people are increasingly building portfolio careers with multiple revenue sources.", answerLabel: "I", locateSentence: "The concept of a single career path is giving way to portfolio careers.", paraphraseNote: "'career trajectory'='career path', 'revenue sources'='income streams'" },
];

export default function MatchingPage() {
  const router = useRouter();
  const [title, setTitle] = useState("The Future of Work");
  const [topic, setTopic] = useState("职场趋势");
  const [paragraphs, setParagraphs] = useState<Paragraph[]>(dPara);
  const [questions, setQuestions] = useState<MatchQuestion[]>(dQs);
  const [difficulty, setDifficulty] = useState("mixed");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [transQ, setTransQ] = useState<Set<number>>(new Set());
  const [passageZh, setPassageZh] = useState("");
  const [showPassageZh, setShowPassageZh] = useState(false);
  const [transPassage, setTransPassage] = useState(false);
  const pl = paragraphs.map(p => p.label);
  const done = Object.keys(answers).length === questions.length;
  // 所有已选段落 → 全部红标
  const selectedLabels = new Set(Object.values(answers).filter(Boolean));

  // 恢复进度
  useEffect(() => {
    const saved = loadTrainingState("matching");
    if (!saved?.answers) return;
    const ans = saved.answers;
    if (ans.paragraphs) setParagraphs(ans.paragraphs);
    if (ans.questions) setQuestions(ans.questions);
    if (ans.userAnswers) setAnswers(ans.userAnswers);
    if (ans.title) setTitle(ans.title);
    if (ans.topic) setTopic(ans.topic);
  }, []);

  // 自动保存进度
  useEffect(() => {
    if (submitted) return;
    saveTrainingState("matching", {
      currentIndex: 0,
      answers: { paragraphs, questions, userAnswers: answers, title, topic },
    });
  }, [paragraphs, questions, answers, title, topic, submitted]);

  const loadNew = async () => {
    clearTrainingState("matching");
    setLoading(true); setAnswers({}); setSubmitted(false); setScore(null);
    setTransQ(new Set()); setPassageZh(""); setShowPassageZh(false);
    try {
      const resp = await fetch("/api/english/refresh", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ module: "matching", level: "cet4", difficulty }) });
      const data = await resp.json();
      if (data.success && data.paragraphs?.length >= 10 && data.questions?.length >= 8 && data.paragraphs.length > data.questions.length) {
        setTitle(data.title || "段落匹配"); setTopic(data.topic || "综合");
        setParagraphs(data.paragraphs);
        // 规范化题号 — 按数组位置重排 id，确保题号从 1 开始
        setQuestions(data.questions.map((q: MatchQuestion, idx: number) => ({ ...q, id: idx + 1 })));
        setLoading(false); return;
      }
    } catch {}
    const shuffled = [...dQs].sort(() => Math.random() - 0.5).map((q, idx) => ({ ...q, id: idx + 1 }));
    setParagraphs([...dPara].sort(() => Math.random() - 0.5));
    setQuestions(shuffled);
    setLoading(false);
  };

  const [recordIds, setRecordIds] = useState<Record<number, string>>({});

  const submit = () => {
    let c = 0;
    const ids: Record<number, string> = {};
    questions.forEach(q => { if (answers[q.id] === q.answerLabel) c++; });
    setScore(c); setSubmitted(true);
    questions.forEach(q => {
      const rec = saveTrainingRecord({
        module: "matching", title, question: q.text, userAnswer: answers[q.id] || "(未作答)",
        correctAnswer: q.answerLabel, isCorrect: answers[q.id] === q.answerLabel,
        explanation: `定位句: ${q.locateSentence}\n同义替换: ${q.paraphraseNote}`,
      });
      ids[q.id] = rec.id;
    });
    setRecordIds(ids);
  };

  const toggle = (qId: number, label: string) => {
    if (submitted) return;
    setAnswers(p => p[qId] === label ? { ...p, [qId]: "" } : { ...p, [qId]: label });
  };

  const transQFn = async (qId: number) => {
    if (transQ.has(qId)) { setTransQ(p => { const n = new Set(p); n.delete(qId); return n; }); return; }
    setTransQ(p => new Set([...p, qId]));
    const q = questions.find(x => x.id === qId);
    if (!q || q.textZh) return;
    try {
      const r = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: `Translate to Chinese: ${q.text}` }] }) });
      const d = await r.json();
      if (d.reply) setQuestions(p => p.map(x => x.id === qId ? { ...x, textZh: d.reply } : x));
    } catch {}
  };

  const translateAll = async () => {
    if (showPassageZh) { setShowPassageZh(false); return; }
    if (passageZh) { setShowPassageZh(true); return; }
    setTransPassage(true);
    try {
      const txt = paragraphs.map(p => `[${p.label}] ${p.text}`).join("\n\n");
      const r = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: `将以下英文逐段翻译成中文，保留段落标号:\n\n${txt}` }] }) });
      const d = await r.json();
      if (d.reply) { setPassageZh(d.reply); setShowPassageZh(true); }
    } catch {}
    setTransPassage(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">🔗 段落匹配训练</h1><DifficultyPicker value={difficulty} onChange={setDifficulty} />
          <p className="text-sm text-zinc-500 mt-2">主题：{topic} · {paragraphs.length}段 · {questions.length}题</p></div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/english/history?tab=matching")} className="btn-secondary text-xs px-4 py-2"><History className="w-3.5 h-3.5"/>历史</button>
          <button onClick={() => setShowImport(!showImport)} className="btn-secondary text-xs px-4 py-2"><Link2 className="w-3.5 h-3.5"/>导入</button>
        </div>
      </div>
      {showImport && <div className="mb-6"><LinkImporter moduleName="matching" onContentImported={() => { setShowImport(false); loadNew(); }} /></div>}
      <div className="grid lg:grid-cols-[1fr_420px] gap-5">
        <div className="card max-h-[calc(100vh-220px)] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">📄 {title}</h2>
            <button onClick={translateAll} disabled={transPassage} className="text-xs px-2 py-1 rounded border hover:bg-zinc-50 flex items-center gap-1"><Languages className="w-3 h-3"/>{transPassage?"翻译中...":showPassageZh?"显示原文":"翻译全文"}</button>
          </div>
          {paragraphs.map(p => {
            const isSel = selectedLabels.has(p.label);
            const isAns = submitted ? questions.filter(q => q.answerLabel === p.label) : [];
            return (<div key={p.label} id={`p-${p.label}`} className={`scroll-mt-4 p-2 rounded-lg transition-all ${isSel?"bg-red-50 border-2 border-red-400":""} ${submitted&&isAns.length>0?"bg-emerald-50 border border-emerald-200":""}`}>
              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold mr-2 mb-1 ${isSel?"bg-red-500":submitted&&isAns.length>0?"bg-emerald-500":"bg-primary-500"}`}>{p.label}</span>
              <span className="text-sm text-zinc-700">{p.text}</span>
              {submitted&&isAns.map(q=>(<div key={q.id} className="mt-2 ml-9 text-xs bg-emerald-100 text-emerald-700 p-1.5 rounded mb-1"><span className="font-bold">第{q.id}题定位：</span>"{q.locateSentence?.slice(0,100)}..."</div>))}
            </div>);
          })}
          {showPassageZh&&<div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200"><p className="text-xs text-amber-600 font-bold mb-2">📝 中文翻译</p><div className="text-sm text-zinc-600 whitespace-pre-wrap">{passageZh}</div></div>}
        </div>
        <div className="card max-h-[calc(100vh-220px)] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 mb-1"><DiffBadge /></div>
            <h2 className="font-bold text-lg">📋 匹配题（{questions.length}题）</h2>
            <button onClick={loadNew} disabled={loading} className="btn-secondary text-xs px-3 py-2 flex items-center gap-1">{loading?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Shuffle className="w-3.5 h-3.5"/>}换一题</button>
          </div>
          {questions.map((q,qi)=>{
            const ok=submitted&&answers[q.id]===q.answerLabel;
            const bad=submitted&&answers[q.id]&&answers[q.id]!==q.answerLabel;
            const zh=transQ.has(q.id);
            return(<div key={q.id} className={`p-3 rounded-xl border transition-all ${submitted?(ok?"border-emerald-300 bg-emerald-50/50":bad?"border-red-300 bg-red-50/50":"border-zinc-100"):answers[q.id]?"border-primary-200 bg-primary-50/30":"border-zinc-100"}`}>
              <div className="flex items-start gap-2 mb-2">
                <span className="font-bold text-sm text-zinc-500 shrink-0">{qi + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{zh?(q.textZh||q.text):q.text}</p>
                  <div className="flex gap-2 mt-0.5">
                    <button onClick={()=>transQFn(q.id)} className="text-xs text-primary-500 hover:text-primary-700 flex items-center gap-0.5"><Languages className="w-3 h-3"/>{zh?"原文":"翻译"}</button>
                    {submitted&&recordIds[q.id]&&<button onClick={()=>{import("@/lib/use-training-memory").then(x=>x.toggleErrorBook(recordIds[q.id]!));}} className={`text-xs flex items-center gap-0.5 ${bad?"text-red-500 hover:text-red-700":"text-zinc-400 hover:text-primary-600"}`}><BookmarkPlus className="w-3 h-3"/>加入错题本</button>}
                  </div>
                </div>
                {submitted&&(ok?<CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0"/>:bad?<XCircle className="w-4 h-4 text-red-500 shrink-0"/>:null)}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">{pl.map(l=>(<button key={l} disabled={submitted} onClick={()=>toggle(q.id,l)} className={`w-9 h-9 rounded-lg text-xs font-bold border transition-all ${answers[q.id]===l?(submitted?(ok?"border-emerald-500 bg-emerald-500 text-white":"border-red-500 bg-red-500 text-white"):"border-red-400 bg-red-500 text-white shadow-sm"):submitted&&l===q.answerLabel?"border-emerald-500 bg-emerald-100 text-emerald-700":"border-zinc-200 bg-white hover:border-zinc-300 text-zinc-600"}`}>{l}</button>))}</div>
              {submitted&&<div className={`text-xs space-y-1 mt-2 p-2 rounded-lg ${ok?"bg-emerald-50 text-emerald-700":"bg-red-50 text-red-700"}`}><p><span className="font-bold">答案段：</span>{q.answerLabel}</p><p><span className="font-bold">定位句：</span>"{q.locateSentence}"</p><p><span className="font-bold">同义替换：</span>{q.paraphraseNote}</p></div>}
            </div>);
          })}
          {!submitted?<button onClick={submit} disabled={!done} className="btn-primary w-full mt-5 py-3">{done?"提交答案":`已选${Object.keys(answers).length}/${questions.length}`}</button>:
          <div className="mt-5 space-y-3"><div className={`rounded-2xl p-5 text-center ${score===questions.length?"bg-emerald-50 text-emerald-800 border border-emerald-200":score!>=6?"bg-amber-50 text-amber-800 border border-amber-200":"bg-red-50 text-red-800 border border-red-200"}`}><p className="text-3xl font-extrabold">{score}<span className="text-lg font-normal text-zinc-400">/{questions.length}</span></p><p className="text-sm mt-1 font-medium">{score===questions.length?"🎉 全部正确！":score!>=6?"👍 表现不错":"💪 继续努力"}</p></div><button onClick={loadNew} className="btn-secondary w-full py-3"><Shuffle className="w-4 h-4"/>换一题</button></div>}
        </div>
      </div>
      <AiSearchBox moduleName="段落匹配" placeholder="问关于段落匹配技巧、同义替换识别…"/>
    </div>
  );
}
