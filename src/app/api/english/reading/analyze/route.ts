import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { article, action } = await req.json();
  const text = (article?.paragraphs || []).join("\n\n");
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
  const actionMap: Record<string, string> = {
    summary: "用中文总结文章主旨、每段要点和作者态度。",
    translate: "把全文翻译成自然中文，保持段落对应。",
    structure: "分析文章结构：每段功能、逻辑连接、主旨句、出题点。",
    sentences: "挑出 3 个长难句，标出主干、从句/修饰成分，并给出中文翻译。",
  };

  if (apiKey) {
    try {
      const prompt = `你是英语四级阅读老师。请${actionMap[action] || actionMap.summary}

文章:
${text}

输出中文，条理清晰，适合学生做题后复盘。`;
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], temperature: 0.4, max_tokens: 2048 }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return NextResponse.json({ content: data.choices?.[0]?.message?.content || "" });
      }
    } catch {}
  }

  return NextResponse.json({ content: fallback(action, article) });
}

function fallback(action: string, article: any) {
  const title = article?.title || "本文";
  if (action === "translate") return `${title}：这篇文章围绕主题展开，建议逐段翻译并标出关键词。当前未配置 AI Key，因此显示本地兜底结果。`;
  if (action === "structure") return "结构：第1段引入主题；第2段展开优势或原因；第3段讨论问题或限制；第4段给出结论和建议。";
  if (action === "sentences") return "长难句训练：先找主语和谓语，再处理定语从句、状语从句和插入成分，最后按意群翻译。";
  return `总结：${title} 主要考查主旨理解、细节定位、同义替换和作者态度判断。`;
}
