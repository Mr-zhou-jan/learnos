"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Headphones, BookOpen, PenLine, Languages, Target, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { userKey } from "@/lib/user-store";

interface ScoreTarget {
  level: "cet4" | "cet6";
  targetScore: number;
  selfAssessment: {
    listening: number;
    reading: number;
    writingTranslation: number;
  };
  createdAt: string;
}

function getStorageKey() { return userKey("learnos_score_target"); }

function loadExisting(): ScoreTarget | null {
  try { const raw = localStorage.getItem(getStorageKey()); if (raw) return JSON.parse(raw); } catch {}
  return null;
}

function save(data: ScoreTarget) {
  localStorage.setItem(getStorageKey(), JSON.stringify(data));
}

const LEVEL_INFO: Record<string, { name: string; full: string; total: number; desc: string }> = {
  cet4: { name: "CET-4", full: "大学英语四级", total: 4500, desc: "词汇量约4500 · 总分710 · 425分及格" },
  cet6: { name: "CET-6", full: "大学英语六级", total: 2000, desc: "词汇量约2000（增量） · 总分710 · 425分及格" },
};

const MODULES = [
  { key: "listening", label: "听力模块", icon: Headphones, desc: "短篇新闻 · 长对话 · 短文理解", color: "blue" },
  { key: "reading", label: "阅读模块", icon: BookOpen, desc: "选词填空 · 段落匹配 · 仔细阅读", color: "emerald" },
  { key: "writingTranslation", label: "写作翻译", icon: PenLine, desc: "议论文/书信/图表 · 汉译英", color: "purple" },
];

const LEVEL_LABELS: Record<number, string> = { 1: "很弱", 2: "较弱", 3: "中等", 4: "较强", 5: "很强" };

