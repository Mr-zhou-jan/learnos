import { NextRequest, NextResponse } from "next/server";

const prompts = {
  writing: "Directions: For this part, you are allowed 30 minutes to write an essay on the importance of developing digital learning habits. You should write at least 120 words but no more than 180 words.",
  translation: "请将下面这段中文翻译成英文：近年来，越来越多的大学生开始使用人工智能工具辅助学习。合理使用这些工具不仅可以提高学习效率，还能帮助学生发现自己的薄弱环节。然而，学生仍然需要保持独立思考，不能完全依赖技术。",
};

export async function POST(req: NextRequest) {
  const { type = "writing", action = "generate", answer = "" } = await req.json().catch(() => ({}));
  if (action === "generate") {
    return NextResponse.json({
      prompt: prompts[type as keyof typeof prompts] || prompts.writing,
      outline: type === "translation"
        ? ["切分中文意群", "确定关键词表达", "合并短句并检查时态", "润色连接词"]
        : ["开头点题", "主体段给出两点理由", "举例说明", "结尾总结并提出建议"],
    });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
  if (apiKey) {
    try {
      const prompt = `你是大学英语四级阅卷老师。请评价学生的${type === "translation" ? "翻译" : "作文"}。

题目:
${prompts[type as keyof typeof prompts] || prompts.writing}

学生答案:
${answer}

请输出 JSON:
{"score": 0-100, "logicIssues": ["逻辑问题"], "languageIssues": ["语言问题"], "gapToFullMark": "与满分答案差距", "strengths": ["优点"], "improvedVersion": "改写后的高分答案"}`;
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], temperature: 0.4, max_tokens: 2048, response_format: { type: "json_object" } }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return NextResponse.json(JSON.parse(data.choices?.[0]?.message?.content || "{}"));
      }
    } catch {}
  }

  return NextResponse.json({
    score: Math.min(88, Math.max(45, answer.length)),
    logicIssues: ["论点之间需要更明确的递进关系"],
    languageIssues: ["注意冠词、单复数和连接词使用"],
    gapToFullMark: "满分答案通常观点更集中，例子更具体，句式变化更自然。",
    strengths: ["已经完成基本表达", "主题没有偏离"],
    improvedVersion: "A high-scoring answer should present a clear position, develop reasons logically, and use accurate expressions with natural transitions.",
  });
}
