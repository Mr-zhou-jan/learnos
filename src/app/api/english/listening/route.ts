import { NextRequest, NextResponse } from "next/server";
import { getCET4Template, getCET6Template } from "@/data/listening-sets";
import {
  buildListeningPrompt,
  parsePassageResult,
  buildTestData,
  buildFallbackTest,
} from "@/lib/listening-generator";
import { safeParseAIJson } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { level } = await req.json();
    if (!level || !["cet4", "cet6"].includes(level)) {
      return NextResponse.json({ error: "请选择 cet4 或 cet6" }, { status: 400 });
    }

    const template = level === "cet4" ? getCET4Template() : getCET6Template();
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

    const sectionResults: {
      sectionId: string; sectionTitle: string; description: string; direction: string;
      questions: any[];
    }[] = [];

    let globalQNum = 0;
    let aiSuccessCount = 0;

    for (const sec of template.sections) {
      const sectionQuestions: any[] = [];

      for (const pc of sec.passageConfigs) {
        let aiGenerated = false;

        if (apiKey) {
          try {
            const prompt = buildListeningPrompt(
              level as "cet4" | "cet6",
              sec.id, sec.title, pc.passageTitle, pc.questionCount, globalQNum
            );

            const resp = await fetch(`${baseUrl}/chat/completions`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
              body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.85,
                max_tokens: 2000,
                response_format: { type: "json_object" },
              }),
            });

            if (resp.ok) {
              const data = await resp.json();
              const content = data.choices?.[0]?.message?.content;
              if (content) {
                try {
                  const parsed = safeParseAIJson(content);
                  const questions = parsePassageResult(parsed, sec.id, globalQNum);
                  if (questions.length === pc.questionCount) {
                    sectionQuestions.push(...questions);
                    globalQNum += questions.length;
                    aiSuccessCount++;
                    aiGenerated = true;
                  }
                } catch {}
              }
            }
          } catch {}
        }

        // AI 失败时，使用 buildFallbackTest 中的完整回退数据
        if (!aiGenerated) {
          const fallbackTest = buildFallbackTest(level as "cet4" | "cet6");
          const fallbackSection = fallbackTest.sections.find((s) => s.id === sec.id);
          if (fallbackSection) {
            // 从回退 Section 中取出对应数量的题目
            const fbQs = fallbackSection.questions.slice(globalQNum, globalQNum + pc.questionCount);
            if (fbQs.length > 0) {
              for (const fq of fbQs) {
                sectionQuestions.push({
                  ...fq,
                  id: `${sec.id}-${globalQNum}`,
                  questionNumber: globalQNum + 1,
                });
                globalQNum++;
              }
            }
          }
        }
      }

      sectionResults.push({
        sectionId: sec.id,
        sectionTitle: sec.title,
        description: sec.description,
        direction: sec.direction,
        questions: sectionQuestions,
      });
    }

    const testData = buildTestData(
      level as "cet4" | "cet6",
      `${level === "cet4" ? "CET-4" : "CET-6"} 全真模拟听力 #${Date.now().toString(36).slice(-4)}`,
      sectionResults
    );

    return NextResponse.json({
      success: true,
      test: testData,
      aiGenerated: aiSuccessCount,
      totalPassages: template.sections.reduce((s, sec) => s + sec.passageConfigs.length, 0),
    });
  } catch (error) {
    return NextResponse.json({ error: "生成失败", detail: String(error) }, { status: 500 });
  }
}
