import { NextRequest, NextResponse } from "next/server";

const WRITING_TOPICS: Record<string, string[]> = {
  cet4: [
    "Directions: Suppose your university is organizing a campaign to promote environmental awareness on campus. You are to write a proposal for the campaign, explaining its purpose, planned activities, and expected outcomes. You should write at least 120 words but no more than 180 words.",
    "Directions: Suppose you are invited to give a speech at the opening ceremony of your university's English Culture Festival. Write a speech about the role of cultural exchange in today's world. You should write at least 120 words but no more than 180 words.",
  ],
  cet6: [
    "Directions: For this part, you are allowed 30 minutes to write an essay on the importance of critical thinking in the information age. You should explain why critical thinking is essential and how to develop this skill. Write at least 150 words but no more than 200 words.",
    "Directions: For this part, you are allowed 30 minutes to write an essay on balancing academic pursuits with extracurricular activities. Discuss the benefits of both and suggest how to strike a balance. Write at least 150 words but no more than 200 words.",
  ],
};

// 翻译 fallback（已加长到四六级标准长度：4-5行中文）
const TRANS_TOPICS: Record<string, { cn: string; en: string }[]> = {
  cet4: [
    { cn: "太极拳（Tai Chi）起源于中国古代，是一种集健身、防身和修身于一体的传统武术。它的动作缓慢柔和，强调以柔克刚、以静制动，适合各年龄段人群练习。如今，太极拳已传播到世界各地，深受各国人民喜爱，成为中国文化的重要符号之一。练习太极拳不仅能增强体质、提高身体柔韧性，还能帮助人们减轻压力、保持内心平静，对现代人的身心健康有着独特的价值。许多研究表明，长期坚持练习太极拳可以改善心血管功能、增强平衡能力，甚至有助于延缓衰老。", en: "Tai Chi, originating from ancient China, is a traditional martial art integrating physical fitness, self-defense, and self-cultivation. Its slow and gentle movements emphasize overcoming hardness with softness and achieving stillness in motion, making it suitable for people of all ages. Today, it has spread worldwide and become an important symbol of Chinese culture. Practicing Tai Chi not only strengthens the body and improves flexibility, but also helps people reduce stress and maintain inner peace, offering unique benefits for both physical and mental well-being. Many studies have shown that regular Tai Chi practice can improve cardiovascular function, enhance balance, and even help delay aging." },
    { cn: "中国结（Chinese knot）是中国传统手工艺品，已有数千年历史。它由一根丝线编织而成，造型优美、结构对称，每一个结都寓意吉祥。最初用于记录事件和传递信息，后逐渐演变为装饰品和礼物，成为中国传统文化的重要象征。春节期间，人们常在家中悬挂中国结，象征团圆、幸福和好运。如今，中国结已成为深受国内外游客喜爱的纪念品，其精湛的工艺和丰富的文化内涵展现了中国人民的智慧和审美追求。", en: "The Chinese knot is a traditional Chinese handicraft with thousands of years of history. Woven from a single silk thread, it features elegant shapes and symmetrical structures, with each knot carrying auspicious meanings. Originally used to record events and convey information, it gradually evolved into decorations and gifts, becoming an important symbol of traditional Chinese culture. During the Spring Festival, people hang Chinese knots in their homes to symbolize reunion, happiness, and good fortune. Today, Chinese knots have become popular souvenirs among tourists both at home and abroad, with their exquisite craftsmanship and rich cultural connotations reflecting the wisdom and aesthetic pursuit of the Chinese people." },
  ],
  cet6: [
    { cn: "丝绸之路是古代连接中国与地中海地区的贸易通道网络，因丝绸贸易而得名。它不仅促进了沿线国家的商品交换，还推动了东西方在文化、宗教、科技等领域的深入交流，对世界文明的发展产生了深远影响。2013年，中国提出了'一带一路'倡议，旨在复兴古丝绸之路的开放包容精神，通过基础设施互联互通促进沿线国家的经济合作与文化交流。这一倡议已得到众多国家的积极响应，成为推动全球共同发展的重要平台。", en: "The Silk Road was an ancient network of trade routes connecting China with the Mediterranean region, named after the lucrative silk trade. It not only facilitated the exchange of goods among countries along the route, but also promoted in-depth exchanges between the East and West in culture, religion, science, and technology, exerting a profound influence on the development of world civilization. In 2013, China proposed the Belt and Road Initiative, aiming to revive the open and inclusive spirit of the ancient Silk Road and promote economic cooperation and cultural exchanges among participating countries through infrastructure connectivity. This initiative has received positive responses from numerous countries and has become an important platform for promoting global common development." },
    { cn: "粤港澳大湾区是中国经济最具活力的区域之一，涵盖广东省广州、深圳、珠海等九个城市以及香港和澳门两个特别行政区。大湾区拥有世界级的港口群、机场群和产业集群，是中国参与全球竞争的重要空间载体。自规划建设以来，大湾区在科技创新、金融服务、高端制造等领域取得了显著进展，港珠澳大桥等重大基础设施的建成进一步促进了区域一体化发展。中央政府致力于将大湾区建设成为具有全球影响力的国际科技创新中心，打造高质量发展的典范。", en: "The Guangdong-Hong Kong-Macao Greater Bay Area is one of China's most dynamic economic regions, covering nine cities in Guangdong Province including Guangzhou, Shenzhen, and Zhuhai, as well as the two special administrative regions of Hong Kong and Macao. The Greater Bay Area boasts world-class port clusters, airport clusters, and industrial clusters, serving as an important spatial vehicle for China's participation in global competition. Since its planning and construction, the area has made remarkable progress in technological innovation, financial services, and high-end manufacturing, with major infrastructure such as the Hong Kong-Zhuhai-Macao Bridge further promoting regional integration. The central government is committed to building the Greater Bay Area into an international technology innovation center with global influence, creating a model of high-quality development." },
  ],
};

