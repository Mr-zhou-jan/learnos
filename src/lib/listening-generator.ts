import type { ListeningTestData, ListeningSectionData, ListeningQuestionData } from "@/data/listening-sets";
import { getCET4Template, getCET6Template } from "@/data/listening-sets";

/** 各级别各题型的词数规格（对标2024年6月真题） */
const WORD_COUNTS: Record<string, Record<string, { min: number; max: number; style: string }>> = {
  cet4: {
    A: { min: 160, max: 210, style: "BBC/VOA风格新闻报道（新闻播报体，客观陈述，含具体人名/地名/数字/日期/机构名）" },
    B: { min: 280, max: 370, style: "真实日常对话（一问一答交替≥6轮，含观点冲突/信息交换/建议，有具体细节如价格/日期/地点/人名）" },
    C: { min: 220, max: 310, style: "科普/社会/文化类短文（学术报告或杂志文章风格，含研究数据/调查结果/专家观点/具体数字）" },
  },
  cet6: {
    A: { min: 290, max: 380, style: "深度访谈或学术讨论对话（一问一答交替≥8轮，含专业观点/论证/反驳，有具体数据和案例）" },
    B: { min: 240, max: 330, style: "学术/社会议题短文（学术期刊风格，含研究发现/统计数据/专家引述/对比分析）" },
    C: { min: 290, max: 390, style: "学术讲座/专题演讲（大学教授或专家演讲风格，含研究背景/方法论/数据分析/结论，有具体数字和引用）" },
  },
};

export function buildListeningPrompt(
  level: "cet4" | "cet6",
  sectionId: string,
  sectionTitle: string,
  passageTitle: string,
  questionCount: number,
  startNumber: number
): string {
  const levelName = level === "cet4" ? "CET-4" : "CET-6";
  const spec = WORD_COUNTS[level]?.[sectionId] || WORD_COUNTS.cet4.A;
  const totalDuration =
    level === "cet4" ? "约25分钟（全部Section合计）" : "约30分钟（全部Section合计）";

  return `${levelName}听力。${spec.style}。生成${spec.min}-${spec.max}词脚本+${questionCount}题(对话用M:/W:标注)。纯JSON:{"passageScript":"脚本","questions":[{"question":"What/Why题","options":["A.","B.","C.","D."],"correctIndex":0,"explanation":"解析","answerSource":{"sentence":"原句","sentenceIndex":0}}]}`;
}

export function parsePassageResult(
  raw: any,
  sectionId: string,
  startNumber: number
): ListeningQuestionData[] {
  const script = raw.passageScript || "";
  const rawQuestions = raw.questions || [];
  return rawQuestions.map((q: any, i: number) => ({
    id: `${sectionId}-${startNumber + i}`,
    questionNumber: startNumber + i + 1,
    audioScript: script,
    question: q.question || "",
    options: q.options || ["A.", "B.", "C.", "D."],
    correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
    explanation: q.explanation || "",
    answerSource: {
      sentence: q.answerSource?.sentence || "",
      sentenceIndex: q.answerSource?.sentenceIndex ?? 0,
    },
  }));
}

