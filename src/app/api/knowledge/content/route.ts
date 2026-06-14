import { NextRequest, NextResponse } from "next/server";

/**
 * API: Get knowledge content or score a paraphrase
 * POST { topic, action: "explain"|"score", paraphrase? }
 */
export async function POST(req: NextRequest) {
  try {
    const { topic, action, paraphrase } = await req.json();
    if (!topic) return NextResponse.json({ error: "Missing topic" }, { status: 400 });

    const apiKey = process.env.DEEPSEEK_API_KEY;
    const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

    if (!apiKey) {
      // Fallback
      if (action === "explain") {
        return NextResponse.json({ content: `📖 **${topic}**\n\n这是你需要掌握的核心知识点。请用自己的话复述这个概念。` });
      }
      return NextResponse.json({
        score: { score: 75, accuracy: 72, completeness: 68, logic: 80, clarity: 75, feedback: "基本理解正确。建议从不同角度补充说明。" }
      });
    }

    let prompt: string;
    
    if (action === "explain") {
      prompt = `请用300-500字解释知识点"${topic}"。要求：
1. 用通俗易懂的中文，避免术语堆砌
2. 包含：基本定义、核心原理、一个生活例子、常见误区
3. 最后给出2-3个引导性问题，帮助读者思考`;
    } else {
      prompt = `评估学生对"${topic}"的复述：
学生复述：${paraphrase}

返回JSON: {"score":0-100总分, "accuracy":准确性分, "completeness":完整性分, "logic":逻辑性分, "clarity":清晰度分, "feedback":"50字中文反馈", "missingPoints":["遗漏点1","遗漏点2"]}`;
    }

    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: action === "explain" ? 1024 : 512,
        ...(action === "score" ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (!resp.ok) throw new Error(`API ${resp.status}`);
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content;

    if (action === "explain") {
      return NextResponse.json({ content });
    }
    return NextResponse.json({ score: JSON.parse(content) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
