
import knowledgeBaseData from "@/data/knowledge_base.json";

export interface KnowledgeNode {
  id: string;
  parentId: string | null;
  title: string;
  description: string;
  orderIndex: number;
  children?: KnowledgeNode[];
}

export interface CourseData {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  knowledgeNodes: KnowledgeNode[];
}

export interface KnowledgeBase {
  courses: CourseData[];
  totalNodes: number;
}

// ============================================================
// 运行时知识库（支持动态添加课程）
// ============================================================

let runtimeCourses: CourseData[] = [];

function getBaseKnowledge(): KnowledgeBase {
  return knowledgeBaseData as unknown as KnowledgeBase;
}

/** 获取所有课程（基础 + 运行时） */
export function getAllCourses(): CourseData[] {
  const base = getBaseKnowledge();
  const baseIds = new Set(base.courses.map((c) => c.id));
  const runtime = runtimeCourses.filter((c) => !baseIds.has(c.id));
  return [...base.courses, ...runtime];
}

/** 按 ID 获取课程 */
export function getCourseById(id: string): CourseData | undefined {
  const course = getAllCourses().find((c) => c.id === id);
  if (course) return course;
  
  // For custom courses not in pre-built knowledge base, create a placeholder
  if (id.startsWith("custom-")) {
    return {
      id,
      name: id,
      description: "自定义课程",
      icon: "BookOpen",
      color: "bg-blue-500",
      knowledgeNodes: [{
        id: `${id}-root`,
        parentId: null,
        title: "开始学习",
        description: "AI将为你构建知识体系",
        orderIndex: 0,
      }],
    };
  }
  return undefined;
}

/** 动态添加课程 */
export function addCourse(course: CourseData): void {
  const existing = runtimeCourses.findIndex((c) => c.id === course.id);
  if (existing >= 0) {
    runtimeCourses[existing] = course;
  } else {
    runtimeCourses.push(course);
  }
}

/** 获取知识树 */
export function getKnowledgeTree(courseId: string): KnowledgeNode[] {
  const course = getCourseById(courseId);
  if (!course) return [];

  const nodes = course.knowledgeNodes;
  const nodeMap = new Map<string, KnowledgeNode>();
  const roots: KnowledgeNode[] = [];

  nodes.forEach((n) => {
    nodeMap.set(n.id, { ...n, children: [] });
  });

  nodeMap.forEach((node) => {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortFn = (a: KnowledgeNode, b: KnowledgeNode) => a.orderIndex - b.orderIndex;
  roots.sort(sortFn);
  nodeMap.forEach((n) => {
    if (n.children) n.children.sort(sortFn);
  });

  return roots;
}

/** 获取所有叶子节点 */
export function getAllLeafNodes(courseId: string): KnowledgeNode[] {
  const tree = getKnowledgeTree(courseId);
  const leaves: KnowledgeNode[] = [];

  function collect(nodes: KnowledgeNode[]) {
    for (const n of nodes) {
      if (!n.children || n.children.length === 0) {
        leaves.push(n);
      } else {
        collect(n.children);
      }
    }
  }
  collect(tree);
  return leaves;
}

/** 获取课程知识点总数 */
export function getNodeCount(courseId: string): number {
  const course = getCourseById(courseId);
  // For custom courses, return a default count
  if (!course) return 15;
  return course.knowledgeNodes.length;
}

/** 清除运行时课程 */
export function clearRuntimeCourses(): void {
  runtimeCourses = [];
}

/** 通过名称搜索知识点 */
export function searchNodes(query: string): { courseId: string; courseName: string; node: KnowledgeNode }[] {
  const results: { courseId: string; courseName: string; node: KnowledgeNode }[] = [];
  const lower = query.toLowerCase();
  
  for (const course of getAllCourses()) {
    for (const node of course.knowledgeNodes) {
      if (
        node.title.toLowerCase().includes(lower) ||
        node.description.toLowerCase().includes(lower)
      ) {
        results.push({ courseId: course.id, courseName: course.name, node });
      }
    }
  }
  
  return results.slice(0, 20);
}