/** AI 生成翻译题（四六级标准：4-5行中文段落） */
async function generateTranslation(key: string, baseUrl: string, level: string, timeout: number): Promise<{ cn: string; en: string } | null> {
  const prompt = `你是${level === "cet6" ? "CET-6" : "CET-4"}翻译命题专家。请生成一道汉译英题目。

要求：
- 中文段落4-5行（约120-180个汉字），与四六级真题长度一致
- 话题从以下随机选：中国传统文化、中国经济社会发展、中国科技创新、中国教育改革、中国环境保护
- 提供参考英文译文
- 难度适合${level === "cet6" ? "六级" : "四级"}水平

输出JSON:
{"cn":"4-5行中文段落","en":"参考英文译文"}`;

  try {
    const result = await aiCall(key, baseUrl, prompt, 1500, timeout);
    if (result?.cn && result?.en && result.cn.length > 60) return result;
  } catch {}
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { level, real, writing: realWriting, translation: realTrans, difficulty } = await req.json();
    const diff = difficulty || "mixed";
    const isCet4 = level === "cet4";
    const key = process.env.DEEPSEEK_API_KEY;
    const base = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
    const sections: Record<string, any> = {};
    const TO = 30000;  // 30秒超时，给AI足够时间生成

    // --- 写作 ---
    const wTopic = realWriting || WRITING_TOPICS[isCet4 ? "cet4" : "cet6"][Math.floor(Math.random() * 2)];
    sections.writing = { prompt: wTopic, timeLimit: 30 * 60, score: 106, userAnswer: "" };

    // --- 听力: Section A(2+2+3=7) + B(4+4=8) + C(3+3+4=10) = 25题 ---
    // 真题格式：每个对话/段落共享一段长音频脚本
    // 全部并行调用（不依赖彼此），然后用 try-catch 逐个兜底
    const [la1, la2, la3, lb1, lb2, lc1, lc2, lc3] = await Promise.all([
      generateListeningGroup(key, base, "新闻听力", "News Report 1", 2, 200, TO).catch(() => fallbackListeningGroup("新闻听力", 2)),
      generateListeningGroup(key, base, "新闻听力", "News Report 2", 2, 200, TO).catch(() => fallbackListeningGroup("新闻听力", 2)),
      generateListeningGroup(key, base, "新闻听力", "News Report 3", 3, 250, TO).catch(() => fallbackListeningGroup("新闻听力", 3)),
      generateListeningGroup(key, base, "长对话", "Conversation 1", 4, 350, TO).catch(() => fallbackListeningGroup("长对话", 4)),
      generateListeningGroup(key, base, "长对话", "Conversation 2", 4, 350, TO).catch(() => fallbackListeningGroup("长对话", 4)),
      generateListeningGroup(key, base, "短文理解", "Passage 1", 3, 280, TO).catch(() => fallbackListeningGroup("短文理解", 3)),
      generateListeningGroup(key, base, "短文理解", "Passage 2", 3, 280, TO).catch(() => fallbackListeningGroup("短文理解", 3)),
      generateListeningGroup(key, base, "短文理解", "Passage 3", 4, 300, TO).catch(() => fallbackListeningGroup("短文理解", 4)),
    ]);

    sections.listening = {
      timeLimit: 25 * 60,
      sections: {
        A: { label: "Section A · 新闻听力", direction: "Directions: In this section, you will hear three news reports. At the end of each news report, you will hear two or three questions. Both the news report and the questions will be spoken only once. After you hear a question, you must choose the best answer from the four choices marked A, B, C and D.", groups: [
          { label: "News Report 1 (Questions 1-2)", audioScript: la1.audioScript, questions: la1.questions.map((q:any,i:number)=>({...q,id:`a1_${i}`,score:7,userAnswer:""})) },
          { label: "News Report 2 (Questions 3-4)", audioScript: la2.audioScript, questions: la2.questions.map((q:any,i:number)=>({...q,id:`a2_${i}`,score:7,userAnswer:""})) },
          { label: "News Report 3 (Questions 5-7)", audioScript: la3.audioScript, questions: la3.questions.map((q:any,i:number)=>({...q,id:`a3_${i}`,score:7,userAnswer:""})) },
        ]},
        B: { label: "Section B · 长对话", direction: "Directions: In this section, you will hear two long conversations. At the end of each conversation, you will hear four questions. Both the conversation and the questions will be spoken only once. After you hear a question, you must choose the best answer from the four choices marked A, B, C and D.", groups: [
          { label: "Conversation 1 (Questions 8-11)", audioScript: lb1.audioScript, questions: lb1.questions.map((q:any,i:number)=>({...q,id:`b1_${i}`,score:7,userAnswer:""})) },
          { label: "Conversation 2 (Questions 12-15)", audioScript: lb2.audioScript, questions: lb2.questions.map((q:any,i:number)=>({...q,id:`b2_${i}`,score:7,userAnswer:""})) },
        ]},
        C: { label: "Section C · 短文理解", direction: "Directions: In this section, you will hear three short passages. At the end of each passage, you will hear some questions. Both the passage and the questions will be spoken only once. After you hear a question, you must choose the best answer from the four choices marked A, B, C and D.", groups: [
          { label: "Passage 1 (Questions 16-18)", audioScript: lc1.audioScript, questions: lc1.questions.map((q:any,i:number)=>({...q,id:`c1_${i}`,score:7,userAnswer:""})) },
          { label: "Passage 2 (Questions 19-21)", audioScript: lc2.audioScript, questions: lc2.questions.map((q:any,i:number)=>({...q,id:`c2_${i}`,score:7,userAnswer:""})) },
          { label: "Passage 3 (Questions 22-25)", audioScript: lc3.audioScript, questions: lc3.questions.map((q:any,i:number)=>({...q,id:`c3_${i}`,score:7,userAnswer:""})) },
        ]},
      },
    };

    // --- 阅读: 选词填空 ---
    let cloze: any = null;
    try { cloze = key ? await aiCall(key, base, `${isCet4?"CET-4":"CET-6"}选词填空。200-250词文章，10空标___，15备选词A-O。JSON:{"passage":"文章","wordBank":["A.","B.",..."O."],"answers":[{"blank":26,"correctLetter":"A"}]}`, 1500, TO) : null; } catch {}

    sections.cloze = {
      timeLimit: 15 * 60,
      passage: cloze?.passage || "The rapid development of technology has ___ the way people communicate. Social media platforms have become an ___ part of daily life...",
      wordBank: cloze?.wordBank || ["A. transformed","B. essential","C. maintain","D. access","E. decline","F. significant","G. impact","H. surveyed","I. conducted","J. phenomenon","K. typically","L. acquired","M. conveyed","N. isolated","O. virtually"],
      answers: cloze?.answers || [],
      userAnswers: {},
    };

    // --- 阅读: 段落匹配 ---
    let match: any = null;
    try { match = key ? await aiCall(key, base, `${isCet4?"CET-4":"CET-6"}段落匹配。A-K共11段各80-120词，10题。JSON:{"passage":"A.\\nB.\\n...K.","paragraphs":["A"-"K"],"questions":[{"text":"题干","correctParagraph":"A"}]}`, 2500, TO) : null; } catch {}

    sections.matching = {
      timeLimit: 15 * 60,
      passage: match?.passage || "",
      paragraphs: match?.paragraphs || ["A","B","C","D","E","F","G","H","I","J","K"],
      questions: (match?.questions || []).map((q: any, i: number) => ({ id: `ma${i}`, ...q, score: 7, userAnswer: "" })),
    };

    // --- 阅读: 仔细阅读 (2篇) ---
    let r1: any = null; let r2: any = null;
    try { r1 = key ? await generateArticle(key, base, TO) : null; } catch {}
    try { r2 = key ? await generateArticle(key, base, TO) : null; } catch {}
    sections.reading = {
      timeLimit: 25 * 60,
      articles: [
        { passage: r1?.passage || "", questions: (r1?.questions || []).map((q: any, i: number) => ({ id: `r1_${i}`, ...q, score: 14, userAnswer: "" })) },
        { passage: r2?.passage || "", questions: (r2?.questions || []).map((q: any, i: number) => ({ id: `r2_${i}`, ...q, score: 14, userAnswer: "" })) },
      ],
    };

    // --- 翻译 ---
    if (realTrans) {
      sections.translation = { prompt: realTrans.cn || realTrans, reference: realTrans.en || "", timeLimit: 30 * 60, score: 106, userAnswer: "" };
    } else {
      let transPrompt: any = null;
      try { transPrompt = key ? await generateTranslation(key, base, isCet4 ? "cet4" : "cet6", TO) : null; } catch {}
      if (transPrompt) {
        sections.translation = { prompt: transPrompt.cn, reference: transPrompt.en, timeLimit: 30 * 60, score: 106, userAnswer: "" };
      } else {
        const trans = TRANS_TOPICS[isCet4 ? "cet4" : "cet6"][Math.floor(Math.random() * 2)];
        sections.translation = { prompt: trans.cn, reference: trans.en, timeLimit: 30 * 60, score: 106, userAnswer: "" };
      }
    }

    return NextResponse.json({ success: true, level, sections });
  } catch { return NextResponse.json({ error: "生成失败" }, { status: 500 }); }
}

