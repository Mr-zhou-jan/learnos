"use client";
import { useState, useEffect } from "react";
import { Sparkles, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, Lightbulb, MessageSquare } from "lucide-react";
import { getModuleStats, getStubbornVocabWords, getErrorBookRecords, getScoreTarget } from "@/lib/use-training-memory";
import { loadProgress } from "@/lib/vocab-scheduler";
import { computeTrainingPlan } from "@/lib/training-plan";

export default function CoachPage() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const items: any[] = [];
    for (const mod of ["reading","listening","writing","translation","matching","cloze"]) {
      const s = getModuleStats(mod);
      if (s.total >= 5) {
        if (s.recentPct < 50) items.push({ type:"warning", icon:TrendingDown, title:`${mod}需要加强`,content:`最近正确率${s.recentPct}%（${s.correct}/${s.total}），建议增加练习`});
        else if (s.recentPct >= 80) items.push({ type:"success", icon:TrendingUp, title:`${mod}表现优秀`,content:`最近正确率${s.recentPct}%，可挑战更高难度`});
      }
    }
    const c4=loadProgress("cet4"),c6=loadProgress("cet6");
    const ln=(c4.totalLearned||0)+(c6.totalLearned||0),mn=(c4.totalMastered||0)+(c6.totalMastered||0);
    if (ln>0){const p=Math.round(mn/ln*100);if(p<30)items.push({type:"warning",icon:AlertTriangle,title:"词汇掌握率偏低",content:`已学${ln}词仅掌握${mn}词(${p}%)，建议增加每日复习量`})}
    else items.push({type:"suggestion",icon:Lightbulb,title:"开始词汇学习",content:"你还没有开始背诵四六级词汇，每天30个新词约150天可背完四级"});
    const stubborn=getStubbornVocabWords();
    if(stubborn.length>0)items.push({type:"warning",icon:AlertTriangle,title:"顽固单词提醒",content:`${stubborn.length}个词反复答错：${stubborn.slice(0,5).map(s=>s.word).join("、")}`});
    const errors=getErrorBookRecords();
    if(errors.length>10)items.push({type:"suggestion",icon:Lightbulb,title:"错题集待清理",content:`错题集有${errors.length}道题，建议每天复习5-10道`});
    const weak:string[]=[],strong:string[]=[];
    for(const mod of["reading","listening","writing","translation","matching","cloze"]){const s=getModuleStats(mod);if(s.total>=3){if(s.recentPct<50)weak.push(mod);if(s.recentPct>=80)strong.push(mod)}}
    if(weak.length>0)items.push({type:"warning",icon:TrendingDown,title:"薄弱环节",content:`弱项：${weak.join("、")}，优先安排训练`});
    if(strong.length>0)items.push({type:"success",icon:CheckCircle2,title:"优势模块",content:`强项：${strong.join("、")}，保持练习即可`});
    const st=getScoreTarget();
    if(st){const wm=[{l:"听力",v:st.selfAssessment.listening},{l:"阅读",v:st.selfAssessment.reading},{l:"写作翻译",v:st.selfAssessment.writingTranslation}];const wk=wm.filter(m=>m.v<=2);const sk=wm.filter(m=>m.v>=4);const plan=computeTrainingPlan();const est=plan?.estimatedCurrentScore ?? null;const gap=est!==null?st.targetScore-est:st.targetScore;
    const estDisplay = est !== null ? ` ~${est}` : "";
    items.unshift({type:est===null?"suggestion":gap>50?"warning":"success",icon:est===null?Sparkles:gap>50?TrendingDown:TrendingUp,title:est===null?`${st.level==="cet4"?"四级":"六级"}目标 ${st.targetScore} 分 · 尚未开始训练`:`${st.level==="cet4"?"四级":"六级"}目标 ${st.targetScore} 分 · 当前估分${estDisplay}`,content:est===null?`完成诊断题开始训练，系统将基于答题数据动态估分。`:gap>100?`差距 ${gap} 分，短板：${wk.map(m=>m.l).join("、")}。每天优先练习弱项。`:gap>0?`差距 ${gap} 分，加强 ${wk.map(m=>m.l).join("、")} 即可达成。`:`估分已达目标！保持 ${sk.map(m=>m.l).join("、")} 练习节奏。`});}
    if(items.length===0)items.push({type:"suggestion",icon:Sparkles,title:"开始学习之旅",content:"完成训练后AI教练将基于真实数据生成个性化分析"});
    setInsights(items);setLoading(false);
  }, []);

  if (loading) return <div className="p-12 text-center"><div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"/></div>;

  const plan = computeTrainingPlan();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center"><Sparkles className="w-5 h-5 text-primary-600"/></div><div><h1 className="text-2xl font-bold">AI 教练</h1><p className="text-zinc-500 text-sm">基于学习数据的个性化建议</p></div></div>

      {plan && (
        <div className="card border-primary-200 bg-primary-50/40 mb-6">
          <h3 className="font-bold text-primary-700 mb-2">今日训练计划</h3>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-sm font-bold text-primary-600">{plan.estimatedCurrentScore}</p>
              <p className="text-[10px] text-zinc-400">当前估分</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <p className={`text-sm font-bold ${plan.scoreGap > 0 ? "text-red-500" : "text-emerald-500"}`}>{plan.scoreGap > 0 ? `差 ${plan.scoreGap}` : "已达"}</p>
              <p className="text-[10px] text-zinc-400">距目标{plan.targetScore}分</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <p className="text-sm font-bold text-primary-600">~{plan.totalDailyMinutes}min</p>
              <p className="text-[10px] text-zinc-400">每日用时</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {plan.dailyTargets.filter(t=>t.priority==="high").map(t=>(
              <div key={t.module} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-1.5">
                <span className="text-xs font-medium text-red-700">{t.icon} {t.label}（优先）</span>
                <span className="text-xs font-bold text-red-600">{t.dailyCount}{t.unit}/天</span>
              </div>
            ))}
            {plan.dailyTargets.filter(t=>t.priority!=="high").map(t=>(
              <div key={t.module} className="flex items-center justify-between bg-white rounded-lg px-3 py-1.5">
                <span className="text-xs text-zinc-600">{t.icon} {t.label}</span>
                <span className="text-xs font-medium text-zinc-600">{t.dailyCount}{t.unit}/天</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {insights.map((ins,i)=>(<div key={i} className={`card mb-3 border-l-4 ${ins.type==="warning"?"border-l-amber-500":ins.type==="success"?"border-l-emerald-500":"border-l-primary-500"}`}><div className="flex items-center gap-2 mb-1"><ins.icon className={ins.type==="warning"?"w-4 h-4 text-amber-500":ins.type==="success"?"w-4 h-4 text-emerald-500":"w-4 h-4 text-primary-500"}/><h3 className="font-semibold text-sm">{ins.title}</h3></div><p className="text-sm text-zinc-600">{ins.content}</p></div>))}
      <div className="card mt-6 border-dashed border-2 border-zinc-200 bg-transparent text-center py-8"><MessageSquare className="w-8 h-8 text-zinc-300 mx-auto mb-2"/><p className="text-sm text-zinc-500">完成更多学习任务后AI将生成更深度的分析</p></div>
    </div>
  );
}
