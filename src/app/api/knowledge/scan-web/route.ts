import { NextRequest, NextResponse } from "next/server";
import { addCourse, getAllCourses } from "@/lib/knowledge-loader";
import type { KnowledgeNode, CourseData } from "@/lib/knowledge-loader";

/**
 * POST: Hermes 通过全网搜索收集知识后，调用此 API 写入知识库
 * 
 * 工作流：
 *   1. Hermes 全网搜索某个学科的知识结构
 *   2. 整理成 CourseData 格式
 *   3. POST 到此 API 写入运行时知识库
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { course, nodes, sourceMeta } = body;

    if (!course || !nodes || !Array.isArray(nodes)) {
      return NextResponse.json(
        { error: "缺少必要参数: course, nodes[]" },
        { status: 400 }
      );
    }

    const courseData: CourseData = {
      id: course.id || `web-${Date.now()}`,
      name: course.name,
      description: course.description || `来源: ${sourceMeta?.searchQuery || "全网搜索"}`,
      icon: course.icon || "Search",
      color: course.color || "bg-violet-500",
      knowledgeNodes: nodes.map((n: any, i: number) => ({
        id: n.id || `web-node-${Date.now()}-${i}`,
        parentId: n.parentId || null,
        title: n.title,
        description: n.description || "",
        orderIndex: n.orderIndex ?? i,
      })),
    };

    addCourse(courseData);

    return NextResponse.json({
      success: true,
      course: courseData,
      nodeCount: nodes.length,
      source: "web-search",
    });
  } catch (error) {
    console.error("[API] 知识写入失败:", error);
    return NextResponse.json(
      { error: "写入失败", detail: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET: 列出所有课程（含运行时添加的）
 */
export async function GET() {
  const courses = getAllCourses();
  return NextResponse.json({
    totalCourses: courses.length,
    totalNodes: courses.reduce((sum, c) => sum + c.knowledgeNodes.length, 0),
    courses: courses.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      nodeCount: c.knowledgeNodes.length,
      icon: c.icon,
      color: c.color,
    })),
  });
}
