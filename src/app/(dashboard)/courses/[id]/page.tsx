"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, ChevronRight, GraduationCap, PenLine, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCourseById, getKnowledgeTree, type KnowledgeNode } from "@/lib/knowledge-loader";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const course = getCourseById(courseId);

  if (!course) {
    return (
      <div className="p-12 text-center">
        <p className="text-zinc-500">课程未找到</p>
        <button onClick={() => router.push("/courses")} className="text-primary-600 mt-2">返回课程列表</button>
      </div>
    );
  }

  const tree = getKnowledgeTree(courseId);

  function NodeItem({ node, depth = 0 }: { node: KnowledgeNode; depth?: number }) {
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div className={cn("ml-0", depth > 0 && "ml-6")}>
        <div className="flex items-center gap-2 py-2 group">
          <div
            className={cn(
              "w-2 h-2 rounded-full shrink-0",
              hasChildren ? "bg-primary-400" : "bg-zinc-300"
            )}
          />
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm", hasChildren ? "font-semibold text-zinc-800" : "text-zinc-600")}>
              {node.title}
            </p>
            {node.description && (
              <p className="text-xs text-zinc-400 truncate">{node.description}</p>
            )}
          </div>
          {!hasChildren && (
            <button
              onClick={() =>
                router.push(`/feynman?nodeId=${node.id}&courseId=${courseId}&title=${encodeURIComponent(node.title)}`)
              }
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs bg-primary-500 text-white rounded-lg hover:bg-primary-600 opacity-0 group-hover:opacity-100 transition-all"
            >
              <PenLine className="w-3 h-3" /> 开始学习
            </button>
          )}
          {hasChildren && (
            <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-primary-400" />
          )}
        </div>

        {hasChildren &&
          node.children!.map((child) => <NodeItem key={child.id} node={child} depth={depth + 1} />)
        }
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.push("/courses")}
        className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> 返回课程列表
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", course.color)}>
          <BookOpen className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{course.name}</h1>
          <p className="text-zinc-500">{course.description}</p>
        </div>
        <button
          onClick={() => router.push(`/feynman?courseId=${courseId}`)}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors text-sm font-medium"
        >
          <Sparkles className="w-4 h-4" /> 进入训练室
        </button>
      </div>

      {/* Knowledge tree */}
      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary-500" /> 知识树
        </h2>
        <div className="space-y-1">
          {tree.map((node) => (
            <NodeItem key={node.id} node={node} />
          ))}
        </div>
      </div>
    </div>
  );
}
