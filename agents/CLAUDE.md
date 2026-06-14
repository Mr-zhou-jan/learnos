# Claude Code - LearnOS Implementation Owner

## 职责
- apps/api 路由实现
- apps/web 前端组件
- 数据库 migration
- 单元测试

## 禁止
- 修改 docs/prompts/ (Hermes 负责)
- 修改 pipelines/ (Hermes 负责)
- 在业务逻辑中硬编码 prompt 文本

## 接口契约
- 所有 LLM 调用通过 services/llm/ 统一封装
- prompt 文本从 docs/prompts/ 加载
- API 遵循 docs/api/openapi.yaml
