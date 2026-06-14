import { NextRequest, NextResponse } from "next/server";
import { safeParseAIJson } from "@/lib/utils";

/**
 * 刷新题目 — 一键生成全新的四六级原创题
 * 支持模块: reading, writing, translation, matching
 */
export async function POST(req: NextRequest) {
  const { module: moduleName, level = "cet4", count = 1 } = await req.json().catch(() => ({}));
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

  if (!apiKey) {
    return NextResponse.json({ error: "AI服务未配置" }, { status: 500 });
  }

  const modulePrompts: Record<string, { prompt: string }> = {
    reading: {
      prompt: `你是${level === "cet6" ? "六级" : "四级"}阅读命题专家。请生成 ${count} 篇全新的原创阅读理解材料，风格参考真题但不复制任何已有题目。
主题从以下随机选: 科技发展、环境保护、教育改革、文化差异、社会变迁、健康养生、职业规划、消费趋势。
每篇含4段280-360词，5道选择题(主旨/细节/推断/词义/态度)，每题4选项加中文解析和原文定位。

输出JSON:
{"articles":[{"id":"refreshed-序号","title":"标题","difficulty":"${level}","topic":"主题","wordCount":320,"paragraphs":["段1","段2","段3","段4"],"questions":[{"id":"q1","questionText":"问题","options":["A.","B.","C.","D."],"correctIndex":0,"explanation":"中文解析","sourceIndex":0,"sourceText":"定位句"}]}]}`,
    },
    writing: {
      prompt: `你是${level === "cet6" ? "六级" : "四级"}写作命题专家。请生成 ${count} 个全新原创作文题目，不复制已有题。
题型随机覆盖议论文/书信/图表作文。

输出JSON:
{"prompts":[{"category":"argumentative|letter|chart","categoryName":"议论文写作|书信写作|图表作文","prompt":"英文题目","promptZh":"中文说明"}]}`,
    },
    translation: {
      prompt: `你是${level === "cet6" ? "六级" : "四级"}翻译命题专家。请生成 ${count} 个全新原创汉译英题目，不复制已有题。
领域随机: 传统文化、经济发展、社会进步、科技创新、环境保护、教育发展。

输出JSON:
{"prompts":[{"category":"culture|economy|society","categoryName":"文化类翻译|经济类翻译|社会类翻译","prompt":"中文原文(2-3句)","reference":"参考英文译文"}]}`,
    },
    matching: {
      prompt: `你是${level === "cet6" ? "六级" : "四级"}段落匹配命题专家。请严格按照四六级真题标准生成1套全新段落匹配题。

# 真题格式要求
1. 一篇完整长文章，分成 9-12 个段落（标号从 A 开始，如 A 到 I/J/K/L）
2. 每段 80-150 英文词，段落之间逻辑连贯
3. 生成 10 道匹配题陈述（**必须全英文**，与四六级真题一致），每题对应唯一一个段落
4. 核心考察同义替换——陈述句不能直接照抄原文词汇，必须用不同的英文表达
5. 答案随机分布在各个段落（不能全集中在某几个段）
6. 每题附带原文定位句(英文)和同义替换说明(中文)
7. **严禁生成中文陈述**，所有 matching statement 必须是英文

# 主题选择
从以下随机选一个主题: 科技发展、教育改革、环境保护、职场趋势、健康生活、文化差异、经济发展、社会变迁

输出JSON:
{
  "title": "文章标题(英文)",
  "topic": "主题(中文)",
  "paragraphCount": 10,
  "paragraphs": [
    {"label": "A", "text": "段落内容(英文80-150词)"},
    ...
  ],
  "questions": [
    {"id": 1, "text": "Matching statement in English here", "answerLabel": "C", "locateSentence": "原文定位句(英文)", "paraphraseNote": "同义替换说明(中文)"},
    ...
  ]
}`,
    },
  };

  const config = modulePrompts[moduleName];
  if (!config) {
    return NextResponse.json({ error: `不支持的模块: ${moduleName}` }, { status: 400 });
  }

  try {
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: config.prompt }],
        temperature: 0.9,
        max_tokens: 8192,
        response_format: { type: "json_object" },
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      const content = safeParseAIJson(data.choices?.[0]?.message?.content || "{}");
      return NextResponse.json({ success: true, module: moduleName, level, ...content });
    }
    throw new Error("AI请求失败");
  } catch (e: any) {
    return NextResponse.json({ error: `刷新失败: ${e.message}` }, { status: 500 });
  }
}
