/**
 * LearnOS 种子数据 — 6门课程 + 知识树节点
 * 运行: npm run db:seed
 */

const COURSES = [
  { id: "course-en", name: "英语", description: "CET-4/6词汇、语法、阅读、写作", icon: "Globe", color: "#3b82f6" },
  { id: "course-cpp", name: "C++", description: "面向对象、指针、STL、内存管理", icon: "Cpu", color: "#8b5cf6" },
  { id: "course-physics", name: "大学物理", description: "力学、热学、电磁学、光学", icon: "BookOpen", color: "#6366f1" },
  { id: "course-mechanics", name: "工程力学", description: "静力学、材料力学、结构力学", icon: "Hammer", color: "#f97316" },
  { id: "course-measure", name: "互换性与测量技术", description: "公差配合、测量技术基础", icon: "Ruler", color: "#14b8a6" },
  { id: "course-finance", name: "金融投资", description: "投资基础、风险管理、资产配置", icon: "TrendingUp", color: "#10b981" },
];

const PHYSICS_NODES = [
  { id: "phy-root", courseId: "course-physics", parentId: null, title: "大学物理", orderIndex: 0 },
  { id: "phy-mechanics", courseId: "course-physics", parentId: "phy-root", title: "力学", orderIndex: 1 },
  { id: "phy-thermo", courseId: "course-physics", parentId: "phy-root", title: "热学", orderIndex: 2 },
  { id: "phy-em", courseId: "course-physics", parentId: "phy-root", title: "电磁学", orderIndex: 3 },
  { id: "phy-newton", courseId: "course-physics", parentId: "phy-mechanics", title: "牛顿运动定律", orderIndex: 10 },
  { id: "phy-momentum", courseId: "course-physics", parentId: "phy-mechanics", title: "动量与动量守恒", orderIndex: 11 },
  { id: "phy-energy", courseId: "course-physics", parentId: "phy-mechanics", title: "功与能", orderIndex: 12 },
  { id: "phy-circle", courseId: "course-physics", parentId: "phy-mechanics", title: "圆周运动", orderIndex: 13 },
  { id: "phy-gravity", courseId: "course-physics", parentId: "phy-mechanics", title: "万有引力", orderIndex: 14 },
];

const CPP_NODES = [
  { id: "cpp-root", courseId: "course-cpp", parentId: null, title: "C++", orderIndex: 0 },
  { id: "cpp-oop", courseId: "course-cpp", parentId: "cpp-root", title: "面向对象", orderIndex: 1 },
  { id: "cpp-pointer", courseId: "course-cpp", parentId: "cpp-root", title: "指针与引用", orderIndex: 2 },
  { id: "cpp-stl", courseId: "course-cpp", parentId: "cpp-root", title: "STL标准库", orderIndex: 3 },
  { id: "cpp-memory", courseId: "course-cpp", parentId: "cpp-root", title: "内存管理", orderIndex: 4 },
];

const EN_NODES = [
  { id: "en-root", courseId: "course-en", parentId: null, title: "英语", orderIndex: 0 },
  { id: "en-vocab", courseId: "course-en", parentId: "en-root", title: "词汇", orderIndex: 1 },
  { id: "en-grammar", courseId: "course-en", parentId: "en-root", title: "语法", orderIndex: 2 },
  { id: "en-cet4", courseId: "course-en", parentId: "en-vocab", title: "CET-4词汇", orderIndex: 10 },
  { id: "en-cet6", courseId: "course-en", parentId: "en-vocab", title: "CET-6词汇", orderIndex: 11 },
  { id: "en-tense", courseId: "course-en", parentId: "en-grammar", title: "时态", orderIndex: 20 },
  { id: "en-clause", courseId: "course-en", parentId: "en-grammar", title: "从句", orderIndex: 21 },
];

const ALL_NODES = [...PHYSICS_NODES, ...CPP_NODES, ...EN_NODES];

console.log(`种子数据: ${COURSES.length}门课程, ${ALL_NODES.length}个知识点`);
console.log("使用Prisma客户端插入到Supabase，或参考此文件手动导入");
