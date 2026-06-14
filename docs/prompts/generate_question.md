# 诊断出题 Prompt

## 要求
- 每题必须标注 ability_tags (如 ["LEX","GRAM"])
- 每题必须标注 kb_unit_ids 追溯知识来源
- 解析包含: ①为什么对 ②为什么错 ③知识点链接

## 题型模板
- word_bank: 选词填空 (CET-4)
- reading_long: 长篇阅读匹配 (CET-4/6)
- reading_careful: 仔细阅读选择 (CET-4/6)
- translation: 汉译英 (CET-4/6)
- writing: 议论文 (CET-4/6)
- listening: 听力理解 (二期)

## 输出格式
{
  "questions": [{
    "exam": "cet4|cet6",
    "section": "word_bank|reading_long|...",
    "stem": "题目文本",
    "options": ["A...","B...","C...","D..."],
    "answer_key": 0,
    "rubric": "评分标准",
    "ability_tags": ["LEX","GRAM"],
    "kb_unit_ids": ["unit-id-1"],
    "source_refs": [{"video_id":"...","start_ms":120000}],
    "explanation": "三要素详细解析"
  }]
}
