/**
 * LearnOS 知识管道核心
 * 统一多源知识的接入、合并、持久化
 * 
 * 数据来源：
 *   - manual: 手动添加 / AI预置
 *   - web-search: Hermes 全网搜索
 *   - video: 视频链接→字幕→AI提取
 *   - document: 文档/PDF 解析
 */

import type { KnowledgeNode, CourseData } from "@/lib/knowledge-loader";
import { getAllCourses, getCourseById } from "@/lib/knowledge-loader";
import knowledgeBaseData from "@/data/knowledge_base.json";

export type KnowledgeSource = "manual" | "web-search" | "video" | "document";

export interface KnowledgeSourceMeta {
  source: KnowledgeSource;
  url?: string;          // video URL or web page URL
  searchQuery?: string;  // web search query
  extractedAt: string;   // ISO timestamp
  confidence?: number;   // AI confidence score (0-1)
}

export interface KnowledgeExtractResult {
  courseId: string;
  courseName: string;
  courseDescription: string;
  courseIcon: string;
  courseColor: string;
  nodes: (KnowledgeNode & { sourceMeta?: KnowledgeSourceMeta })[];
  sourceMeta: KnowledgeSourceMeta;
}

// ============================================================
// AI Prompt Templates
// ============================================================

/**
 * 视频字幕 → 知识节点提取 Prompt
 */
export function buildVideoToKnowledgePrompt(
  videoTitle: string,
  transcript: string,
  courseName: string
): string {
  return `你是一个教育内容结构化专家。请从以下视频字幕中提取关键知识点，组织成层级知识树。

视频标题: ${videoTitle}
目标课程: ${courseName}

字幕内容:
"""
${transcript.slice(0, 8000)}
"""

请输出 JSON 格式（不要包含 markdown 代码块标记）:
{
  "nodes": [
    {
      "title": "知识点名称",
      "description": "50-200字的详细解释",
      "parentTitle": "父节点名称（如果是根节点则为null）",
      "orderIndex": 0
    }
  ]
}

要求:
1. 提取 3-15 个独立知识点
2. 组织成 2-3 层的树状结构
3. 每个知识点写出清晰的中文描述
4. 根节点是大的主题分类，叶子节点是具体概念
5. 确保知识点之间有逻辑层级关系`;
}

/**
 * 全网搜索 → 课程大纲提取 Prompt
 */
export function buildWebSearchToSyllabusPrompt(
  courseName: string,
  searchResults: string
): string {
  return `你是一个课程设计专家。请根据以下搜索结果，为"${courseName}"设计完整的知识体系。

搜索结果摘要:
"""
${searchResults.slice(0, 6000)}
"""

请输出 JSON:
{
  "courseDescription": "课程的一句话描述",
  "nodes": [
    {
      "title": "章节/模块名称",
      "description": "该模块的简要说明",
      "parentTitle": null,
      "orderIndex": 0,
      "children": [
        {
          "title": "具体知识点",
          "description": "知识点的详细说明",
          "orderIndex": 0
        }
      ]
    }
  ]
}

要求:
1. 覆盖该课程的主要知识模块（4-8个模块）
2. 每个模块下细分 3-6 个具体知识点
3. 知识点层次清晰，从宏观到微观`;
}

// ============================================================
// Bilibili 视频字幕提取
// ============================================================

/**
 * 从 Bilibili BV 号提取字幕
 * API 流程: BV号 → cid → 字幕列表 → 字幕内容
 */
