// 数学章节内容类型定义

export interface Formula {
  name: string;
  latex: string;
  note: string;
}

export interface Problem {
  question: string;
  answer: string;
  solution: string;
  steps: string[];
}

export interface ProblemType {
  name: string;
  examFrequency: string;
  example: Problem;
  practice: Problem;
}

export interface SpeedRunQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ChapterContent {
  subject: string;
  chapter: string;
  examWeight: number;
  examScore: string;
  formulas: Formula[];
  problemTypes: ProblemType[];
  traps: string[];
  speedRun: SpeedRunQuestion[];
}
