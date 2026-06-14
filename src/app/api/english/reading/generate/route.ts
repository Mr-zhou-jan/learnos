import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { level = "cet4", topic = "campus life" } = await req.json().catch(() => ({}));
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

  if (apiKey) {
    try {
      const prompt = `你是大学英语${level === "cet6" ? "六级" : "四级"}阅读命题专家。请生成一篇原创阅读理解材料，风格参考四六级真题但不要复制任何原题。

主题: ${topic}
要求:
1. 文章 280-360 英文词，分 4 段。
2. 生成 5 道选择题，覆盖主旨、细节、推断、词义、态度/结构。
3. 每题 4 个选项，错误选项要有真实干扰性。
4. 每题解析用中文，必须说明定位段落、正确理由、错误选项为什么错。
5. 输出纯 JSON。

格式:
{
  "title": "英文标题",
  "difficulty": "${level}",
  "topic": "中文主题",
  "wordCount": 320,
  "paragraphs": ["p1","p2","p3","p4"],
  "questions": [
    {"id":"q1","questionText":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correctIndex":0,"explanation":"中文解析","sourceIndex":0,"sourceText":"原文定位短句"}
  ]
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
        const article = JSON.parse(data.choices?.[0]?.message?.content || "{}");
        return NextResponse.json(normalizeArticle(article, level));
      }
    } catch {}
  }

  return NextResponse.json(normalizeArticle(fallbackArticle(level), level));
}

function normalizeArticle(article: any, level: string) {
  const id = `ai-${Date.now()}`;
  const paragraphs = Array.isArray(article.paragraphs) ? article.paragraphs.slice(0, 4) : [];
  return {
    id,
    title: article.title || "A New Way to Learn English",
    difficulty: article.difficulty || level,
    topic: article.topic || "教育",
    wordCount: article.wordCount || paragraphs.join(" ").split(/\s+/).length,
    paragraphs,
    questions: (article.questions || []).slice(0, 5).map((q: any, index: number) => ({
      id: q.id || `q${index + 1}`,
      questionText: q.questionText || q.question || "",
      options: q.options || [],
      correctIndex: Number.isInteger(q.correctIndex) ? q.correctIndex : 0,
      explanation: q.explanation || "解析暂缺。",
      sourceIndex: Number.isInteger(q.sourceIndex) ? q.sourceIndex : 0,
      sourceText: q.sourceText || "",
    })),
  };
}

function fallbackArticle(level: string) {
  return {
    title: "Learning with Artificial Intelligence",
    difficulty: level,
    topic: "教育科技",
    paragraphs: [
      "Artificial intelligence is changing the way students learn foreign languages. Instead of simply reading textbooks, learners can now receive immediate feedback on grammar, vocabulary and pronunciation. This makes practice more personal and efficient.",
      "One important advantage is that AI can identify a learner's weak points. For example, if a student repeatedly makes mistakes in reading inference questions, the system can provide more exercises of the same type and explain the reasoning process step by step.",
      "However, AI should not replace active thinking. Students still need to summarize passages, compare ideas and express opinions in their own words. Without these efforts, technology may only create an illusion of progress.",
      "Experts suggest that the best approach is to combine AI tools with disciplined practice. When students use AI to diagnose problems and then actively correct them, language learning becomes both more focused and more sustainable.",
    ],
    questions: [
      { id: "q1", questionText: "What is the passage mainly about?", options: ["A. AI replacing teachers", "B. AI helping language learning when used actively", "C. The danger of textbooks", "D. The history of English exams"], correctIndex: 1, explanation: "文章整体讨论 AI 如何帮助语言学习，同时强调学生仍需主动思考，因此 B 最全面。", sourceIndex: 0, sourceText: "changing the way students learn foreign languages" },
      { id: "q2", questionText: "What can AI identify according to the passage?", options: ["A. A learner's weak points", "B. A student's family background", "C. The future exam paper", "D. A teacher's salary"], correctIndex: 0, explanation: "第二段明确提到 AI can identify a learner's weak points。", sourceIndex: 1, sourceText: "identify a learner's weak points" },
      { id: "q3", questionText: "The word illusion most nearly means ___?", options: ["A. Clear evidence", "B. False impression", "C. Practical method", "D. Strong ability"], correctIndex: 1, explanation: "illusion 表示错觉，文中指如果不主动思考，技术可能只制造进步的假象。", sourceIndex: 2, sourceText: "an illusion of progress" },
      { id: "q4", questionText: "What does the author suggest students should do?", options: ["A. Stop using AI", "B. Only memorize words", "C. Combine AI tools with disciplined practice", "D. Avoid reading passages"], correctIndex: 2, explanation: "末段第一句直接给出建议：combine AI tools with disciplined practice。", sourceIndex: 3, sourceText: "combine AI tools with disciplined practice" },
      { id: "q5", questionText: "What is the author's attitude toward AI learning tools?", options: ["A. Balanced", "B. Completely negative", "C. Uninterested", "D. Angry"], correctIndex: 0, explanation: "作者既肯定 AI 的诊断和反馈价值，也提醒不能替代主动思考，态度是平衡的。", sourceIndex: 2, sourceText: "AI should not replace active thinking" },
    ],
  };
}