export async function extractBilibiliTranscript(bvid: string): Promise<{
  title: string;
  transcript: string;
  duration: number;
}> {
  try {
    // Step 1: 获取 cid 和视频信息
    const infoUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
    const infoRes = await fetch(infoUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://www.bilibili.com",
      },
    });
    const infoData = await infoRes.json();
    
    if (infoData.code !== 0) {
      throw new Error(`Bilibili API error: ${infoData.message}`);
    }
    
    const cid = infoData.data.cid;
    const title = infoData.data.title;
    const duration = infoData.data.duration;
    
    // Step 2: 获取字幕列表
    const subtitleUrl = `https://api.bilibili.com/x/player/v2?bvid=${bvid}&cid=${cid}`;
    const subRes = await fetch(subtitleUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://www.bilibili.com",
      },
    });
    const subData = await subRes.json();
    
    const subtitleList = subData.data?.subtitle?.subtitles;
    if (!subtitleList || subtitleList.length === 0) {
      throw new Error("该视频没有字幕");
    }
    
    // Step 3: 获取字幕内容 (优先中文)
    const zhSub = subtitleList.find((s: any) => 
      s.lan_doc?.includes("中文") || s.lan === "zh-Hans"
    ) || subtitleList[0];
    
    const subContentUrl = zhSub.subtitle_url;
    const fullUrl = subContentUrl.startsWith("http") 
      ? subContentUrl 
      : `https:${subContentUrl}`;
    
    const contentRes = await fetch(fullUrl);
    const subtitles = await contentRes.json();
    
    // Step 4: 合并字幕文本
    const transcript = subtitles.body
      .map((item: any) => item.content)
      .join("\n");
    
    return { title, transcript, duration };
  } catch (error) {
    throw new Error(
      `Bilibili 字幕提取失败: ${error instanceof Error ? error.message : "未知错误"}`
    );
  }
}

/**
 * 尝试提取 YouTube 字幕 (使用公开 API)
 * 注意：中国大陆可能需要代理
 */

/**
 * 获取 Bilibili 视频元数据（标题、描述、标签）
 * 当视频没有字幕时作为兜底
 */
export async function extractBilibiliMetadata(bvid: string): Promise<{
  title: string;
  description: string;
  tags: string[];
}> {
  const infoUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
  const resp = await fetch(infoUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Referer": "https://www.bilibili.com",
    },
  });
  const data = await resp.json();
  
  if (data.code !== 0) {
    throw new Error(`Bilibili API error: ${data.message}`);
  }
  
  return {
    title: data.data.title,
    description: data.data.desc || "暂无描述",
    tags: (data.data.tags || []).map((t: any) => t.tag_name || t),
  };
}

export async function extractYouTubeTranscript(videoId: string): Promise<{
  title: string;
  transcript: string;
}> {
  try {
    // 使用 youtube-transcript 的 HTTP API 替代方案
    // 直接访问 YouTube 的 timedtext API
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const pageRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "zh-CN,zh;q=0.9",
      },
    });
    const html = await pageRes.text();
    
    // 提取标题
    const titleMatch = html.match(/<title>([^<]*)<\/title>/);
    const title = titleMatch 
      ? titleMatch[1].replace(" - YouTube", "").trim() 
      : videoId;
    
    // 提取 captions 数据
    const captionsMatch = html.match(/"captions":\{"playerCaptionsTracklistRenderer":(.*?)\}\}/);
    if (!captionsMatch) {
      throw new Error("该视频没有字幕或需要代理访问");
    }
    
    // 解析 JSON（YouTube 的格式很复杂，尽力提取）
    const captionsData = captionsMatch[0];
    const baseUrlMatch = captionsData.match(/"baseUrl":"([^"]+)"/);
    if (!baseUrlMatch) {
      throw new Error("无法获取字幕 URL");
    }
    
    const baseUrl = baseUrlMatch[1].replace(/\\u0026/g, "&");
    const transcriptRes = await fetch(baseUrl);
    const transcriptXml = await transcriptRes.text();
    
    // 简单解析 XML 字幕
    const textMatches = transcriptXml.matchAll(/<text[^>]*>([^<]*)<\/text>/g);
    const lines: string[] = [];
    for (const match of textMatches) {
      const text = match[1]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
      if (text) lines.push(text);
    }
    
    return { title, transcript: lines.join("\n") };
  } catch (error) {
    throw new Error(
      `YouTube 字幕提取失败: ${error instanceof Error ? error.message : "未知错误"}\n提示：中国大陆用户可能需要使用代理`
    );
  }
}

// ============================================================
// 视频 URL 解析
// ============================================================

