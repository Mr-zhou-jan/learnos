import { NextRequest, NextResponse } from "next/server";
import { classifySubject, recommendMethods } from "@/lib/engine/learning-methods";

/**
 * POST: 根据测验结果 + 知识库生成专属学习计划
 * {
 *   quizResults: { nodeScores, totalCorrect, totalQuestions },
 *   courseName: "英语四六级",
 *   videoUrl?: "https://...",
 *   dailyTime: 30
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { quizResults, courseName, videoUrl, dailyTime = 30 } = await req.json();
    
    if (!quizResults || !courseName) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
    const subjectCategory = classifySubject(courseName);
    const methodCatalog = recommendMethods(subjectCategory, 4).map((method) => ({
      id: method.id,
      name: method.name,
      description: method.description,
      steps: method.steps.map((step) => `${step.title}: ${step.description}`).join("；"),
    }));

    // Build personalized plan prompt
    const weakNodes = (quizResults.nodeScores || [])
      .filter((n: any) => n.score < 60)
      .map((n: any) => ({ title: n.title, score: n.score }));

    const strongNodes = (quizResults.nodeScores || [])
      .filter((n: any) => n.score >= 80)
      .map((n: any) => n.title);

    const prompt = `你是学习规划专家。根据以下诊断结果，为学生"${courseName}"生成一份个性化7天学习计划。

诊断总正确率: ${quizResults.totalCorrect}/${quizResults.totalQuestions} (${Math.round((quizResults.totalCorrect/quizResults.totalQuestions)*100)}%)
每日可用时间: ${dailyTime}分钟
学科类型: ${subjectCategory}

薄弱环节 (需重点攻克):
${weakNodes.map((w: any) => `- ${w.title}: 掌握度${w.score}%`).join('\n') || '无明显薄弱环节'}

已掌握:
${strongNodes.join(', ') || '暂未发现已掌握知识点'}

${videoUrl ? `学习资料来源: 视频 ${videoUrl} 的提取内容` : '学习来源: 系统知识库'}

可选训练方法（只能使用这些method id）:
${methodCatalog.map((m) => `- ${m.id}: ${m.name}。${m.description}。步骤：${m.steps}`).join('\n')}

规划原则:
1. 不同学科必须使用不同训练闭环：语言重语境/题目/图片，编程重项目/Debug，理论和财经可用复述追问。
2. 每天必须包含“输入理解→主动输出→即时反馈→间隔复习”四段中的至少三段。
3. 优先把薄弱知识点拆成可执行训练任务，而不是泛泛建议。

请输出JSON:
{
  "summary": "50字总体评价",
  "subjectCategory": "${subjectCategory}",
  "focusAreas": ["重点1", "重点2"],
  "recommendedMethods": [{"id": "方法id", "name": "方法名", "reason": "为什么适合当前学生"}],
  "weeklyPlan": [
    {
      "day": 1,
      "focus": "当日重点",
      "tasks": [
        {"title": "任务名", "method": "方法id", "durationMin": 15, "description": "具体说明"}
      ]
    }
  ],
  "tips": ["建议1", "建议2"]
}`;

    let plan;
    
    if (apiKey) {
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 2048,
          response_format: { type: "json_object" },
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        plan = JSON.parse(data.choices[0].message.content);
      }
    }

    if (!plan) {
      // Fallback plan
      plan = {
        summary: `诊断完成！薄弱环节需要加强，建议从基础概念开始，每天保持${dailyTime}分钟学习。`,
        subjectCategory,
        focusAreas: weakNodes.slice(0, 3).map((w: any) => w.title),
        recommendedMethods: methodCatalog.slice(0, 3).map((m) => ({
          id: m.id,
          name: m.name,
          reason: `适合${courseName}当前薄弱点的训练闭环`,
        })),
        weeklyPlan: Array.from({ length: 7 }, (_, i) => ({
          day: i + 1,
          focus: i < 3 ? `攻克薄弱点${i+1}` : i < 5 ? "巩固已掌握知识" : "综合复习",
          tasks: [
            { title: "知识点学习", method: methodCatalog[0]?.id || "active-recall", durationMin: Math.round(dailyTime * 0.5), description: "学习并完成一次主动输出" },
            { title: "针对性练习", method: methodCatalog[1]?.id || "active-recall", durationMin: Math.round(dailyTime * 0.4), description: "围绕薄弱点完成配套训练" },
            { title: "间隔复习", method: "review", durationMin: Math.round(dailyTime * 0.1), description: "复习之前学过的内容" },
          ],
        })),
        tips: ["坚持每天学习比一次学很久更有效", "学完立即主动回忆，记忆效果提升2倍", "薄弱点需要多轮复习才能彻底掌握"],
      };
    }

    return NextResponse.json(plan);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
