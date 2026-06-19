import { NextRequest, NextResponse } from "next/server";
import { classifySubject, isCalcSubject, getCalcPrompt } from "@/lib/engine/learning-methods";
import { safeParseAIJson } from "@/lib/utils";

/** 根据知识点标题/描述检测英语题型 */
function detectEnglishQuestionType(nodeTitle: string, nodeDescription: string): string {
  const t = `${nodeTitle} ${nodeDescription}`.toLowerCase();
  if (/听力|listening|短对话|长对话|短文理解|新闻听力|篇章听力/i.test(t)) return "listening";
  if (/段落匹配|matching|信息匹配|快速阅读匹配/i.test(t)) return "matching";
  if (/选词填空|cloze|完形|15选10|词汇辨析填空/i.test(t)) return "cloze";
  if (/仔细阅读|篇章阅读|深度阅读|reading.comprehension|阅读理解/i.test(t)) return "reading";
  if (/写作|writing|作文|议论文|书信|图表作文/i.test(t)) return "writing";
  if (/翻译|translation|汉译英|英译汉/i.test(t)) return "translation";
  if (/长难句|语法|grammar|句法/i.test(t)) return "grammar";
  if (/词汇|vocab|单词|词义|同义替换|固定搭配|短语/i.test(t)) return "vocab";
  return "reading";
}

/** 校验AI生成的题目一致性：解析不能说明的正确答案与correctIndex矛盾 */
function fixConsistency(q: any): any {
  if (!q.explanation || q.options?.length < 2 || q.correctIndex == null) return q;
  const exp = q.explanation;
  const letters = q.options.map((_: any, i: number) => String.fromCharCode(65 + i));
  const correctLetter = letters[q.correctIndex];
  // 检测解析中"正确/答案"指向的字母
  const m = exp.match(/(?:正确|答案|应该选|故选)[^A-D]*([A-D])/);
  if (m && m[1] !== correctLetter) {
    const statedLetter = m[1];
    const statedIdx = letters.indexOf(statedLetter);
    if (statedIdx >= 0 && statedIdx < q.options.length) {
      q.correctIndex = statedIdx;
      q.explanation = exp + ` (已自动修正：正确答案为${statedLetter})`;
    }
  }
  return q;
}

/** 按英语题型生成不同的出题 prompt */
function buildEnglishPrompt(node: { title: string; description: string }, difficulty: string): string {
  const type = detectEnglishQuestionType(node.title, node.description || "");

  const langRule = "题目正文和所有选项必须是纯英文。不要出教学说明类问题（如'议论文怎么写''作文格式是什么'），只出真实的四六级考题。解释用中文。**极其重要：correctIndex必须与解析一致，解析中要明确说正确答案为什么对，不能解析说B对但correctIndex标A。**";

  const prompts: Record<string, string> = {
    listening: `CET4听力。${langRule} 生成1题：30-60词纯英文对话(M:/W:标注)，4个纯英文选项。JSON:{"question":"📻\\n[English dialogue]\\n❓[English question]","options":["A. English","B. English","C. English","D. English"],"correctIndex":0,"difficulty":"${difficulty}","explanation":"中文解析","type":"listening","extraData":{"audioScript":"[全文英文原文]"}}`,
    matching: `CET4段落匹配。${langRule} 1题：60-100词纯英文段落，4个纯英文选项。JSON:{"question":"📄\\n[English paragraph]\\n❓[English question]","options":["A. English","B. English","C. English","D. English"],"correctIndex":0,"difficulty":"${difficulty}","explanation":"中文解析","type":"matching","extraData":{"paragraph":"[英文原文]"}}`,
    cloze: `CET4选词填空。${langRule} 含___的纯英文句子(30-50词)，4个同词性纯英文选项。JSON:{"question":"📝\\n[English sentence]\\n❓Choose the best word","options":["A. word","B. word","C. word","D. word"],"correctIndex":0,"difficulty":"${difficulty}","explanation":"中文解析","type":"cloze"}`,
    reading: `CET4阅读。${langRule} 1题：60-80词纯英文段落，4个纯英文选项。JSON:{"question":"📖\\n[English passage]\\n❓[English question]","options":["A. English","B. English","C. English","D. English"],"correctIndex":0,"difficulty":"${difficulty}","explanation":"中文解析","type":"reading","extraData":{"passage":"[英文原文]"}}`,
    writing: `CET4写作。出一道真实的英语作文题，例如议论文、书信、图表描述等。不要出"怎么写议论文"这类教学题。JSON:{"question":"[具体的写作题目+字数要求]","options":[],"difficulty":"${difficulty}","explanation":"范文参考要点","type":"writing","extraData":{"rubric":"评分标准"}}`,
    translation: `CET4翻译。出一道真实的汉译英题，30-60字中文段落。JSON:{"question":"[中文段落30-60字]","options":[],"difficulty":"${difficulty}","explanation":"参考译文+翻译要点","type":"translation","extraData":{"reference":"[英文参考译文]"}}`,
    grammar: `英语语法。"${node.title}"。${langRule} 4个纯英文选项。JSON:{"question":"[English question - real exam style]","options":["A. English","B. English","C. English","D. English"],"correctIndex":0,"difficulty":"${difficulty}","explanation":"中文解析","type":"grammar"}`,
    vocab: `CET4词汇。**词**双星号标注，4中文释义。JSON:{"question":"[含**词**的句]\\n❓含义","options":["A.","B.","C.","D."],"correctIndex":0,"difficulty":"${difficulty}","explanation":"解析","type":"vocab"}`,
  };

  return prompts[type] || prompts["reading"];
}