async function aiCall(key: string, baseUrl: string, prompt: string, maxTokens: number, timeout: number): Promise<any> {
  const r = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "deepseek-chat", temperature: 0.7, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } }),
    signal: AbortSignal.timeout(timeout),
  });
  if (!r.ok) return null;
  const d = await r.json();
  try { return JSON.parse((d.choices?.[0]?.message?.content || "").replace(/```json\s*/gi, "").replace(/```\s*/g, "")); } catch { return null; }
}

async function batchMCQ(key: string | undefined, baseUrl: string, count: number, label: string, timeout: number): Promise<any[]> {
  // 此函数不再用于听力生成，保留用于兼容
  const prompt = `CET-4/6${label}命题。1道英文选择题。输出JSON:{"question":"题目","options":["A. ...","B. ...","C. ...","D. ..."],"correctIndex":0}`;
  const qs: any[] = [];
  for (let i = 0; i < count; i++) {
    if (key) {
      const q = await aiCall(key, baseUrl, prompt, 400, timeout);
      if (q?.question) { qs.push(q); continue; }
    }
    qs.push({ question: `${label} Q${i + 1}`, options: ["A.","B.","C.","D."], correctIndex: 0 });
  }
  return qs;
}

/** 听力组快速回退（AI调用失败时用，不阻塞生成） */
function fallbackListeningGroup(type: "新闻听力" | "长对话" | "短文理解", questionCount: number): { audioScript: string; questions: any[] } {
  const scripts: Record<string, string> = {
    "新闻听力": "In recent news, the international community has been focusing on environmental sustainability. Scientists report that climate change continues to affect global weather patterns, with increased frequency of extreme weather events. Governments worldwide are implementing new policies to reduce carbon emissions and promote renewable energy sources.",
    "长对话": "M: Have you heard about the new campus policy on sustainability?\nW: Yes, I think it's a great initiative. They're planning to reduce plastic waste and increase recycling facilities.\nM: I agree. I also heard they're adding more electric vehicle charging stations.\nW: That's wonderful. It shows the university is taking environmental issues seriously.",
    "短文理解": "The importance of time management cannot be overstated in today's fast-paced world. Effective time management allows individuals to accomplish more in less time, reduces stress, and creates a better work-life balance. Studies show that people who plan their day in advance are significantly more productive than those who do not.",
  };
  return {
    audioScript: scripts[type] || scripts["短文理解"],
    questions: Array.from({ length: questionCount }, (_, i) => ({
      question: `What is the main idea of this ${type === "新闻听力" ? "news report" : type === "长对话" ? "conversation" : "passage"}?`,
      options: ["A. Environmental issues", "B. Educational reform", "C. Technology advances", "D. Social changes"],
      correctIndex: i % 4,
    })),
  };
}

