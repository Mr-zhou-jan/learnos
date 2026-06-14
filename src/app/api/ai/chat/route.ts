import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { messages, socraticMode, stream: useStream } = await req.json();
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  const systemMsg = socraticMode
    ? { role: "system", content: "你是苏格拉底式导师，只问问题不给答案，追问'为什么'。" }
    : { role: "system", content: "你是AI学习导师，用清晰简洁的中文帮助学生。" };

  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

  // 流式（AI教练用）
  if (useStream) {
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "deepseek-chat", messages: [systemMsg, ...messages], temperature: 0.7, max_tokens: 2048, stream: true }),
    });
    return new Response(resp.body, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  }

  // 非流式（翻译用）
  try {
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "deepseek-chat", messages: [systemMsg, ...messages], temperature: 0.7, max_tokens: 2048 }),
    });
    if (!resp.ok) return NextResponse.json({ error: `AI error ${resp.status}` }, { status: 500 });
    const data = await resp.json();
    return NextResponse.json({ reply: data.choices?.[0]?.message?.content || "" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
