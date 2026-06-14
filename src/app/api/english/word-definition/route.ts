import { NextRequest, NextResponse } from "next/server";

const cache = new Map<string, any>();

export async function POST(req: NextRequest) {
  try {
    const { word, level } = await req.json();
    if (!word) return NextResponse.json({ error: "请输入单词" }, { status: 400 });

    const cacheKey = `${word}_${level || "cet4"}`;
    if (cache.has(cacheKey)) return NextResponse.json(cache.get(cacheKey));

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return NextResponse.json({ word, meaning: "", source: "no_api_key" });

    const levelText = level === "cet6" ? "CET-6" : "CET-4";
    const prompt = `你是${levelText}英语命题专家。请为单词"${word}"提供${levelText}考试范围内的精准释义。

要求：
1. 只给出${levelText}考试核心义项，不列偏义
2. 一词多义列出所有常考义项（分号分隔）
3. 例句贴近真题风格
4. 短语为高频考点

输出纯JSON: {"word":"${word}","phonetic":"音标","meaning":"词性. 核心释义","pos":"词性","example":"英文例句","exampleZh":"中文翻译","synonyms":["同义1","同义2"],"antonyms":["反义1"],"phrases":["短语1","短语2"],"similarWords":["形近词1(中文)","形近词2(中文)"]}`;

    const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1, max_tokens: 800,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (resp.ok) {
      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        try {
          const def = JSON.parse(content.replace(/```json\s*/gi, "").replace(/```\s*/g, ""));
          def.source = "ai";
          cache.set(cacheKey, def);
          return NextResponse.json(def);
        } catch {}
      }
    }
    return NextResponse.json({ word, meaning: "", source: "failed" });
  } catch {
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