/** 生成一个听力组：共享一段长音频脚本 + 多道题（真题格式） */
async function generateListeningGroup(
  key: string | undefined, baseUrl: string,
  type: "新闻听力" | "长对话" | "短文理解",
  label: string, questionCount: number, minWords: number, timeout: number
): Promise<{ audioScript: string; questions: any[] }> {
  const typeLabel = type === "新闻听力" ? "news report" : type === "长对话" ? "long conversation (dialogue between M and W)" : "short passage (monologue)";
  const scriptType = type === "新闻听力" ? "a news report" : type === "长对话" ? "a conversation between a man (M) and a woman (W)" : "a short passage/monologue";

  const prompt = `You are a CET-4/6 listening test designer. Create ${scriptType} in English that would appear in the "${type}" section.

Requirements:
- Content: ${typeLabel}, at least ${minWords} words (about ${Math.round(minWords/150)}-${Math.round(minWords/130)} minutes when read aloud)
- Format: ${type === "长对话" ? 'Use "M: ..." and "W: ..." to label male and female speakers. Make it a natural, flowing conversation.' : type === "新闻听力" ? "Write in news broadcast style with clear structure (who, what, where, when, why)." : "Write in clear, well-organized paragraphs suitable for listening comprehension."}
- Topic: Choose a realistic CET-4/6 topic (education, technology, environment, health, culture, science, social issues, etc.)
- Then create ${questionCount} multiple-choice questions testing listening comprehension. Each question should have 4 options (A/B/C/D).
- Questions should test main ideas, specific details, and inferences — just like real CET exams.

Output JSON:
{
  "audioScript": "the full script (at least ${minWords} words)",
  "questions": [
    {"question": "What/Why/How/Which...?", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correctIndex": 0}
  ]
}`;

  if (!key) {
    // 无 API key 时的回退内容（长度接近真题）
    const fallbackScripts: Record<string, string> = {
      "新闻听力": `This is the latest news report. The global community is taking unprecedented steps to address the growing concerns over environmental sustainability and climate change. Scientists from over fifty countries gathered at the International Climate Summit in Geneva this week to discuss new findings on rising sea levels and extreme weather patterns. According to a major report released at the summit, coastal cities could face significant flooding risks within the next three decades if immediate action is not taken. The report highlights that carbon emissions have increased by fifteen percent over the past ten years, despite numerous international agreements aimed at reducing greenhouse gases. However, there is reason for cautious optimism. Renewable energy sources such as solar and wind power now account for nearly thirty percent of global electricity generation, up from just ten percent a decade ago. Several major economies have pledged to achieve carbon neutrality by the year twenty sixty. Experts at the summit emphasized that while government policies are essential, individual actions also play a crucial role in combating climate change. They urged citizens to adopt more sustainable lifestyles, including reducing waste, using public transportation, and supporting environmentally responsible businesses. The summit will continue through the end of the week, with delegates expected to finalize a new framework for international cooperation on environmental protection.`,
      "长对话": `M: Hey Sarah, have you started preparing for the final exams yet? I've been feeling pretty overwhelmed with all the material we need to cover.
W: I know exactly how you feel, Mike. I've been trying to organize my study schedule, but there's just so much content to review. I'm particularly worried about the statistics course.
M: Statistics is definitely challenging. Professor Wang said the exam will focus heavily on regression analysis and hypothesis testing. Have you considered joining a study group?
W: Actually, I haven't. Do you think it would help? I usually prefer studying alone, but maybe working with others could give me a different perspective on the material.
M: That's exactly why I joined one last semester. We meet twice a week at the library, and each person takes turns explaining different concepts. It really helped me understand the topics I was struggling with. Plus, explaining things to others reinforces your own understanding.
W: That makes sense. When does your group meet? I might give it a try this week.
M: We meet on Tuesdays and Thursdays from seven to nine in the evening. There are about six of us, and we're all preparing for the same exam. You're more than welcome to join us.
W: Thanks, Mike. I'll come this Tuesday then. Do I need to prepare anything in advance?
M: Just bring your notes and any questions you have. We usually start by going over the key concepts from the lecture, and then we work through practice problems together. It's pretty informal and everyone is really supportive.`,
      "短文理解": `The concept of lifelong learning has become increasingly important in today's rapidly changing world. Unlike previous generations who could rely on skills acquired during their formal education to sustain an entire career, modern workers must continually update their knowledge and abilities to remain competitive in the job market. Technological advances, particularly in artificial intelligence and automation, are transforming industries at an unprecedented pace. Jobs that existed twenty years ago have disappeared, while entirely new professions have emerged that were unimaginable just a decade ago. This shift has profound implications for education systems worldwide. Traditional models of education, which focus on front-loading knowledge during the early years of life, are being replaced by more flexible approaches that emphasize continuous skill development. Many companies now invest significantly in employee training programs, recognizing that their workforce's adaptability is crucial to long-term success. Online learning platforms have made education more accessible than ever, allowing people to acquire new skills from anywhere in the world at their own pace. However, the responsibility for lifelong learning ultimately lies with individuals themselves. Developing a growth mindset and cultivating curiosity are essential for navigating the uncertainties of the modern economy.`,
    };
    const fallback = fallbackScripts[type] || fallbackScripts["短文理解"];
    return {
      audioScript: fallback,
      questions: Array.from({ length: questionCount }, (_, i) => ({
        question: `According to the ${typeLabel}, what can be inferred about question ${i + 1}?`,
        options: ["A. It is clearly stated.", "B. It can be inferred.", "C. The opposite is true.", "D. Not mentioned."],
        correctIndex: 0,
      })),
    };
  }

  try {
    const result = await aiCall(key, baseUrl, prompt, 2500, timeout);
    if (result?.audioScript && result?.questions?.length > 0) {
      // 确保题数正确
      return {
        audioScript: result.audioScript,
        questions: result.questions.slice(0, questionCount).map((q: any, i: number) => ({
          ...q,
          question: q.question || `Question ${i + 1}`,
          options: q.options?.length === 4 ? q.options : ["A. Option A", "B. Option B", "C. Option C", "D. Option D"],
          correctIndex: typeof q.correctIndex === "number" && q.correctIndex >= 0 && q.correctIndex < 4 ? q.correctIndex : 0,
        })),
      };
    }
  } catch {}

  // AI 失败时的回退
  const fallbackScripts: Record<string, string> = {
    "新闻听力": `This is the latest news report. The global community is taking unprecedented steps to address the growing concerns over environmental sustainability and climate change. Scientists from over fifty countries gathered at the International Climate Summit in Geneva this week to discuss new findings on rising sea levels and extreme weather patterns. According to a major report released at the summit, coastal cities could face significant flooding risks within the next three decades if immediate action is not taken. The report highlights that carbon emissions have increased by fifteen percent over the past ten years, despite numerous international agreements aimed at reducing greenhouse gases. However, there is reason for cautious optimism. Renewable energy sources such as solar and wind power now account for nearly thirty percent of global electricity generation, up from just ten percent a decade ago. Several major economies have pledged to achieve carbon neutrality by the year twenty sixty.`,
    "长对话": `M: Hey Sarah, have you started preparing for the final exams yet? I've been feeling pretty overwhelmed with all the material we need to cover.\nW: I know exactly how you feel, Mike. I've been trying to organize my study schedule, but there's just so much content to review. I'm particularly worried about the statistics course.\nM: Statistics is definitely challenging. Professor Wang said the exam will focus heavily on regression analysis and hypothesis testing. Have you considered joining a study group?\nW: Actually, I haven't. Do you think it would help? I usually prefer studying alone, but maybe working with others could give me a different perspective on the material.\nM: That's exactly why I joined one last semester. We meet twice a week at the library, and each person takes turns explaining different concepts. It really helped me understand the topics I was struggling with.\nW: That makes sense. When does your group meet? I might give it a try this week.\nM: We meet on Tuesdays and Thursdays from seven to nine in the evening. There are about six of us, and we're all preparing for the same exam.\nW: Thanks, Mike. I'll come this Tuesday then. Do I need to prepare anything in advance?\nM: Just bring your notes and any questions you have. We usually start by going over the key concepts and then work through practice problems. It's pretty informal.`,
    "短文理解": `The concept of lifelong learning has become increasingly important in today's rapidly changing world. Unlike previous generations who could rely on skills acquired during their formal education to sustain an entire career, modern workers must continually update their knowledge and abilities to remain competitive in the job market. Technological advances, particularly in artificial intelligence and automation, are transforming industries at an unprecedented pace. Jobs that existed twenty years ago have disappeared, while entirely new professions have emerged that were unimaginable just a decade ago. This shift has profound implications for education systems worldwide. Traditional models of education, which focus on front-loading knowledge during the early years of life, are being replaced by more flexible approaches that emphasize continuous skill development. Many companies now invest significantly in employee training programs, recognizing that their workforce's adaptability is crucial to long-term success. Online learning platforms have made education more accessible than ever, allowing people to acquire new skills from anywhere in the world at their own pace.`,
  };
  const fallback = fallbackScripts[type] || fallbackScripts["短文理解"];
  return {
    audioScript: fallback,
    questions: Array.from({ length: questionCount }, (_, i) => ({
      question: `What does the speaker say about this topic?`,
      options: ["A. It is growing rapidly.", "B. It is declining.", "C. It remains unchanged.", "D. It is controversial."],
      correctIndex: (i % 4),
    })),
  };
}

