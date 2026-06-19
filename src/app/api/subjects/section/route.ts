import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.DEEPSEEK_API_KEY;
const BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

async function callAI(prompt: string): Promise<string | null> {
  try {
    const r = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: 2000 }),
      signal: AbortSignal.timeout(20000),
    });
    const d = await r.json();
    return d.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const { subject, section, stage, count } = await req.json();
    if (!subject || !section || !stage) return NextResponse.json({ success: false, error: "参数不全" });

    let prompt = "";
    switch (stage) {
      case "concept":
        prompt = `你是大学"${subject}"老师。用300字精讲"${section}"考试核心。只讲最常考的，给出1个生活例子+1个关键公式(如有)。直接输出文本。`;
        break;
      case "example":
        prompt = `你是大学"${subject}"老师。针对"${section}"出一道典型例题并给详细解答。输出JSON:{"question":"题目","solution":"分步骤解答(含每一步的公式引用)"}`;
        break;
      case "similar":
      case "variation":
      case "test":
        const type = stage === "similar" ? "同类题(与例题模式相同数字不同)" : stage === "variation" ? "变式题(稍微改变问法)" : "章节测试(综合考察)";
        prompt = `你是大学"${subject}"老师。针对"${section}"出${count}道${type}。每题4选项含典型错误答案。输出JSON数组:[{"question":"","options":["A.","B.","C.","D."],"correctIndex":0,"explanation":"分步解析"}]`;
        break;
    }

    if (!API_KEY) return NextResponse.json({ success: true, data: getFallback(subject, section, stage, count) });

    const content = await callAI(prompt);
    if (!content) return NextResponse.json({ success: false, error: "AI生成失败，请重试" });

    let data: any;
    try {
      const cleaned = content.replace(/```json\n?|```/g, "").trim();
      if (stage === "concept") data = { text: content };
      else if (stage === "example") data = JSON.parse(cleaned);
      else {
        const parsed = JSON.parse(cleaned);
        data = { questions: Array.isArray(parsed) ? parsed : [] };
      }
    } catch { data = stage === "concept" ? { text: content } : { questions: [] }; }

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}

function getFallback(sub: string, sec: string, stage: string, ct: number): any {
  switch (stage) {
    case "concept": return { text: `【${sub}·${sec}】考试核心精讲(需配置DeepSeek API Key)` };
    case "example": return { question: `[${sec}典型例题]`, solution: "详细解答(需API Key)" };
    default: return { questions: Array.from({ length: ct }, (_, i) => ({ question: `[${sec}第${i + 1}题]`, options: ["A.","B.","C.","D."], correctIndex: 0, explanation: "解析(需API Key)" })) };
  }
}
