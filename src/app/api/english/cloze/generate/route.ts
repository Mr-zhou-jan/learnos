import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { level = "cet4", topic = "education" } = await req.json().catch(() => ({}));
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

  if (apiKey) {
    try {
      const prompt = `你是大学英语${level === "cet6" ? "六级" : "四级"}命题专家。请生成一道选词填空（15选10）题目。

主题: ${topic}
要求:
1. 一段 200-280 英文词的短文，留 10 个空，用 ___1___ 到 ___10___ 标记。
2. 提供 15 个候选词（含 5 个干扰项），覆盖名词、动词、形容词、副词。
3. 每空正确答案在候选词中的索引。
4. 中文解析说明每空解题依据（词性判断、上下文线索、固定搭配）。
5. 输出纯 JSON。

格式:
{
  "title": "短文标题",
  "difficulty": "${level}",
  "topic": "中文主题",
  "wordCount": 250,
  "passage": "带 ___1___ 标记的短文",
  "blanks": ["word1", ...共10个正确答案],
  "wordBank": ["candidate1", ...共15个候选词],
  "correctIndices": [3, 7, 0, ...共10个],
  "explanations": ["第1空解析", ...共10条]
}`;

      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 4096,
          response_format: { type: "json_object" },
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const cloze = JSON.parse(data.choices?.[0]?.message?.content || "{}");
        return NextResponse.json(normalizeCloze(cloze, level));
      }
    } catch {}
  }
  return NextResponse.json(fallbackCloze(level));
}

function normalizeCloze(cloze: any, level: string) {
  return {
    id: `cloze-${Date.now()}`,
    title: cloze.title || "选词填空练习",
    difficulty: cloze.difficulty || level,
    topic: cloze.topic || "综合",
    wordCount: cloze.wordCount || 250,
    passage: cloze.passage || "",
    blanks: cloze.blanks || [],
    wordBank: (cloze.wordBank || []).slice(0, 15),
    correctIndices: cloze.correctIndices || [],
    explanations: cloze.explanations || [],
  };
}

function fallbackCloze(level: string) {
  return {
    id: `cloze-fallback-${Date.now()}`,
    title: "时间管理的重要性",
    difficulty: level,
    topic: "学习方法",
    wordCount: 240,
    passage: "Effective time management is a ___1___ skill for college students. Many students find it ___2___ to balance academic work, social activities, and personal life. Research ___3___ that students who plan their weekly schedule in advance tend to ___4___ better grades. However, simply making a plan is not ___5___; students must also develop the ___6___ to follow through. One useful strategy is to break large tasks into ___7___ steps. Another is to set ___8___ deadlines for each assignment. Experts also ___9___ taking regular breaks to maintain focus. Without proper time management, students may feel ___10___ and stressed.",
    blanks: ["crucial", "challenging", "suggests", "achieve", "enough", "discipline", "smaller", "specific", "recommend", "overwhelmed"],
    wordBank: ["crucial", "challenging", "suggests", "achieve", "enough", "discipline", "smaller", "specific", "recommend", "overwhelmed", "rapidly", "decline", "curious", "temporary", "abandon"],
    correctIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    explanations: [
      "第1空：crucial（关键的），形容词修饰名词skill，根据上下文'重要的技能'。",
      "第2空：challenging（有挑战的），find it + adj. 结构，表示'觉得困难'。",
      "第3空：suggests（表明），第三人称单数，研究'表明'。",
      "第4空：achieve（取得），tend to do，取得好成绩。",
      "第5空：enough（足够的），is not enough 固定表达。",
      "第6空：discipline（自律），develop the discipline to do。",
      "第7空：smaller（更小的），比较级，与large形成对比。",
      "第8空：specific（具体的），形容词修饰deadlines。",
      "第9空：recommend（建议），动词，建议做某事。",
      "第10空：overwhelmed（不堪重负的），feel + adj.，感到压力大。",
    ],
  };
}