async function generateArticle(key: string, baseUrl: string, timeout: number): Promise<any> {
  const prompt = `你是CET-4/6仔细阅读命题专家。请生成一篇四六级标准的仔细阅读文章。

要求：
- 文章长度：500-600英文词（这是四六级真题标准长度）
- 内容有深度，包含论点、论据、例证，结构完整
- 话题从以下随机选：科技发展、教育改革、文化差异、社会变迁、健康医疗、环境保护、经济趋势、心理学
- 5道选择题（主旨题1道 + 细节题2道 + 推断题1道 + 词义/态度题1道）
- 每题4个选项，含中文解析

输出JSON:
{"passage":"500-600词英文文章","questions":[{"question":"题目","options":["A. ...","B. ...","C. ...","D. ..."],"correctIndex":0,"explanation":"中文解析（含原文定位）"}]}`;

  if (!key) {
    return {
      passage: "Technology is reshaping education...",
      questions: Array.from({ length: 5 }, (_, i) => ({
        question: `Reading question ${i + 1}`,
        options: ["A. Option A", "B. Option B", "C. Option C", "D. Option D"],
        correctIndex: 0,
        explanation: "解析内容",
      })),
    };
  }

  let result: any = null;
  try { result = await aiCall(key, baseUrl, prompt, 4000, timeout); } catch {}
  if (result?.passage && result?.questions) {
    return {
      passage: result.passage,
      questions: result.questions.slice(0, 5).map((q: any, i: number) => ({
        question: q.question || `Question ${i + 1}`,
        options: q.options?.length === 4 ? q.options : ["A.", "B.", "C.", "D."],
        correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
        explanation: q.explanation || "请参考原文理解",
      })),
    };
  }
  return {
    passage: "Failed to generate article. Please try again.",
    questions: Array.from({ length: 5 }, (_, i) => ({
      question: `Question ${i + 1}`,
      options: ["A.", "B.", "C.", "D."],
      correctIndex: 0,
      explanation: "",
    })),
  };
}
