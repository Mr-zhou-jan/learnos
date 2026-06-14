/** CET-4/6 听力题库结构模板 */

export interface ListeningQuestionData {
  id: string;
  questionNumber: number;
  audioScript: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  answerSource: {
    sentence: string;
    sentenceIndex: number;
  };
}

export interface ListeningSectionData {
  id: string;
  title: string;
  description: string;
  direction: string;
  questions: ListeningQuestionData[];
}

export interface ListeningTestData {
  id: string;
  level: "cet4" | "cet6";
  title: string;
  sections: ListeningSectionData[];
  totalQuestions: number;
}

/** CET-4 听力 Section 配置 — 完全对标四级真题格式 */
const CET4_SECTIONS = [
  {
    id: "A",
    title: "Section A: 短篇新闻",
    description: "3篇短篇新闻，共7题",
    direction: "Directions: In this section, you will hear three news reports. At the end of each news report, you will hear two or three questions. Both the news report and the questions will be spoken only once. After you hear a question, you must choose the best answer from the four choices marked A, B, C and D.",
    passageConfigs: [
      { passageTitle: "News Report 1", questionCount: 2 },
      { passageTitle: "News Report 2", questionCount: 2 },
      { passageTitle: "News Report 3", questionCount: 3 },
    ],
  },
  {
    id: "B",
    title: "Section B: 长对话",
    description: "2篇长对话，共8题",
    direction: "Directions: In this section, you will hear two long conversations. At the end of each conversation, you will hear four questions. Both the conversation and the questions will be spoken only once. After you hear a question, you must choose the best answer from the four choices marked A, B, C and D.",
    passageConfigs: [
      { passageTitle: "Conversation 1", questionCount: 4 },
      { passageTitle: "Conversation 2", questionCount: 4 },
    ],
  },
  {
    id: "C",
    title: "Section C: 短文理解",
    description: "3篇短文，共10题",
    direction: "Directions: In this section, you will hear three passages. At the end of each passage, you will hear three or four questions. Both the passage and the questions will be spoken only once. After you hear a question, you must choose the best answer from the four choices marked A, B, C and D.",
    passageConfigs: [
      { passageTitle: "Passage 1", questionCount: 3 },
      { passageTitle: "Passage 2", questionCount: 3 },
      { passageTitle: "Passage 3", questionCount: 4 },
    ],
  },
];

/** CET-6 听力 Section 配置 */
const CET6_SECTIONS = [
  {
    id: "A",
    title: "Section A: 长对话",
    description: "2篇长对话，共8题",
    direction: "Directions: In this section, you will hear two long conversations. At the end of each conversation, you will hear four questions. Both the conversation and the questions will be spoken only once. After you hear a question, you must choose the best answer from the four choices marked A, B, C and D.",
    passageConfigs: [
      { passageTitle: "Conversation 1", questionCount: 4 },
      { passageTitle: "Conversation 2", questionCount: 4 },
    ],
  },
  {
    id: "B",
    title: "Section B: 短文理解",
    description: "2篇短文，共7题",
    direction: "Directions: In this section, you will hear two passages. At the end of each passage, you will hear three or four questions. Both the passage and the questions will be spoken only once. After you hear a question, you must choose the best answer from the four choices marked A, B, C and D.",
    passageConfigs: [
      { passageTitle: "Passage 1", questionCount: 3 },
      { passageTitle: "Passage 2", questionCount: 4 },
    ],
  },
  {
    id: "C",
    title: "Section C: 讲座/讲话",
    description: "3篇讲座，共10题",
    direction: "Directions: In this section, you will hear three recordings of lectures or talks. At the end of each recording, you will hear three or four questions. Both the recording and the questions will be spoken only once. After you hear a question, you must choose the best answer from the four choices marked A, B, C and D.",
    passageConfigs: [
      { passageTitle: "Recording 1", questionCount: 3 },
      { passageTitle: "Recording 2", questionCount: 3 },
      { passageTitle: "Recording 3", questionCount: 4 },
    ],
  },
];

export function getCET4Template() {
  const total = CET4_SECTIONS.reduce(
    (sum, s) => sum + s.passageConfigs.reduce((s2, p) => s2 + p.questionCount, 0),
    0
  );
  return { sections: CET4_SECTIONS, totalQuestions: total };
}

export function getCET6Template() {
  const total = CET6_SECTIONS.reduce(
    (sum, s) => sum + s.passageConfigs.reduce((s2, p) => s2 + p.questionCount, 0),
    0
  );
  return { sections: CET6_SECTIONS, totalQuestions: total };
}

export function getAvailableLevels() {
  return [
    { id: "cet4", label: "CET-4 大学英语四级", desc: "短篇新闻 + 长对话 + 短文理解 · 共25题 · 约30分钟" },
    { id: "cet6", label: "CET-6 大学英语六级", desc: "长对话 + 短文理解 + 讲座讲话 · 共25题 · 约30分钟" },
  ];
}