export function buildTestData(
  level: "cet4" | "cet6",
  title: string,
  sectionResults: {
    sectionId: string; sectionTitle: string; description: string; direction: string;
    questions: ListeningQuestionData[];
  }[]
): ListeningTestData {
  const sections: ListeningSectionData[] = sectionResults.map((sr) => ({
    id: sr.sectionId,
    title: sr.sectionTitle,
    description: sr.description,
    direction: sr.direction,
    questions: sr.questions,
  }));
  const total = sections.reduce((sum, s) => sum + s.questions.length, 0);
  return {
    id: `listen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    level,
    title,
    sections,
    totalQuestions: total,
  };
}

/** 回退测试数据 — 对标真实CET-4/6长度 */
export function buildFallbackTest(level: "cet4" | "cet6"): ListeningTestData {
  const template = level === "cet4" ? getCET4Template() : getCET6Template();
  const sections: ListeningSectionData[] = [];
  let qNum = 0;

  // 按题型提供不同风格的回退脚本
  const fallbackScripts: Record<string, Record<string, { script: string; questions: any[] }>> = {
    cet4: {
      A: { // News Reports
        script:
          "Officials say six people had to move away from their home after a fire broke out in a building on Main Street Saturday. " +
          "Firefighters responded to the three-story building shortly after 1 p.m. for a reported structure fire, according to Norwalk Deputy Fire Chief Adam Markiewicz. " +
          "Markiewicz said crews encountered heavy smoke coming from the second floor when they arrived. " +
          "A team of about 25 firefighters then spent about 25 minutes extinguishing the flames. " +
          "Officials described the structure as a mixed-use building that features commercial businesses on the first floor and residential on the second and third floors. " +
          "Town records list four apartments in the building. Due to smoke and heat damage, the four apartments were declared uninhabitable, " +
          "and the six residents had to move to another place, officials said. No injuries were reported in connection with the fire. " +
          "The Norwalk Fire Marshal is investigating the cause and origin of the fire. " +
          "A separate study published this week looks at the relationship between environmental factors and mental health. " +
          "Researchers examined symptoms of anxiety and depression among more than 70,000 older adults across 12 European countries over a five-year period. " +
          "A number of past studies have found links between various environmental factors and mental health diagnoses, " +
          "but the new research suggests that factors such as social class and economic background have more to do with these diagnoses than previously thought. " +
          "Overall, the new study found no significant relationship between participants' geographic location and symptoms of depression. " +
          "However, researchers noted some variability in certain regions. In Eastern European countries, depressive symptoms fluctuated slightly, " +
          "but the study concludes there was no systematic pattern across the entire sample.",
        questions: [
          {
            question: "Why did the six residents have to find another place to stay?",
            options: [
              "A. Their building was damaged by fire",
              "B. Their rent was increased significantly",
              "C. The building was sold to a new owner",
              "D. The city ordered building renovations",
            ],
            correctIndex: 0,
            explanation:
              "定位依据：'Due to smoke and heat damage, the four apartments were declared uninhabitable, and the six residents had to move to another place'。推理过程：大火造成了烟和热的损害，公寓被宣布无法居住，因此居民必须迁离。干扰项排除：B/C/D选项中的租金上涨、出售、城市改造在文中均未提及。",
            answerSource: {
              sentence:
                "Due to smoke and heat damage, the four apartments were declared uninhabitable, and the six residents had to move to another place, officials said.",
              sentenceIndex: 6,
            },
          },
          {
            question: "What does the news report say the Norwalk Fire Marshal is doing?",
            options: [
              "A. Investigating the cause of the fire",
              "B. Inspecting other buildings in the area",
              "C. Interviewing the six displaced residents",
              "D. Reviewing the city's fire safety codes",
            ],
            correctIndex: 0,
            explanation:
              "定位依据：'The Norwalk Fire Marshal is investigating the cause and origin of the fire.' 推理过程：新闻明确说明消防局长正在调查火灾原因。干扰项排除：B/C/D均为合理推测但原文未提及。",
            answerSource: {
              sentence: "The Norwalk Fire Marshal is investigating the cause and origin of the fire.",
              sentenceIndex: 8,
            },
          },
        ],
      },
      B: { // Long Conversations
        script:
          "W: Tom, did you see the article online about the new TV series based on the book The Three Body Problem? " +
          "M: A colleague mentioned the book, but I've been so busy writing my thesis that I haven't been able to read for pleasure in months. " +
          "W: Well, sounds like if you're going to read anything for fun, this is the book. It's written by a Chinese science fiction writer. " +
          "I can't remember his name, but he's written three books in all, and The Three Body Problem is the first in the series. " +
          "I don't want to say too much and spoil it for you, but it's definitely got some amazing technological and sociological concepts in it. " +
          "M: It does sound like it would suit my taste, but if they are making a TV series based on it now, I don't know if I should read the book or watch the show first. " +
          "W: I think it's better to read the book first. It's rare for the show or movie to be better than the book. " +
          "And then, you just end up ruining the book for yourself, if the show isn't very good. " +
          "M: When is the show supposed to start? I'm a bit overwhelmed with the amount of data I still need to collect to finish my thesis. " +
          "But I still need to relax sometimes. " +
          "W: I can't remember exactly. It's pretty soon, and it's going to be quite long. There are 24 episodes. " +
          "Well, maybe you could download an electronic copy of the book and try to read it before the show starts. " +
          "M: That's a good idea. And then, maybe we can watch the series together. Thanks for the tip, Alice. " +
          "W: No problem. Let me know what you think of the first few chapters.",
        questions: [
          {
            question: "How did the man get to know about the book The Three Body Problem?",
            options: [
              "A. From a colleague at work",
              "B. From an online advertisement",
              "C. He saw it in a bookstore",
              "D. The woman recommended it to him earlier",
            ],
            correctIndex: 0,
            explanation:
              "定位依据：'A colleague mentioned the book'。推理过程：男士说同事提到了这本书。干扰项排除：B/C未提及；D女士在本次对话中首次推荐，不是earlier。",
            answerSource: { sentence: "A colleague mentioned the book", sentenceIndex: 1 },
          },
          {
            question: "What does the woman say she can't remember about the book?",
            options: [
              "A. The author's name",
              "B. The number of books in the series",
              "C. When the TV series starts",
              "D. The main character's name",
            ],
            correctIndex: 0,
            explanation:
              "定位依据：'I can't remember his name'。推理过程：女士说她记不住中国科幻作家的名字。干扰项排除：B她明确说three books；C是她说记不清具体时间的另一个细节；D未提及。",
            answerSource: {
              sentence: "I can't remember his name, but he's written three books in all.",
              sentenceIndex: 3,
            },
          },
          {
            question: "What does the man have to do to finish his thesis?",
            options: [
              "A. Collect more data",
              "B. Read more reference books",
              "C. Interview more subjects",
              "D. Revise his methodology",
            ],
            correctIndex: 0,
            explanation:
              "定位依据：'I'm a bit overwhelmed with the amount of data I still need to collect to finish my thesis.' 推理过程：男士还需要收集数据才能完成论文。干扰项排除：B/C/D在对话中未提及。",
            answerSource: {
              sentence:
                "I'm a bit overwhelmed with the amount of data I still need to collect to finish my thesis.",
              sentenceIndex: 9,
            },
          },
          {
            question: "What will the man most probably do first after the conversation?",
            options: [
              "A. Download an electronic copy of the book",
              "B. Watch the TV series immediately",
              "C. Finish collecting data for his thesis",
              "D. Go to the bookstore to buy the book",
            ],
            correctIndex: 0,
            explanation:
              "定位依据：男士说'That's a good idea'回应女士建议下载电子版阅读。推理过程：女士建议下载电子版，男士认同，所以下一步是下载电子书。干扰项排除：B与先读后看的原则矛盾；C是长期任务；D未提及书店购买。",
            answerSource: {
              sentence:
                "maybe you could download an electronic copy of the book and try to read it before the show starts.",
              sentenceIndex: 11,
            },
          },
        ],
      },
      C: { // Passages
        script:
          "Imagine boating down the Amazon River, minding your own business, calmly keeping an eye out for alarmingly large snakes, " +
          "and a curious pink dolphin appears to swim alongside your boat. While this may seem like a mythical creature, " +
          "pink dolphins do exist in the Amazon region. The Amazon River Dolphin is a giant among its species. " +
          "It can measure up to 2 meters long and weigh around 204 kilograms. Size isn't the only thing that sets the Amazon River Dolphin apart. " +
          "Thriving in South American rivers and temporary lakes caused by seasonal flooding, this freshwater dolphin is sometimes shockingly pink. " +
          "Although born gray, males of the species are easily identified as they enter adulthood by a decisive pink shade. " +
          "Their unusual coloring is believed to be the result of scar tissue from dolphin fights, whether play fighting or a serious bid for a mate. " +
          "The deeper the pink, the more attractive the males are believed to be, and the older the male, the more pink he will have. " +
          "There's also a theory that this color helps the dolphins more readily blend in with their surroundings. " +
          "During heavy rains, rivers along the Amazon rainforest turn a pink shade, and male dolphins are harder to detect. " +
          "The Amazon wetland system, fed by the Amazon River, is a crucial place for pink dolphins to breed. " +
          "And, since 2018, this wetland system has been granted internationally protected status. " +
          "Conservationists hope this protection will help stabilize the pink dolphin population, which has faced threats from pollution, " +
          "habitat loss, and accidental capture in fishing nets over the past two decades.",
        questions: [
          {
            question: "What does the passage say about pink dolphins?",
            options: [
              "A. They exist in the Amazon region",
              "B. They are the smallest dolphin species",
              "C. They are born with pink coloring",
              "D. They only live in the ocean",
            ],
            correctIndex: 0,
            explanation:
              "定位依据：'pink dolphins do exist in the Amazon region'。推理过程：短文明确指出粉红海豚存在于亚马逊地区。干扰项排除：B与'giant among its species'矛盾；C与'born gray'矛盾；D与'freshwater dolphin'矛盾。",
            answerSource: { sentence: "pink dolphins do exist in the Amazon region.", sentenceIndex: 2 },
          },
          {
            question: "What is the unusual coloring of pink dolphins believed to originate in?",
            options: [
              "A. Scar tissue from fights",
              "B. Genetic mutation at birth",
              "C. Diet of specific river fish",
              "D. Exposure to Amazon minerals",
            ],
            correctIndex: 0,
            explanation:
              "定位依据：'Their unusual coloring is believed to be the result of scar tissue from dolphin fights.' 推理过程：颜色源于战斗中形成的疤痕组织。干扰项排除：B/C/D均为对颜色来源的其他可能解释，但原文未提及。",
            answerSource: {
              sentence:
                "Their unusual coloring is believed to be the result of scar tissue from dolphin fights, whether play fighting or a serious bid for a mate.",
              sentenceIndex: 7,
            },
          },
          {
            question: "What has become of the Amazon wetland system since 2018?",
            options: [
              "A. It has been granted internationally protected status",
              "B. It has been opened to commercial fishing",
              "C. It has experienced severe drought conditions",
              "D. It has been divided among three countries",
            ],
            correctIndex: 0,
            explanation:
              "定位依据：'since 2018, this wetland system has been granted internationally protected status.' 推理过程：2018年起获得国际保护地位。干扰项排除：B/C/D在文中均未提及。",
            answerSource: {
              sentence:
                "since 2018, this wetland system has been granted internationally protected status.",
              sentenceIndex: 11,
            },
          },
        ],
      },
    },
    cet6: {
      A: {
        script:
          "M: Professor Williams, thank you for taking the time to speak with us today about your research on artificial intelligence in healthcare. " +
          "I understand your team has been working on a diagnostic AI system for the past four years? " +
          "W: That's correct. Our team at Stanford Medical Center has developed an AI model that can detect early signs of lung cancer " +
          "from CT scans with an accuracy rate of 94.5 percent, which is significantly higher than the average radiologist's 88 percent. " +
          "M: That's remarkable. How does the system actually work? " +
          "W: The system uses deep learning algorithms trained on a dataset of over 200,000 annotated CT scans from patients across 15 countries. " +
          "It analyzes patterns that the human eye might miss, particularly in the early stages when tumors are smaller than 3 millimeters. " +
          "M: Are there concerns about replacing human radiologists? " +
          "W: That's a common misconception. Our goal isn't replacement but augmentation. The AI serves as a second reader, " +
          "flagging suspicious areas for the radiologist to review. In our clinical trials, the combination of AI plus radiologist " +
          "achieved a detection rate of 97.2 percent, significantly outperforming either one alone. " +
          "M: What about the cost implications for hospitals, particularly smaller ones? " +
          "W: The initial investment is about 50,000 dollars for hardware and software setup, but our cost-benefit analysis shows " +
          "that hospitals can recover this within 18 months through earlier cancer detection and reduced false positive rates, " +
          "which currently cost the U.S. healthcare system an estimated 4 billion dollars annually. " +
          "M: And what's the timeline for FDA approval? " +
          "W: We've completed Phase 3 clinical trials and submitted our application last September. We expect a decision by March next year. " +
          "If approved, we plan to deploy the system in 50 hospitals across the United States in the first year.",
        questions: [
          {
            question: "What is the accuracy rate of the AI system in detecting lung cancer?",
            options: ["A. 94.5 percent", "B. 88 percent", "C. 97.2 percent", "D. 90 percent"],
            correctIndex: 0,
            explanation: "定位依据：'an accuracy rate of 94.5 percent'。B是放射科医生单独的准确率，C是AI+放射科医生组合的准确率。",
            answerSource: {
              sentence:
                "Our team at Stanford Medical Center has developed an AI model that can detect early signs of lung cancer from CT scans with an accuracy rate of 94.5 percent.",
              sentenceIndex: 2,
            },
          },
          {
            question: "How does Professor Williams describe the role of the AI system?",
            options: [
              "A. As a second reader augmenting radiologists",
              "B. As a replacement for human radiologists",
              "C. As a training tool for medical students",
              "D. As a patient-facing diagnostic app",
            ],
            correctIndex: 0,
            explanation:
              "定位依据：'Our goal isn't replacement but augmentation. The AI serves as a second reader.' 教授明确表示目标是增强而非替代。",
            answerSource: {
              sentence: "The AI serves as a second reader, flagging suspicious areas for the radiologist to review.",
              sentenceIndex: 9,
            },
          },
        ],
      },
      B: {
        script:
          "A new study published in the journal Nature Climate Change has cast doubt on previous estimates of sea level rise. " +
          "Researchers from the University of Copenhagen analyzed satellite data spanning 25 years and found that ice sheets in Greenland " +
          "and Antarctica are melting at a rate 40 percent faster than what was predicted by climate models just a decade ago. " +
          "Dr. Sarah Henderson, the lead author, explained that previous models failed to account for what scientists call 'marine ice cliff instability,' " +
          "a process where towering ice cliffs collapse under their own weight once their supporting ice shelves melt away. " +
          "The study projects that if current trends continue, global sea levels could rise by as much as 1.6 meters by the year 2100, " +
          "up from the previous estimate of 1.1 meters. This would have devastating consequences for coastal communities worldwide. " +
          "Approximately 680 million people living in low-lying coastal areas would be directly affected, according to the United Nations. " +
          "Major cities including Shanghai, Mumbai, New York, and London would face increased flooding risks during storm surges. " +
          "The economic impact is estimated at 14 trillion dollars annually by 2100 if no significant adaptation measures are taken. " +
          "However, the researchers emphasize that it is not too late to act. Rapid reduction of greenhouse gas emissions combined with " +
          "investment in coastal defense infrastructure could significantly reduce these risks.",
        questions: [
          {
            question: "What did the University of Copenhagen study find about ice sheet melting?",
            options: [
              "A. It is 40 percent faster than previously predicted",
              "B. It has slowed down in the past decade",
              "C. It only affects the Greenland ice sheet",
              "D. It is consistent with earlier climate models",
            ],
            correctIndex: 0,
            explanation: "定位依据：'ice sheets...are melting at a rate 40 percent faster than what was predicted by climate models just a decade ago.'",
            answerSource: {
              sentence: "ice sheets in Greenland and Antarctica are melting at a rate 40 percent faster than what was predicted by climate models just a decade ago.",
              sentenceIndex: 1,
            },
          },
          {
            question: "What is the projected sea level rise by 2100 according to the new study?",
            options: ["A. Up to 1.6 meters", "B. Up to 1.1 meters", "C. Up to 2 meters", "D. Up to 0.5 meters"],
            correctIndex: 0,
            explanation: "定位依据：'global sea levels could rise by as much as 1.6 meters by the year 2100, up from the previous estimate of 1.1 meters.' B是旧估计。",
            answerSource: {
              sentence: "global sea levels could rise by as much as 1.6 meters by the year 2100, up from the previous estimate of 1.1 meters.",
              sentenceIndex: 4,
            },
          },
        ],
      },
      C: {
        script:
          "Good morning, everyone. Today we'll be examining the economic implications of artificial intelligence on the global labor market. " +
          "Recent data from the World Economic Forum suggests that by 2030, AI and automation will displace approximately 85 million jobs globally. " +
          "However, and this is the key point, the same technologies are projected to create 97 million new jobs, resulting in a net gain of 12 million positions. " +
          "But before we celebrate, we need to consider three critical challenges that accompany this transition. " +
          "First, the skill gap problem. The new jobs will require fundamentally different skill sets. " +
          "The World Economic Forum estimates that 50 percent of all employees will need significant reskilling by 2025, now just 12 months away. " +
          "Jobs in data analysis, AI system management, and human-machine interaction design are growing at an annual rate of 30 to 40 percent. " +
          "Meanwhile, roles in data entry, basic accounting, and routine manufacturing are declining at similar rates. " +
          "Second, the geographic mismatch. New technology jobs are concentrated in urban tech hubs like San Francisco, London, and Shenzhen. " +
          "But the jobs being displaced are often in rural and industrial regions. This creates what economists call 'spatial inequality.' " +
          "Between 2010 and 2024, the gap in average income between the top 10 percent of urban areas and the bottom 10 percent of rural areas widened by 35 percent. " +
          "Third, the time lag. Even if new jobs are created, workers cannot transition overnight. " +
          "The average retraining program takes 6 to 24 months, and during this period, displaced workers face significant financial hardship. " +
          "So what can be done? Governments in Germany and Singapore have pioneered what are called 'transition safety nets' — " +
          "programs that provide income support during retraining periods, combined with partnerships between universities and employers. " +
          "These models have shown promising results, with 78 percent of participants finding new employment within three months of completing their programs. " +
          "In conclusion, the AI-driven transformation of the labor market is not something that will happen to us passively. " +
          "It is something we can actively shape through thoughtful policy, investment in education, and international cooperation.",
        questions: [
          {
            question: "What is the projected net job change due to AI by 2030?",
            options: [
              "A. A net gain of 12 million jobs",
              "B. A net loss of 85 million jobs",
              "C. No significant change",
              "D. A net gain of 97 million jobs",
            ],
            correctIndex: 0,
            explanation: "定位依据：'97 million new jobs...resulting in a net gain of 12 million positions.' 85 million是淘汰数量，97 million是新增数量。",
            answerSource: {
              sentence: "the same technologies are projected to create 97 million new jobs, resulting in a net gain of 12 million positions.",
              sentenceIndex: 2,
            },
          },
          {
            question: "What is the skill gap challenge mentioned in the lecture?",
            options: [
              "A. 50 percent of employees will need significant reskilling by 2025",
              "B. Most workers are unwilling to learn new skills",
              "C. Universities cannot offer enough technology courses",
              "D. Companies are refusing to invest in training",
            ],
            correctIndex: 0,
            explanation: "定位依据：'50 percent of all employees will need significant reskilling by 2025.' B/C/D均为未提及的推测。",
            answerSource: {
              sentence: "The World Economic Forum estimates that 50 percent of all employees will need significant reskilling by 2025.",
              sentenceIndex: 5,
            },
          },
        ],
      },
    },
  };

  for (const sec of template.sections) {
    const secFallback = fallbackScripts[level]?.[sec.id] || fallbackScripts.cet4.A;
    const questions: ListeningQuestionData[] = [];

    for (const pc of sec.passageConfigs) {
      // 使用对应题型的fallback脚本，截取足够的题目数
      const availableQs = secFallback.questions || [];
      for (let i = 0; i < pc.questionCount; i++) {
        const templateQ = availableQs[i % availableQs.length];
        questions.push({
          id: `${sec.id}-${qNum}`,
          questionNumber: qNum + 1,
          audioScript: secFallback.script,
          question: templateQ.question,
          options: templateQ.options,
          correctIndex: templateQ.correctIndex,
          explanation: templateQ.explanation || "",
          answerSource: templateQ.answerSource || { sentence: "", sentenceIndex: 0 },
        });
        qNum++;
      }
    }
    sections.push({
      id: sec.id,
      title: sec.title,
      description: sec.description,
      direction: sec.direction,
      questions,
    });
  }

  return {
    id: `listen-fallback-${Date.now()}`,
    level,
    title: `${level === "cet4" ? "CET-4" : "CET-6"} 全真模拟听力`,
    sections,
    totalQuestions: qNum,
  };
}
