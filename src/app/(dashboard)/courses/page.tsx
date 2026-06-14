"use client";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Cpu, Globe, Hammer, Ruler, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAllCourses, getNodeCount } from "@/lib/knowledge-loader";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe, Cpu, BookOpen, Hammer, Ruler, TrendingUp,
};

export default function CoursesPage() {
  const router = useRouter();
  const courses = getAllCourses();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">我的课程</h1>
        <p className="text-zinc-500 mt-1">
          共 {courses.length} 门课程，涵盖 {courses.reduce((s, c) => s + getNodeCount(c.id), 0)} 个知识点
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((c) => {
          const IconComp = ICON_MAP[c.icon] || BookOpen;
          const nodeCount = getNodeCount(c.id);
          return (
            <button
              key={c.id}
              onClick={() => router.push(`/courses/${c.id}`)}
              className="card-hover flex items-center gap-4 group text-left w-full"
            >
              <div
                className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center shrink-0",
                  c.color
                )}
              >
                <IconComp className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold group-hover:text-primary-600 transition-colors">
                  {c.name}
                </h3>
                <p className="text-sm text-zinc-500 truncate">{c.description}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs px-2 py-0.5 bg-zinc-100 rounded-full text-zinc-600">
                    {nodeCount} 个知识点
                  </span>
                  <span className="text-xs text-zinc-400">
                    点击开始学习
                  </span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-primary-500 shrink-0 transition-colors" />
            </button>
          );
        })}
      </div>

      {/* Quick start hint */}
      <div className="mt-8 p-6 bg-gradient-to-r from-primary-50 to-indigo-50 rounded-2xl border border-primary-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold">不知道怎么开始？</h3>
        </div>
        <p className="text-sm text-zinc-600 mb-4">
          选择一门课程，从任意知识点进入<strong>费曼训练室</strong>：AI先讲解概念，你用自己的话复述，AI评分并指出漏洞，然后反复强化直到掌握！
        </p>
        <button
          onClick={() => router.push("/feynman")}
          className="text-sm px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          去费曼训练室 →
        </button>
      </div>
    </div>
  );
}
