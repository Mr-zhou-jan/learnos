# 视频 → 知识单元提取 Prompt

## 输入
带时间戳的 transcript 块

## 输出格式 (严格 JSON)
{
  "units": [{
    "type": "vocab|grammar|concept|discourse",
    "title": "知识点名称",
    "content": {
      "definition": "定义/解释",
      "examples": [{"en": "...", "zh": "..."}],
      "cet_tags": ["cet4|cet6", "reading|listening|writing"],
      "collocations": ["搭配1", "搭配2"]
    },
    "source_refs": [{"start_ms": 120000, "end_ms": 125000}],
    "difficulty": 1-5
  }]
}

## 约束
- 只提取英语四六级相关知识点
- 排除编程、物理、数学等非英语内容
- 无例句的语法点不收录
- 每个 unit 必须有 source_refs
