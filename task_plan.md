# 任务计划：LearnOS MVP

## 目标
构建 LearnOS AI主动学习平台 MVP，核心模块：AI导师 + 知识图谱 + 掌握度 + 学习驾驶舱

## 当前阶段
阶段 1：项目初始化

## 各阶段

### 阶段 1：项目初始化
- [ ] npx create-next-app 创建 Next.js 15 项目
- [ ] 安装依赖 (Tailwind/Shadcn/Prisma/Zustand/React Flow/Recharts)
- [ ] TypeScript strict 配置
- **状态：** in_progress

### 阶段 2：数据库 + 认证
- [ ] Prisma Schema 编写 + 迁移
- [ ] Supabase 配置 (环境变量)
- [ ] 登录/注册页面
- **状态：** pending

### 阶段 3：课程 + 知识图谱
- [ ] 6门课程种子数据
- [ ] 课程列表页 + 详情页
- [ ] React Flow 知识树组件
- **状态：** pending

### 阶段 4：AI导师
- [ ] DeepSeek API 适配器
- [ ] SSE 流式对话
- [ ] 苏格拉底式 Prompt 模板
- [ ] 对话UI组件
- **状态：** pending

### 阶段 5：掌握度系统
- [ ] 评分算法
- [ ] 掌握度API + 面板UI
- **状态：** pending

### 阶段 6：学习驾驶舱 ★
- [ ] 4问聚合数据API
- [ ] 学了什么 / 哪不会 / 为什么不会 / 下一步
- [ ] Recharts 图表
- **状态：** pending

### 阶段 7：费曼训练室 + 复习 + 游戏化
- [ ] 费曼评分API + 复述UI
- [ ] 艾宾浩斯算法 + 每日任务
- [ ] XP/等级系统
- **状态：** pending

## 已做决策
| 决策 | 理由 |
|------|------|
| MVP只接DeepSeek | 用户有DeepSeek API，后续扩展多模型 |
| 本地先跑通再连Supabase | 快速迭代，不受网络影响 |
