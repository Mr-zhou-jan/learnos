import { NextRequest, NextResponse } from "next/server";

/**
 * 链接导入 — 用户粘贴URL，抓取页面内容并用AI解析为训练材料
 * 支持模块: reading, listening, writing, translation
 */
export async function POST(req: NextRequest) {
  const { url, module: moduleName } = await req.json().catch(() => ({}));

  if (!url) {
    return NextResponse.json({ error: "请提供有效的URL链接" }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

  // 尝试抓取网页内容
  let pageContent = "";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const fetchResp = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);

    if (fetchResp.ok) {
      const html = await fetchResp.text();
      pageContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 8000);
    }
  } catch {
    // 抓取失败时，AI将根据URL域名推测内容
  }

  if (apiKey) {
    const moduleInstructions: Record<string, string> = {
      reading: "请整理为阅读理解训练材料。提取/重构一篇280-360词英文文章(4段)，5道选择题(主旨/细节/推断/词义/态度)每题4选项+中文解析+原文定位。输出JSON:{content:{id,title,difficulty:\"cet4\",topic,wordCount,paragraphs:[],questions:[{id,questionText,options:[],correctIndex,explanation,sourceIndex,sourceText}]}}",
      listening: "请整理为听力精听训练材料。提取/编制4-6句英文听力文本(每句独立)，标注关键词和听力要点。输出JSON:{content:{transcript:[],keywords:[],tips:[]}}",
      writing: "请整理为写作训练题目。提取/编制1-3个作文题，分议论文/书信/图表作文。输出JSON:{content:{prompts:[{category,categoryName,prompt,promptZh}]}}",
      translation: "请整理为汉译英翻译训练材料。提取/编制1-3个中文段落(2-3句)，提供参考译文，分文化/经济/社会。输出JSON:{content:{prompts:[{category,categoryName,prompt,reference}]}}",
    };

    const instruction = moduleInstructions[moduleName] || moduleInstructions.reading;

    try {
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{
            role: "user",
            content: `用户从链接导入了${moduleName}内容。\n链接: ${url}\n${pageContent ? `抓取的页面文本(前8000字符): ${pageContent}` : "无法抓取，请根据URL域名和路径推测内容类型。"}\n\n${instruction}`,
          }],
          temperature: 0.7,
          max_tokens: 4096,
          response_format: { type: "json_object" },
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const result = JSON.parse(data.choices?.[0]?.message?.content || "{}");
        return NextResponse.json({
          success: true,
          message: `链接内容已成功导入${moduleName}！`,
          content: result.content || result,
        });
      }
    } catch {}
  }

  return NextResponse.json({
    success: true,
    message: `链接已记录，但无法自动解析内容。请在${moduleName}中手动输入。`,
    content: { url, module: moduleName, rawText: pageContent.slice(0, 500) },
  });
}
