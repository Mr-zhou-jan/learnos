"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, Clock, GraduationCap, Target, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllCourses, getKnowledgeTree, getNodeCount, type KnowledgeNode } from "@/lib/knowledge-loader";

const MODES = [
  { id: "chapter", label: "章节测试", desc: "针对单个知识点快速检测", icon: Target, color: "text-blue-600 bg-blue-50" },
  { id: "course", label: "课程测试", desc: "覆盖整门课程的综合检测", icon: BookOpen, color: "text-purple-600 bg-purple-50" },
  { id: "mock", label: "模拟考试", desc: "模拟真实考试环境限时作答", icon: Clock, color: "text-amber-600 bg-amber-50" },
  { id: "final", label: "期末冲刺", desc: "AI根据薄弱点智能出卷", icon: GraduationCap, color: "text-red-600 bg-red-50" },
];

export default function ExamPage() {
  const router = useRouter();
  const [mode, setMode] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const courses = getAllCourses();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">考试中心</h1>
      <p className="text-zinc-500 mb-6">选择考试模式和课程，AI将自动生成针对性试卷</p>

      {/* Mode Selection */}
      <h2 className="font-semibold mb-3 flex items-center gap-2">
        <Target className="w-5 h-5 text-primary-500" /> 考试模式
      </h2>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              "card-hover flex items-center gap-4 text-left w-full",
              mode === m.id && "ring-2 ring-primary-500 shadow-md"
            )}
          >
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", m.color)}>
              <m.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">{m.label}</h3>
              <p className="text-sm text-zinc-500">{m.desc}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-300 ml-auto shrink-0" />
          </button>
        ))}
      </div>

      {/* Course Selection (appears after mode selected) */}
      {mode && (
        <>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-500" /> 选择课程
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {courses.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCourse(c.id)}
                className={cn(
                  "card-hover flex items-center gap-3 text-left w-full",
                  selectedCourse === c.id && "ring-2 ring-primary-500 shadow-md"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0",
                    c.color
                  )}
                >
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-xs text-zinc-500">{getNodeCount(c.id)} 个知识点</p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-300 ml-auto shrink-0" />
              </button>
            ))}
          </div>

          {/* Start exam button */}
          {selectedCourse && (
            <div className="card text-center py-8 border-primary-200 bg-primary-50/50">
              <Sparkles className="w-12 h-12 text-primary-400 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">AI正在为你准备试卷...</h3>
              <p className="text-sm text-zinc-500 mb-6">
                基于 {courses.find((c) => c.id === selectedCourse)?.name} 的 {getNodeCount(selectedCourse)} 个知识点，
                AI将生成{ mode === "chapter" ? "单知识点" : mode === "course" ? "课程综合" : mode === "mock" ? "限时模拟" : "薄弱点专项"}试卷
              </p>
              <button
                onClick={() => {
                  router.push(`/feynman?courseId=${selectedCourse}`);
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
              >
                <Sparkles className="w-4 h-4" /> 开始考试 <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-xs text-zinc-400 mt-3">
                提示：目前推荐从费曼训练室开始，牢固掌握每个知识点后再来考试
              </p>
            </div>
          )}
        </>
      )}

      {!mode && (
        <div className="card text-center py-12">
          <GraduationCap className="w-16 h-16 text-primary-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">选择考试模式开始</h3>
          <p className="text-sm text-zinc-500">
            支持章节测试、课程测试、模拟考试和AI智能出卷
          </p>
        </div>
      )}
    </div>
  );
}
