import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { answers } = await req.json();
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

    let totalScore = 0;
    const breakdown: Record<string, number> = {};
    const sectionMap: Record<string, string> = { writing: "写作", listening: "听力", reading: "阅读", translation: "翻译" };

    // MCQ 自动评分
    for (const a of (answers || [])) {
      if (a.options && a.correctIndex !== undefined) {
        const correct = a.userAnswer === String.fromCharCode(65 + (a.correctIndex || 0));
        const sec = sectionMap[a.section] || a.section;
        breakdown[sec] = (breakdown[sec] || 0) + (correct ? (a.score || 10) : 0);
        if (correct) totalScore += (a.score || 10);
      }
    }

    // 写作+翻译 AI 评分
    const subjectiveAnswers = (answers || []).filter((a: any) => (a.type === "writing" || a.type === "translation") && a.userAnswer);
    if (apiKey && subjectiveAnswers.length > 0) {
      const scores = await Promise.all(subjectiveAnswers.map((a: any) => aiScore(apiKey, baseUrl, a.type, a.userAnswer, a.question)));
      let idx = 0;
      for (const a of subjectiveAnswers) {
        const s = scores[idx++] || 60;
        const sec = sectionMap[a.section] || a.section;
        breakdown[sec] = (breakdown[sec] || 0) + s;
        totalScore += s;
      }
    }

    return NextResponse.json({ success: true, totalScore: Math.min(710, Math.round(totalScore)), breakdown });
  } catch {
    return NextResponse.json({ error: "评分失败" }, { status: 500 });
  }
}

async function aiScore(key: string, baseUrl: string, type: string, answer: string, question: string): Promise<number> {
  try {
    const label = type === "writing" ? "写作" : "翻译";
    const r = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "deepseek-chat", temperature: 0.1, max_tokens: 300,
        messages: [{ role: "user", content: `你是CET-4/6${label}评分专家。按四六级标准评分。\n题目：${question}\n学生作答：${answer}\n满分106分。从内容、结构、语言评估。输出JSON:{"score":整数,"comment":"中文评语"}` }],
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (r.ok) {
      const d = await r.json();
      const c = d.choices?.[0]?.message?.content;
      if (c) return Math.min(106, Math.max(0, Math.round(JSON.parse(c.replace(/```json\s*/gi,"").replace(/```\s*/g,"")).score || 60)));
    }
  } catch {}
  return 60;
}
