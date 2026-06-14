# LearnOS 项目结构

## 目标
LearnOS 是一个 AI 自助学习网站。用户选择学科并上传课程视频链接后，系统提取视频知识点，生成诊断题，评估掌握水平，再给出专属学习计划和学科自适应训练路径。

## 当前架构
- `src/app/page.tsx`：首屏入口，负责学科输入、视频链接提交、知识库构建进度。
- `src/app/api/knowledge/from-video/route.ts`：从视频字幕或课程主题生成知识点。
- `src/app/quiz/page.tsx` 与 `src/app/api/quiz/route.ts`：根据知识点生成诊断测验。
- `src/app/plan/page.tsx` 与 `src/app/api/plan/route.ts`：根据诊断结果生成 7 天学习计划。
- `src/app/(dashboard)/training/page.tsx`：计划后的训练中心。
- `src/lib/engine/learning-methods.ts`：学科分类和学习方法库。
- `src/lib/engine/subject-engines.ts`：更细粒度的学科引擎接口与默认实现。
- `prisma/schema.prisma`：用户、课程、知识点、计划、练习记录、记忆卡片、掌握度等核心模型。

## 产品链路
1. 选择学科。
2. 上传视频链接或仅输入课程名。
3. AI 提取课程知识库。
4. AI 基于知识点生成诊断题。
5. 系统计算薄弱点和掌握度。
6. AI 生成学习计划。
7. 按学科推荐训练法。
8. 学习记录进入复习和掌握度更新。

## 学科训练策略
- 语言类：图片联想、语境填空、阅读理解、造句输出、间隔复习。
- 编程类：最小代码示例、项目驱动、Debug 挑战、代码审查。
- 理论类：费曼复述、图解分析、公式推导、变式练习。
- 财经类：案例分析、AI 追问、场景决策、观点输出。
- 数学类：概念树、阶梯题、证明训练、错因归纳。

## 后续结构建议
- 将 AI 提示词逐步沉淀到 `docs/prompts/`。
- 将训练方法执行逻辑从页面抽到 `src/lib/engine/`。
- 将本地 `localStorage` 状态迁移到 Prisma/Supabase，支持跨设备和长期学习历史。
