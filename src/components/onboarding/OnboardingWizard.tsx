"use client";

import { useState } from "react";
import { ArrowRight, BookOpen, ChevronLeft, Compass, Flame, Sparkles, Target } from "lucide-react";
import { getAllCourses, type CourseData } from "@/lib/knowledge-loader";
import { cn } from "@/lib/utils";

interface OnboardingProps {
  onComplete: (selectedCourses: string[]) => void;
}

const STEPS = [
  {
    title: "欢迎来到 LearnOS 🎓",
    subtitle: "AI驱动的主动学习平台",
    description: "告别被动看视频，用费曼学习法 + AI导师 + 智能复习，让你的学习效率提升3倍。",
    icon: Compass,
  },
  {
    title: "选择你的课程 📚",
    subtitle: "从以下课程开始",
    description: "选择你想学习的课程，AI将为你构建个性化的学习路径。",
    icon: BookOpen,
  },
  {
    title: "准备就绪！🚀",
    subtitle: "你的学习之旅即将开始",
    description: "AI导师将在驾驶舱中引导你，从最薄弱的知识点开始逐一攻克。",
    icon: Target,
  },
];

export default function OnboardingWizard({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const courses = getAllCourses();

  const toggleCourse = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const StepIcon = STEPS[step].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all duration-300",
                i === step ? "bg-primary-500 w-8" : i < step ? "bg-primary-300" : "bg-zinc-200"
              )}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-indigo-500/10 p-8 md:p-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center">
              <StepIcon className="w-7 h-7 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">{STEPS[step].title}</h1>
              <p className="text-zinc-500">{STEPS[step].subtitle}</p>
            </div>
          </div>

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="space-y-6">
              <p className="text-zinc-600 leading-relaxed">{STEPS[0].description}</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: BookOpen, label: "费曼训练室", desc: "复述→评分→强化" },
                  { icon: Target, label: "智能诊断", desc: "精准定位知识漏洞" },
                  { icon: Flame, label: "科学复习", desc: "艾宾浩斯遗忘曲线" },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-xl bg-zinc-50 text-center">
                    <item.icon className="w-6 h-6 text-primary-500 mx-auto mb-2" />
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-zinc-500 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Course Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-zinc-600">{STEPS[1].description}</p>
              <div className="grid grid-cols-2 gap-3">
                {courses.map((course) => {
                  const isSelected = selected.has(course.id);
                  return (
                    <button
                      key={course.id}
                      onClick={() => toggleCourse(course.id)}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all",
                        isSelected
                          ? "border-primary-500 bg-primary-50 shadow-sm"
                          : "border-zinc-200 hover:border-zinc-300 bg-white"
                      )}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-white",
                          course.color
                        )}
                      >
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{course.name}</p>
                        <p className="text-xs text-zinc-500">{course.description.slice(0, 30)}...</p>
                      </div>
                      <div
                        className={cn(
                          "ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                          isSelected ? "border-primary-500 bg-primary-500" : "border-zinc-300"
                        )}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Ready */}
          {step === 2 && (
            <div className="space-y-6 text-center py-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <p className="text-zinc-600">{STEPS[2].description}</p>
                {selected.size > 0 && (
                  <p className="text-sm text-primary-600 mt-3 font-medium">
                    已选择 {selected.size} 门课程，共覆盖 {
                      Array.from(selected).reduce((sum, id) => {
                        const c = courses.find((c: CourseData) => c.id === id);
                        return sum + (c?.knowledgeNodes.length ?? 0);
                      }, 0)
                    } 个知识点
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-100">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              className={cn(
                "flex items-center gap-1 px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors",
                step === 0 && "invisible"
              )}
            >
              <ChevronLeft className="w-4 h-4" /> 上一步
            </button>

            {step < 2 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && selected.size === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
              >
                继续 <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onComplete(Array.from(selected))}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-medium shadow-lg shadow-emerald-500/25"
              >
                开始学习 <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