export async function POST(req: NextRequest) {
  try {
    const { courseIds, extractedNodes, courseName, difficulty } = await req.json();
    const diff = difficulty || "mixed";
    let nodes: any[] = extractedNodes || [];
    const displayName = courseName || "课程";
    const isEnglishCourse = classifySubject(displayName) === "language" && /英语|英文|cet|四级|六级/i.test(displayName);

    if (nodes.length === 0 && courseName) {
      nodes = [{ id: "gen-0", title: courseName, description: courseName, orderIndex: 0 }];
    }
    if (nodes.length === 0) {
      return NextResponse.json({ error: "无可用知识点" }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

    const selectedNodes = isEnglishCourse ? sanitizeEnglishNodes(nodes) : nodes;

    const AI_TIMEOUT_MS = 10000; // 单题最多等10秒
    const difficulties = ["easy", "medium", "hard"];

    // 并行生成所有题目（每道题独立调用 AI，15 秒超时，失败则用回退题）
    // 之前是串行 for 循环导致 10 题需要 100+ 秒，现在并行最多 15 秒完成
    const questionPromises = selectedNodes.map(async (node, i) => {
      const difficulty = diff === "mixed" ? difficulties[i % 3] : diff;
      const eqType = isEnglishCourse ? detectEnglishQuestionType(node.title, node.description || "") : "mcq";

      if (apiKey) {
        const prompt = isEnglishCourse
          ? buildEnglishPrompt(node, difficulty)
          : isCalcSubject(displayName)
            ? getCalcPrompt(node, difficulty)
            : `# Role
	你是${displayName}出题专家，根据知识点生成诊断选择题。

# 出题要求
1. 题目完全围绕指定知识点，不能涉及其他学科
2. 4个选项有强干扰性，错误选项对应典型知识盲区
3. 难度: ${difficulty}

# 解析要求（解析必须≥80字，包含三个部分）
① 为什么对：详细说明正确理由，涉及的知识点
② 为什么错：逐一分析每个错误选项的错误类型
③ 知识点链接：核心考点+高频出题方式+举一反三提示

知识点: ${node.title}
描述: ${node.description || ""}

输出纯JSON: {"question":"题目","options":["A. ...","B. ...","C. ...","D. ..."],"correctIndex":0,"difficulty":"${difficulty}","explanation":"①为什么对+②为什么错+③知识点链接"}`;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

          const resp = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.8,
              max_tokens: 1000,
              response_format: { type: "json_object" },
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (resp.ok) {
            const data = await resp.json();
            const content = data.choices?.[0]?.message?.content;
            if (content) {
              try {
                const q = safeParseAIJson(content);
                // 校验并修正 AI 生成的不一致（解析说B对但correctIndex标A）
                const corrected = fixConsistency(q);
                const shuffled = shuffleOptions(corrected.options, corrected.correctIndex ?? 0);
                return {
                  ...corrected,
                  options: shuffled.options,
                  correctIndex: shuffled.newIndex,
                  id: `q-${i}`,
                  nodeId: node.id,
                  nodeTitle: node.title,
                  courseName: displayName,
                  type: corrected.type || eqType,
                  extraData: corrected.extraData || null,
                };
              } catch {}
            }
          }
        } catch {
          // AI 超时或失败 → 用回退题
        }
      }

      // Fallback
      const fbQ = buildFallbackQuestion(node, eqType);
      const shuffled = shuffleOptions(fbQ.options, fbQ.correctIndex);
      return {
        id: `q-${i}`,
        ...fbQ,
        options: shuffled.options,
        correctIndex: shuffled.newIndex,
        nodeId: node.id,
        nodeTitle: node.title,
        courseName: displayName,
        type: eqType,
        extraData: fbQ.extraData || null,
      };
    });

    const questions = await Promise.all(questionPromises);

    return NextResponse.json({ success: true, totalQuestions: questions.length, questions, courseName: displayName });
  } catch (error) {
    return NextResponse.json({ error: "生成失败", detail: String(error) }, { status: 500 });
  }
}

/** AI 不可用时生成回退题，英语题型有不同模板 */
function buildFallbackQuestion(
  node: any,
  eqType: string,
): { question: string; options: string[]; correctIndex: number; difficulty: string; explanation: string; extraData?: any } {
  const desc = node.description?.slice(0, 60) || "";
  const title = node.title || "";

  const templates: Record<string, any> = {
    listening: {
      question: `📻 听力文本：\nA: ${title}相关对话…\nB: 对应回答…\n\n❓ 问题：关于「${title}」的听力理解`,
      options: [`A. ${desc || "正确理解"}`, "B. 常见错误理解", "C. 干扰理解", "D. 无关理解"],
    },
    matching: {
      question: `📄 阅读段落：\n${desc || title}相关的英文段落内容…\n\n❓ 匹配问题：以下哪个陈述与该段落匹配？`,
      options: [`A. ${title}相关段落大意`, "B. 不匹配的段落大意", "C. 部分匹配干扰项", "D. 无关段落大意"],
    },
    cloze: {
      question: `📝 选词填空：\nThe researchers decided to ___ the experiment due to safety concerns.\n\n❓ 选择最合适的词填入空格（___处）`,
      options: ["A. abandon", "B. abundant", "C. absorb", "D. absolute"],
    },
    reading: {
      question: `📖 阅读材料：\n${desc || title}相关的英文阅读段落…\n\n❓ 基于阅读材料的选择题`,
      options: [`A. ${desc || "正确理解"}`, "B. 常见错误理解", "C. 另一种错误理解", "D. 混淆项"],
    },
    writing: {
      question: `请以「${title}」为主题，写一篇不少于120词的英文短文。要求：观点明确、结构完整、语言流畅。`,
      options: [] as string[],
      explanation: `写作要点：1. 明确论点 2. 用具体例证支持 3. 注意段落衔接 4. 检查语法和拼写`,
      extraData: { rubric: "内容完整性40% + 语言准确性30% + 结构逻辑性30%" },
    },
    translation: {
      question: `请将以下中文翻译成英文：\n\n"${desc || title}是中国文化/社会发展的重要方面，近年来引起了广泛关注和讨论。"`,
      options: [] as string[],
      explanation: `参考译文：${desc || title} is an important aspect of Chinese culture/social development, which has attracted widespread attention and discussion in recent years.`,
      extraData: { reference: `${desc || title} is an important aspect...` },
    },
    grammar: {
      question: `以下关于「${title}」的句子中，哪个语法正确？`,
      options: ["A. 语法正确的句子", "B. 常见语法错误", "C. 时态错误", "D. 结构错误"],
    },
    vocab: {
      question: `The new evidence was crucial to solving the mystery.\n\n❓ 句中"crucial"的含义是？`,
      options: ["A. 关键的", "B. 残忍的", "C. 粗糙的", "D. 随便的"],
    },
  };

  const tpl = templates[eqType] || templates["reading"];
  let extraData: any = null;
  if (eqType === "listening") {
    const fallbackScript = `This is a listening comprehension exercise about ${title}. ${desc || ""} Please listen carefully and answer the question.`;
    extraData = { audioScript: fallbackScript };
  }
  return {
    question: tpl.question,
    options: tpl.options,
    correctIndex: 0,
    difficulty: "medium",
    explanation: node.description || `「${title}」知识点解析`,
    extraData,
  };
}

function sanitizeEnglishNodes(nodes: any[]): any[] {
  const blocked = /python|java|c\+\+|javascript|typescript|算法|数据结构|编程|代码|前端|后端|机器学习|数据库|物理|金融|投资/i;
  const filtered = nodes.filter((node) => !blocked.test(`${node.title || ""} ${node.description || ""}`));
  if (filtered.length > 0) return filtered;
  return [
    { id: "eng-reading", title: "四级仔细阅读", description: "诊断学生对主旨题、细节题、推断题、词义题和作者态度题的掌握情况。" },
    { id: "eng-matching", title: "段落匹配", description: "诊断学生快速定位、同义替换识别和段落主旨归纳能力。" },
    { id: "eng-listening", title: "四级听力", description: "诊断学生关键词预判、转折信号、数字信息和态度推断能力。" },
    { id: "eng-writing", title: "四级写作", description: "诊断学生审题、框架组织、论证展开和语言准确性。" },
    { id: "eng-translation", title: "四级翻译", description: "诊断学生意群切分、关键词表达、句式转换和中文信息重组能力。" },
  ];
}

/** Fisher-Yates 洗牌 */
function shuffleOptions(options: string[], correctIndex: number): { options: string[]; newIndex: number } {
  const arr = options.map((text, i) => ({ text, wasCorrect: i === correctIndex }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const newIndex = arr.findIndex(item => item.wasCorrect);
  return { options: arr.map(item => item.text), newIndex };
}