export function parseVideoUrl(url: string): {
  platform: "bilibili" | "youtube" | "unknown";
  videoId: string;
  needsResolve?: boolean;  // true if short link needs resolution
} {
  // Clean the URL: extract actual URL from app-share format like "【标题】 https://b23.tv/xxx"
  const urlMatch = url.match(/https?:\/\/[^\s】)]+/);
  const cleanUrl = urlMatch ? urlMatch[0] : url;
  
  // Bilibili short links: https://b23.tv/xxxxx or b23.tv/xxxxx
  const biliShortMatch = cleanUrl.match(/b23\.tv\/([a-zA-Z0-9]+)/);
  if (biliShortMatch) {
    return { platform: "bilibili", videoId: biliShortMatch[1], needsResolve: true };
  }
  
  // Bilibili full links: https://www.bilibili.com/video/BV1xx411c7mD
  const biliMatch = cleanUrl.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
  if (biliMatch) {
    return { platform: "bilibili", videoId: biliMatch[1] };
  }
  
  // Bilibili bangumi (番剧) or other formats
  const biliBVMatch = cleanUrl.match(/bilibili\.com\/bangumi\/play\/([a-zA-Z0-9]+)/);
  if (biliBVMatch) {
    return { platform: "bilibili", videoId: biliBVMatch[1] };
  }
  
  // YouTube: https://www.youtube.com/watch?v=xxxxx or youtu.be/xxxxx
  const ytMatch = cleanUrl.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    return { platform: "youtube", videoId: ytMatch[1] };
  }
  
  return { platform: "unknown", videoId: "" };
}

/**
 * Resolve b23.tv short link to full Bilibili video URL
 */
export async function resolveB23ShortLink(shortId: string): Promise<string> {
  try {
    const url = `https://b23.tv/${shortId}`;
    
    // Method 1: HEAD request with redirect following disabled
    const resp = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    
    // Check redirect location (302/301)
    const location = resp.headers.get("location") || "";
    if (location) {
      const bvMatch = location.match(/\/video\/(BV[a-zA-Z0-9]+)/);
      if (bvMatch) return bvMatch[1];
    }
    
    // Method 2: Read response body for BV ID
    const body = await resp.text();
    const bvInBody = body.match(/BV[a-zA-Z0-9]{10}/);
    if (bvInBody) return bvInBody[0];
    
    // Method 3: Try the b23.tv API redirect
    const resp2 = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    const finalUrl = resp2.url;
    const bvInFinal = finalUrl.match(/BV[a-zA-Z0-9]+/);
    if (bvInFinal) return bvInFinal[0];
    
    throw new Error("无法从短链接提取BV号");
  } catch (error: any) {
    if (error.message?.includes("BV")) throw error;
    throw new Error("b23.tv 短链接解析失败，请直接粘贴完整 Bilibili 链接（如 bilibili.com/video/BVxxxxxx）");
  }
}

// ============================================================
// 通用视频→知识提取流程
// ============================================================

export async function extractKnowledgeFromVideo(
  videoUrl: string,
  courseName: string,
  courseId: string
): Promise<KnowledgeExtractResult> {
  const parseResult = parseVideoUrl(videoUrl);
  const { platform, videoId } = parseResult;
  
  if (platform === "unknown") {
    throw new Error("不支持的视频链接格式。请粘贴 Bilibili (包括b23.tv短链接) 或 YouTube 链接。直接复制APP分享链接即可。");
  }
  
  // Resolve short links
  if (platform === "bilibili" && parseResult.needsResolve) {
    try {
      const resolvedId = await resolveB23ShortLink(videoId);
      return await extractKnowledgeFromVideo(`https://www.bilibili.com/video/${resolvedId}`, courseName, courseId);
    } catch (e) {
      throw new Error('b23.tv短链接无法解析。请直接在APP中点击「复制链接」后粘贴完整链接。');
    }
  }
  
  // Step 1: 提取字幕
  let title: string;
  let transcript: string;
  
  if (platform === "bilibili") {
    try {
      const biliResult = await extractBilibiliTranscript(videoId);
      title = biliResult.title;
      transcript = biliResult.transcript;
    } catch (e) {
      // Fallback: use video title and description as knowledge source
      console.warn("[Pipeline] No subtitles, using video metadata as fallback");
      const meta = await extractBilibiliMetadata(videoId);
      title = meta.title;
      transcript = `视频标题：${meta.title}\n视频描述：${meta.description}\n关键词：${meta.tags.join('、')}`;
    }
  } else {
    const ytResult = await extractYouTubeTranscript(videoId);
    title = ytResult.title;
    transcript = ytResult.transcript;
  }
  
  if (!transcript || transcript.length < 20) {
    throw new Error("无法获取足够的视频内容。建议手动粘贴字幕文本。");
  }
  
  // Step 2: AI 提取知识节点
  const prompt = buildVideoToKnowledgePrompt(title, transcript, courseName);
  const nodes = await callAIForKnowledgeExtraction(prompt);
  
  // Step 3: 构建结果
  return {
    courseId,
    courseName,
    courseDescription: `从视频"${title}"自动提取的知识点`,
    courseIcon: "Video",
    courseColor: "bg-pink-500",
    nodes,
    sourceMeta: {
      source: "video",
      url: videoUrl,
      extractedAt: new Date().toISOString(),
      confidence: 0.75,
    },
  };
}

