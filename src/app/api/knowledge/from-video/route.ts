import { NextRequest, NextResponse } from "next/server";
import { classifySubject } from "@/lib/engine/learning-methods";
import { safeParseAIJson } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { videoUrl, courseName, courseId, manualTranscript } = await req.json();
    if (!courseName) return NextResponse.json({ error: "请输入课程名称" }, { status: 400 });

    const apiKey = process.env.DEEPSEEK_API_KEY;
    const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
    const finalCourseId = courseId || `custom-${Date.now()}`;
    const subjectCategory = classifySubject(courseName);
    const isEnglishCourse = subjectCategory === "language" && /英语|英文|cet|四级|六级/i.test(courseName);

    let transcriptText = manualTranscript || "";
    let videoTitle = courseName;

    // ============================================================
    // Step 1: Try to get transcript from video
    // ============================================================
    if (videoUrl && !manualTranscript) {
      // Parse video URL
      let bvid = "";
      const biliMatch = videoUrl.match(/BV[a-zA-Z0-9]{10}/);
      if (biliMatch) bvid = biliMatch[0];
      else {
        // Try to resolve b23.tv
        const shortMatch = videoUrl.match(/b23\.tv\/([a-zA-Z0-9]+)/);
        if (shortMatch) {
          try {
            const resolveResp = await fetch(`https://b23.tv/${shortMatch[1]}`, {
              method: "GET", redirect: "follow",
              headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
            });
            const resolved = resolveResp.url;
            const bvMatch = resolved.match(/BV[a-zA-Z0-9]{10}/);
            if (bvMatch) bvid = bvMatch[0];
          } catch {}
        }
      }

      if (bvid) {
        try {
          // Get video info
          const infoResp = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
            headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://www.bilibili.com" },
          });
          const infoData = await infoResp.json();
          if (infoData.code === 0) {
            videoTitle = infoData.data.title || courseName;
            const cid = infoData.data.cid;
            
            // Try to get subtitles
            const subResp = await fetch(`https://api.bilibili.com/x/player/v2?bvid=${bvid}&cid=${cid}`, {
              headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://www.bilibili.com" },
            });
            const subData = await subResp.json();
            const subtitles = subData.data?.subtitle?.subtitles;
            
            if (subtitles?.length > 0) {
              const zhSub = subtitles.find((s: any) => s.lan_doc?.includes("中文") || s.lan === "zh-Hans") || subtitles[0];
              const subUrl = zhSub.subtitle_url.startsWith("http") ? zhSub.subtitle_url : `https:${zhSub.subtitle_url}`;
              const contentResp = await fetch(subUrl);
              const contentData = await contentResp.json();
              transcriptText = contentData.body?.map((item: any) => item.content).join("\n") || "";
            }
          }
        } catch {}
      }
    }

    // ============================================================
    // Step 2: AI extract knowledge structure
    // ============================================================
    let knowledgeNodes: any[] = [];

    if (apiKey) {
      let prompt: string;
      
      if (transcriptText && transcriptText.length > 100) {
        // Has transcript: extract from actual content
        prompt = `# Role
你是一个学科知识提取器。从视频字幕中提取与指定学科直接相关的知识点。

# 核心规则
1. 只提取与【指定学科】直接相关的内容。严格排除其他学科。
2. 英语四六级知识域：听力理解、阅读理解、写作、翻译、词汇、语法、口语。
3. 如果课程主题是英语/四六级，只能提取 CET4/CET6 英语考试能力点，禁止出现 Python、Java、C++、算法、数据结构、前端、后端、机器学习等编程内容。
4. 如果视频标题和字幕包含其他学科，但课程主题是英语，必须忽略这些无关内容，只保留英语学习方法、题型技巧、词汇语法、阅读听力写作翻译相关内容。
5. 如果字幕中没有目标学科的知识点，输出空数组

# 输出要求
输出纯JSON: {"nodes":[{"title":"知识点","description":"100-300字详细解释","parentTitle":null,"orderIndex":0,"children":[{"title":"子知识点","description":"详细说明","orderIndex":0}]}]}

视频标题: ${videoTitle}
课程主题: ${courseName}

字幕内容:
"""
${transcriptText.slice(0, 10000)}
"""

请输出JSON（不要markdown代码块）:
{
  "nodes": [
    {
      "title": "知识点名称（精确具体）",
      "description": "100-300字的详细解释，包含关键概念、公式、例子",
      "parentTitle": null,
      "orderIndex": 0,
      "children": [
        {
          "title": "子知识点",
          "description": "详细说明",
          "orderIndex": 0
        }
      ]
    }
  ]
}

要求:
1. 提取至少10个知识点，越多越好
2. 组织成2-3层树状结构
3. 每个知识点写出详细的中文解释（至少100字）
4. 子知识点必须是父知识点的具体展开
5. 不要遗漏视频中的任何重要概念
6. ${isEnglishCourse ? "本次是英语四六级课程，输出必须覆盖听力、阅读、段落匹配、选词填空、写作、翻译、词汇、语法、长难句等英语能力点。" : "严格服从课程主题，不要跨学科发散。"}`;
      } else {
        // No transcript: generate from topic
        prompt = `# Role
你是课程设计专家。请为"${courseName}"设计知识体系。

# 核心规则
1. 知识域严格限定在${courseName}范围
2. 英语→听力/阅读/写作/翻译/词汇/语法
3. 如果是英语/四六级，禁止输出任何编程、算法、物理、金融知识点，只能输出英语考试能力点
4. 物理→力学/热学/电磁学/光学
5. 输出纯JSON: {"nodes":[...]}${videoTitle !== courseName ? `（参考视频标题: ${videoTitle}）` : ""}。

请输出JSON:
{
  "nodes": [
    {
      "title": "章节名称",
      "description": "该章节涵盖的核心内容说明",
      "parentTitle": null,
      "orderIndex": 0,
      "children": [
        {
          "title": "具体知识点",
          "description": "详细解释（包含定义、要点、示例）",
          "orderIndex": 0
        }
      ]
    }
  ]
}

要求:
1. 至少5个一级章节，每章3-6个知识点
2. 总共至少15个知识点
3. 每个知识点描述至少100字
4. 覆盖该学科的主要学习内容
5. 知识点之间要有逻辑递进关系
6. ${isEnglishCourse ? "本次必须按英语四六级考试题型组织：听力、阅读理解、段落匹配、选词填空、写作、翻译、词汇语法、长难句。" : "不要输出无关学科内容。"}`;

        // Use video title as course name if better
        if (videoTitle !== courseName && videoTitle.length > 2) {
          prompt += `\n\n注意: 视频标题是"${videoTitle}"，请围绕该主题展开知识结构。`;
        }
      }

      try {
        const aiResp = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 8192,
            response_format: { type: "json_object" },
          }),
        });
        
        if (aiResp.ok) {
          const aiData = await aiResp.json();
          let content = aiData.choices?.[0]?.message?.content;
          if (content) {
            // 清理 markdown 代码块包裹（DeepSeek 有时会包 ```json ... ```）
            try {
              const parsed = safeParseAIJson(content);
              const rawNodes = parsed.nodes || [];
              knowledgeNodes = sanitizeNodes(flattenNodes(rawNodes, finalCourseId), isEnglishCourse);
            } catch (parseErr) {
              console.error("[Extract] JSON parse failed:", String(parseErr).slice(0, 200));
              console.error("[Extract] Raw content:", content.slice(0, 500));
            }
          }
        }
      } catch (e) {
        console.error("[Extract] AI failed:", e);
      }
    }

    // ============================================================
    // Step 3: Fallback if AI failed
    // ============================================================
    if (knowledgeNodes.length === 0) {
      knowledgeNodes = generateFallbackNodes(courseName, videoTitle, finalCourseId, transcriptText);
    }

    return NextResponse.json({
      success: true,
      course: {
        id: finalCourseId,
        name: courseName,
        description: `从${transcriptText ? "视频字幕" : "AI知识库"}提取的「${courseName}」知识体系`,
        icon: "BookOpen",
        color: "bg-blue-500",
        knowledgeNodes,
      },
      sourceMeta: {
        source: transcriptText ? "video-transcript" : "ai-generated",
        hasTranscript: !!transcriptText,
        subjectCategory,
        guardrail: isEnglishCourse ? "cet-english-only" : "subject-only",
        extractedAt: new Date().toISOString(),
      },
      nodeCount: knowledgeNodes.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "知识提取失败", detail: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}

function sanitizeNodes(nodes: any[], englishOnly: boolean): any[] {
  if (!englishOnly) return nodes;
  const blocked = /python|java|c\+\+|javascript|typescript|算法|数据结构|编程|代码|前端|后端|机器学习|神经网络|数据库|物理|力学|金融|投资|化学|生物/i;
  // 放宽匹配：只要不是被屏蔽的内容就保留，让 AI prompt 的质量来控制
  return nodes.filter((node) => {
    const text = `${node.title || ""} ${node.description || ""}`;
    return !blocked.test(text);
  });
}

function flattenNodes(nodes: any[], parentId: string): any[] {
  const result: any[] = [];
  for (const n of (nodes || [])) {
    const id = `${parentId}-n${result.length}`;
    result.push({
      id,
      parentId: n.parentTitle ? null : null,
      title: n.title || "",
      description: n.description || "",
      orderIndex: n.orderIndex ?? result.length,
    });
    if (n.children?.length > 0) {
      const childResult = flattenNodes(n.children, id);
      for (const c of childResult) {
        c.parentId = id;
        result.push(c);
      }
    }
  }
  return result;
}

function generateFallbackNodes(courseName: string, videoTitle: string, cid: string, transcript: string): any[] {
  const nodes: any[] = [];
  const isEnglishCourse = classifySubject(courseName) === "language" && /英语|英文|cet|四级|六级/i.test(courseName);

  if (isEnglishCourse) {
    const topics = [
      ["听力短对话与长对话", "训练关键词预判、转折信号、同义替换和数字时间信息捕捉，重点解决听懂但选不对的问题。"],
      ["新闻听力与篇章听力", "围绕四六级常见新闻、讲座和说明文材料，练习主旨题、细节题、推断题和态度题。"],
      ["选词填空", "掌握词性判断、上下文搭配、固定短语和逻辑连接，先判断空格语法功能再筛选词义。"],
      ["段落匹配", "训练快速定位、关键词改写、段落主旨归纳和干扰信息排除，适合限时刷题。"],
      ["仔细阅读", "覆盖主旨题、细节题、推断题、词义题和作者态度题，强调原文定位和同义替换。"],
      ["长难句拆解", "通过主干提取、从句识别、插入语处理和逻辑关系判断，提升阅读理解速度。"],
      ["四级写作框架", "训练现象解释、观点论证、问题解决和图表作文结构，形成可复用开头、主体和结尾。"],
      ["段落翻译", "围绕中国文化、社会发展、教育科技等主题，训练意群切分、句式转换和关键词表达。"],
      ["核心词汇与同义替换", "积累四六级高频词、熟词僻义、近义词替换和固定搭配，用于阅读和听力定位。"],
      ["错因复盘", "按定位失败、同义替换失败、语法误判、词汇不熟和时间失控归因，生成下一轮训练任务。"],
    ];
    return topics.map(([title, description], index) => ({
      id: `${cid}-eng-${index}`,
      parentId: null,
      title,
      description: `「${courseName}」${description}`,
      orderIndex: index,
    }));
  }
  
  if (transcript && transcript.length > 100) {
    // Split transcript by paragraphs and create nodes
    const paragraphs = transcript.split(/\n{2,}/).filter(p => p.trim().length > 30);
    const chapters: string[] = [];
    const details: string[] = [];
    
    for (const p of paragraphs.slice(0, 30)) {
      if (p.length < 80 || /^[一二三四五六七八九十]/.test(p) || /第[一二三]/.test(p)) {
        chapters.push(p);
      } else {
        details.push(p);
      }
    }
    
    // Create chapter nodes
    for (let i = 0; i < Math.min(chapters.length, 8); i++) {
      const id = `${cid}-c${i}`;
      nodes.push({ id, parentId: null, title: chapters[i].slice(0, 60), description: chapters[i].slice(0, 200), orderIndex: i });
    }
    
    // Create detail nodes under chapters
    for (let i = 0; i < Math.min(details.length, 20); i++) {
      const parentIdx = i % Math.max(1, chapters.length);
      const id = `${cid}-d${i}`;
      nodes.push({
        id,
        parentId: chapters.length > 0 ? `${cid}-c${parentIdx}` : null,
        title: details[i].slice(0, 60) + (details[i].length > 60 ? "..." : ""),
        description: details[i].slice(0, 300),
        orderIndex: i,
      });
    }
  }
  
  if (nodes.length === 0) {
    // Ultimate fallback: generate based on course name
    const topics = [
      `${courseName}基础概念与框架`, `${courseName}核心知识点`, 
      `${courseName}重点难点解析`, `${courseName}实战应用`,
      `${courseName}常见误区与纠正`, `${courseName}进阶提升技巧`,
    ];
    for (let i = 0; i < topics.length; i++) {
      nodes.push({
        id: `${cid}-f${i}`,
        parentId: null,
        title: topics[i],
        description: `「${courseName}」${topics[i].replace(courseName, "")}的详细讲解`,
        orderIndex: i,
      });
    }
  }
  
  return nodes;
}
