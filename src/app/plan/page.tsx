"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Brain, Calendar, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

function PlanContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const name = sp.get("name")||"课程";
  const video = sp.get("video")||"";
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState(0);

  useEffect(() => {
    const qr = localStorage.getItem("learnos_quiz_results");
    if (!qr){router.push("/");return;}
    fetch("/api/plan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({quizResults:JSON.parse(qr),courseName:name,videoUrl:video||null,dailyTime:30})})
      .then(r=>r.json()).then(d=>{localStorage.setItem("learnos_current_plan", JSON.stringify({ ...d, courseName: name }));setPlan(d);setLoading(false);}).catch(()=>setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500"/></div>;
  if (!plan) return <div className="min-h-screen flex items-center justify-center"><p className="text-zinc-500">生成失败</p></div>;

  const today = plan.weeklyPlan?.[day];
  const icons: Record<string,string> = {"vocab-drill":"📝","grammar-drill":"📋","reading-visual":"🖼️","code-build":"💻","debug-challenge":"🐞","feynman-plus":"🗣️","diagram-analysis":"📐","case-feynman":"💼","scenario-sim":"📈","active-recall":"🧠","compress":"📦","review":"🔄","quiz":"✏️"};

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="bg-gradient-to-br from-primary-500 to-indigo-600 text-white p-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-primary-100 text-sm mb-1">{video?"🎬 视频提取":"🔍 知识库"} · {name}</p>
          <h1 className="text-3xl font-bold mb-1">专属学习计划</h1>
          <p className="text-primary-100/90 text-sm">{plan.summary}</p>
          <div className="flex gap-3 mt-5">
            <button onClick={()=>router.push("/cockpit")} className="px-4 py-2 bg-white/20 rounded-xl hover:bg-white/30 text-sm font-medium transition-colors">驾驶舱 <ArrowRight className="w-3.5 h-3.5 inline"/></button>
            <button onClick={()=>router.push("/training")} className="px-4 py-2 bg-white/15 rounded-xl hover:bg-white/25 text-sm font-medium transition-colors">开始训练 <Sparkles className="w-3.5 h-3.5 inline"/></button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6">
        {plan.focusAreas?.length>0 && (
          <div className="flex flex-wrap gap-2 mb-6"><span className="text-sm text-zinc-500">🎯 重点攻克:</span>
            {plan.focusAreas.map((f:string,i:number)=><span key={i} className="badge badge-danger">{f}</span>)}
          </div>
        )}

        {plan.recommendedMethods?.length>0 && (
          <div className="grid md:grid-cols-3 gap-3 mb-6">
            {plan.recommendedMethods.slice(0,3).map((m:any)=>
              <div key={m.id} className="card">
                <div className="text-lg mb-2">{icons[m.id]||"📚"}</div>
                <h3 className="font-semibold text-sm">{m.name}</h3>
                <p className="text-xs text-zinc-500 mt-1">{m.reason}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {plan.weeklyPlan?.map((d:any,i:number)=>(
            <button key={i} onClick={()=>setDay(i)}
              className={cn("shrink-0 px-5 py-3 rounded-xl text-center transition-all border-2 min-w-[72px]",
                i===day?"border-primary-500 bg-primary-50 text-primary-700 shadow-sm":"border-zinc-100 bg-white text-zinc-500 hover:border-zinc-200")}>
              <div className="text-xs font-semibold opacity-50">Day</div>
              <div className="text-lg font-bold">{d.day}</div>
              <div className="text-[10px] mt-0.5 truncate max-w-[64px]">{d.focus?.slice(0,6)}</div>
            </button>
          ))}
        </div>

        {today && (
          <div className="animate-fade-up" key={day}>
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-primary-500"/>
              <div><h2 className="font-bold text-lg">Day {today.day}</h2><p className="text-sm text-zinc-500">{today.focus}</p></div>
            </div>
            <div className="space-y-3">
              {today.tasks?.map((t:any,i:number)=>(
                <div key={i} className="card flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-lg shrink-0">{icons[t.method]||"📚"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><h3 className="font-semibold text-sm">{t.title}</h3><span className="text-xs text-zinc-400">{t.durationMin}min</span></div>
                    <p className="text-xs text-zinc-500 mt-0.5">{t.description}</p>
                  </div>
                  <button onClick={()=>{const m=t.method; if(m.includes("feynman")||m.includes("case")) router.push("/feynman"); else if(m.includes("code")) router.push("/training"); else router.push("/training");}} className="btn-primary text-xs px-3 py-1.5 shrink-0">开始</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {plan.tips?.length>0 && (
          <div className="mt-8 card border-amber-100 bg-amber-50/50">
            <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2"><Brain className="w-4 h-4"/>学习建议</h3>
            <ul className="space-y-1.5">{plan.tips.map((t:string,i:number)=><li key={i} className="text-sm text-amber-700 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-amber-500"/>{t}</li>)}</ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default ()=> <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin"/></div>}><PlanContent/></Suspense>;