// ============================================================
// AI 调用 (DeepSeek)
// ============================================================

async function callAIForKnowledgeExtraction(prompt: string): Promise<(KnowledgeNode & { sourceMeta?: KnowledgeSourceMeta })[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
  
  if (!apiKey) {
    // 本地降级：返回基于规则提取的占位节点
    console.warn("[KnowledgePipeline] DEEPSEEK_API_KEY 未配置，使用规则提取");
    return extractByRules(prompt);
  }
  
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "你是一个教育内容结构化专家。只输出 JSON，不要任何额外文字。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI 返回空内容");
    
    const parsed = JSON.parse(content);
    return normalizeNodes(parsed.nodes || []);
  } catch (error) {
    console.error("[KnowledgePipeline] AI extraction failed:", error);
    // Fallback: rule-based extraction
    return extractByRules(prompt);
  }
}

// ============================================================
// 规则降级提取（无 AI 时）
// ============================================================

function extractByRules(prompt: string): KnowledgeNode[] {
  // 尝试从 prompt 中提取视频标题
  const titleMatch = prompt.match(/视频标题: (.+)/);
  const title = titleMatch ? titleMatch[1] : "未命名视频";
  
  // 从字幕文本中按段落拆分，每段作为一个知识点
  const transcriptMatch = prompt.match(/字幕内容:\s*"""\s*([\s\S]*?)\s*"""/);
  const transcript = transcriptMatch ? transcriptMatch[1] : "";
  
  const paragraphs = transcript
    .split(/\n{2,}/)
    .filter((p) => p.trim().length > 20)
    .slice(0, 10);
  
  if (paragraphs.length === 0) {
    return [{
      id: `node-${Date.now()}`,
      parentId: null,
      title: title,
      description: "请配置 AI API Key 以启用智能知识点提取",
      orderIndex: 0,
    }];
  }
  
  const rootNode: KnowledgeNode = {
    id: `root-${Date.now()}`,
    parentId: null,
    title: title,
    description: `从视频自动提取，共 ${paragraphs.length} 个知识点`,
    orderIndex: 0,
  };
  
  const children = paragraphs.map((p, i) => ({
    id: `node-${Date.now()}-${i}`,
    parentId: rootNode.id,
    title: p.slice(0, 40) + (p.length > 40 ? "..." : ""),
    description: p.slice(0, 200),
    orderIndex: i,
  }));
  
  return [rootNode, ...children];
}

function normalizeNodes(rawNodes: any[]): KnowledgeNode[] {
  return rawNodes.map((n, i) => ({
    id: `ai-${Date.now()}-${i}`,
    parentId: n.parentId || null,
    title: n.title || `知识点 ${i + 1}`,
    description: n.description || "",
    orderIndex: n.orderIndex ?? i,
  }));
}

// ============================================================
// 知识合并
// ============================================================

/**
 * 将提取的知识合并到现有知识库
 */
export function mergeKnowledge(
  existing: CourseData,
  extracted: KnowledgeExtractResult
): CourseData {
  const existingTitles = new Set(
    existing.knowledgeNodes.map((n) => n.title)
  );
  
  // 去重：只添加新节点
  const newNodes = extracted.nodes.filter(
    (n) => !existingTitles.has(n.title)
  );
  
  return {
    ...existing,
    knowledgeNodes: [...existing.knowledgeNodes, ...newNodes],
  };
}