export default function ScoreTargetPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<"cet4" | "cet6">("cet4");
  const [targetScore, setTargetScore] = useState(500);
  const [listening, setListening] = useState(3);
  const [reading, setReading] = useState(3);
  const [writing, setWriting] = useState(3);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const ex = loadExisting();
    if (ex) {
      setLevel(ex.level);
      setTargetScore(ex.targetScore);
      setListening(ex.selfAssessment.listening);
      setReading(ex.selfAssessment.reading);
      setWriting(ex.selfAssessment.writingTranslation);
    }
  }, []);

  const handleSave = () => {
    save({
      level, targetScore,
      selfAssessment: { listening, reading, writingTranslation: writing },
      createdAt: new Date().toISOString(),
    });
    setSaved(true);
    setTimeout(() => router.push("/cockpit"), 1200);
  };

  const scoreLabel = (score: number) => {
    if (score < 425) return { text: "未及格", color: "text-red-500" };
    if (score < 500) return { text: "及格", color: "text-amber-500" };
    if (score < 550) return { text: "中等", color: "text-amber-600" };
    if (score < 600) return { text: "良好", color: "text-emerald-500" };
    return { text: "优秀", color: "text-emerald-600" };
  };

  if (saved) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center animate-bounce-in">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">目标已保存！</h2>
          <p className="text-zinc-500">正在跳转到驾驶舱...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-zinc-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">🎯 分数目标</h1>
          <p className="text-sm text-zinc-500">设定目标分数与强弱项，让 AI 为你定制学习路径</p>
        </div>
      </div>

      {/* 步骤指示器 */}
      <div className="flex items-center gap-2 mb-8">
        {["选择级别", "目标分数", "强弱自评", "确认"].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
              step === i ? "bg-primary-500 text-white scale-110" :
              step > i ? "bg-emerald-500 text-white" : "bg-zinc-200 text-zinc-500"
            )}>
              {step > i ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={cn("text-xs font-medium hidden sm:inline", step >= i ? "text-zinc-900" : "text-zinc-400")}>
              {label}
            </span>
            {i < 3 && <ChevronRight className="w-3 h-3 text-zinc-300 hidden sm:block" />}
          </div>
        ))}
      </div>

      {/* 步骤内容 */}
      {step === 0 && (
        <div className="space-y-4 animate-slide-up">
          <h2 className="text-lg font-bold mb-4">选择考试级别</h2>
          {Object.entries(LEVEL_INFO).map(([key, info]) => (
            <button key={key} onClick={() => { setLevel(key as "cet4" | "cet6"); setStep(1); }}
              className={cn("card-hover w-full text-left p-5 border-2 transition-all rounded-xl",
                level === key ? "border-primary-500 bg-primary-50/50" : "border-zinc-200")}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{info.name}</h3>
                  <p className="text-sm text-zinc-500">{info.full}</p>
                  <p className="text-xs text-zinc-400 mt-1">{info.desc}</p>
                </div>
                <Target className={cn("w-8 h-8", level === key ? "text-primary-500" : "text-zinc-300")} />
              </div>
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6 animate-slide-up">
          <div className="text-center">
            <h2 className="text-lg font-bold mb-1">{LEVEL_INFO[level].name} · 目标分数</h2>
            <p className="text-sm text-zinc-500">拖动滑块设定你想要达到的分数</p>
          </div>
          <div className="text-center">
            <span className={cn("text-6xl font-extrabold", scoreLabel(targetScore).color)}>{targetScore}</span>
            <span className="text-zinc-300 text-xl ml-2">/710</span>
            <p className={cn("text-sm mt-1 font-medium", scoreLabel(targetScore).color)}>
              {scoreLabel(targetScore).text}
            </p>
          </div>
          <div className="px-4">
            <input type="range" min={220} max={710} step={10} value={targetScore}
              onChange={e => setTargetScore(Number(e.target.value))}
              className="w-full h-2 rounded-full bg-zinc-200 appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:shadow-lg" />
            <div className="flex justify-between text-xs text-zinc-400 mt-2">
              <span>220</span>
              <span className="text-amber-500 font-medium">425</span>
              <span>500</span>
              <span className="text-emerald-500 font-medium">600</span>
              <span>710</span>
            </div>
          </div>
          <div className="flex gap-2 justify-center">
            {[425, 500, 550, 600].map(s => (
              <button key={s} onClick={() => setTargetScore(s)}
                className={cn("px-3 py-1 rounded-full text-xs border transition-all",
                  targetScore === s ? "border-primary-500 bg-primary-50 text-primary-700" : "border-zinc-200 text-zinc-500 hover:border-zinc-300")}>
                {s}分
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-slide-up">
          <div className="text-center">
            <h2 className="text-lg font-bold mb-1">自评各模块强弱</h2>
            <p className="text-sm text-zinc-500">根据你的实际情况评估每个模块的掌握程度</p>
          </div>
          {MODULES.map(mod => {
            const Icon = mod.icon;
            const val = mod.key === "listening" ? listening : mod.key === "reading" ? reading : writing;
            const setter = mod.key === "listening" ? setListening : mod.key === "reading" ? setReading : setWriting;
            const colorMap: Record<string, string> = { blue: "bg-blue-100 text-blue-600 border-blue-200", emerald: "bg-emerald-100 text-emerald-600 border-emerald-200", purple: "bg-purple-100 text-purple-600 border-purple-200" };
            return (
              <div key={mod.key} className="card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", colorMap[mod.color] || "")}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">{mod.label}</h3>
                    <p className="text-xs text-zinc-400">{mod.desc}</p>
                  </div>
                  <span className={cn("ml-auto text-lg font-bold",
                    val <= 2 ? "text-red-500" : val <= 3 ? "text-amber-500" : "text-emerald-500")}>
                    {LEVEL_LABELS[val]}
                  </span>
                </div>
                <input type="range" min={1} max={5} step={1} value={val}
                  onChange={e => setter(Number(e.target.value))}
                  className="w-full h-2 rounded-full bg-zinc-200 appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:shadow" />
                <div className="flex justify-between text-xs text-zinc-400 mt-1.5">
                  <span>很弱</span><span>较弱</span><span>中等</span><span>较强</span><span>很强</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5 animate-slide-up">
          <div className="text-center">
            <h2 className="text-lg font-bold mb-1">确认你的目标</h2>
            <p className="text-sm text-zinc-500">AI 将根据以下设定定制你的学习路径</p>
          </div>
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">考试级别</span>
              <span className="font-bold">{LEVEL_INFO[level].name} · {LEVEL_INFO[level].full}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">目标分数</span>
              <span className={cn("text-xl font-extrabold", scoreLabel(targetScore).color)}>{targetScore}/710</span>
            </div>
            <hr className="border-zinc-100" />
            <p className="text-sm font-medium text-zinc-600 mb-2">各模块自评</p>
            {[
              { label: "听力模块", val: listening, color: "bg-blue-500" },
              { label: "阅读模块", val: reading, color: "bg-emerald-500" },
              { label: "写作翻译", val: writing, color: "bg-purple-500" },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between">
                <span className="text-sm">{m.label}</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className={cn("w-3 h-3 rounded-full", i <= m.val ? m.color : "bg-zinc-200")} />
                    ))}
                  </div>
                  <span className="text-xs font-medium">{LEVEL_LABELS[m.val]}</span>
                </div>
              </div>
            ))}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              弱项模块将获得更多练习推荐，AI 教练会重点分析你的薄弱环节
            </div>
          </div>
          <button onClick={handleSave} className="btn-primary w-full flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> 保存目标
          </button>
        </div>
      )}

      {/* 底部导航按钮 */}
      <div className="flex justify-between mt-8">
        <button onClick={() => setStep(Math.max(0, step - 1))}
          className={cn("btn-secondary text-sm", step === 0 && "invisible")}>
          <ArrowLeft className="w-4 h-4" /> 上一步
        </button>
        {step < 3 && (
          <button onClick={() => setStep(step + 1)} className="btn-primary text-sm">
            下一步 <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
