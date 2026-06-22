import { ChapterContent } from "./types";

const chapter: ChapterContent = {
  subject: "高等数学",
  chapter: "函数与极限",
  examWeight: 5,
  examScore: "约15分/100",
  formulas: [
    { name: "两个重要极限", latex: "lim(x→0) sinx/x = 1", note: "必考！注意必须是x→0" },
    { name: "第二个重要极限", latex: "lim(x→∞) (1+1/x)^x = e", note: "变体：lim(x→0)(1+x)^(1/x)=e，常用于1^∞型" },
    { name: "等价无穷小替换表", latex: "sinx~x, tanx~x, arcsinx~x, arctanx~x, ln(1+x)~x, e^x-1~x, 1-cosx~x²/2, (1+x)^a-1~ax", note: "乘除可直接替换，加减不能随便替！最常见坑" },
    { name: "洛必达法则条件", latex: "lim f(x)/g(x) = lim f'(x)/g'(x)", note: "必须0/0或∞/∞型！用之前先验证" },
    { name: "夹逼定理", latex: "若 g(x)≤f(x)≤h(x) 且 lim g=lim h=A，则 lim f=A", note: "用于含n次方、阶乘的复杂极限" },
  ],
  problemTypes: [
    {
      name: "极限计算（代入法）",
      examFrequency: "每次必考",
      example: {
        question: "求 lim(x→2) (x²-4)/(x-2)",
        answer: "4",
        solution: "lim(x→2)(x²-4)/(x-2)=lim(x→2)(x-2)(x+2)/(x-2)=lim(x→2)(x+2)=4",
        steps: ["直接代入得0/0型，不能直接算", "分子因式分解：(x²-4)=(x-2)(x+2)", "约去(x-2)", "代入x=2：2+2=4"],
      },
      practice: {
        question: "求 lim(x→1) (x³-1)/(x-1)",
        answer: "3",
        solution: "因式分解 x³-1=(x-1)(x²+x+1)，约去(x-1)，代入得1+1+1=3",
        steps: ["因式分解", "约分", "代入"],
      },
    },
    {
      name: "等价无穷小替换",
      examFrequency: "每次必考",
      example: {
        question: "求 lim(x→0) (sin3x)/(tan2x)",
        answer: "3/2",
        solution: "sin3x~3x, tan2x~2x (x→0)，原式=lim 3x/2x=3/2",
        steps: ["x→0时sin3x等价于3x", "tan2x等价于2x", "替换后约分：3/2"],
      },
      practice: {
        question: "求 lim(x→0) (1-cosx)/x²",
        answer: "1/2",
        solution: "1-cosx~x²/2，原式=(x²/2)/x²=1/2",
        steps: ["识别1-cosx的等价无穷小", "替换", "约分"],
      },
    },
    {
      name: "洛必达法则",
      examFrequency: "经常考",
      example: {
        question: "求 lim(x→0) (e^x-1-x)/x²",
        answer: "1/2",
        solution: "0/0型，洛必达：=lim(e^x-1)/(2x)，仍0/0，再洛：=lim(e^x)/2=1/2",
        steps: ["验证0/0型", "第一次洛必达", "仍是0/0，第二次洛必达", "得e^x/2→1/2"],
      },
      practice: {
        question: "求 lim(x→0) (x-sinx)/x³",
        answer: "1/6",
        solution: "0/0型，三次洛必达：=lim(1-cosx)/(3x²)=lim(sinx)/(6x)=lim(cosx)/6=1/6",
        steps: ["验证0/0型", "三次洛必达", "代入"],
      },
    },
    {
      name: "1^∞型极限",
      examFrequency: "高频考点",
      example: {
        question: "求 lim(x→∞) (1+2/x)^x",
        answer: "e²",
        solution: "=lim[(1+2/x)^(x/2)]²=e²",
        steps: ["识别1^∞型", "凑第二个重要极限", "指数提出→e²"],
      },
      practice: {
        question: "求 lim(x→0) (1+3x)^(1/x)",
        answer: "e³",
        solution: "令t=3x，原式=lim(t→0)(1+t)^(3/t)=[lim(1+t)^(1/t)]³=e³",
        steps: ["换元t=3x", "凑第二个重要极限", "e³"],
      },
    },
  ],
  traps: [
    "⚠️ 等价无穷小只能在乘除中用，加减不能随便替换！tanx-sinx ≠ x-x=0",
    "⚠️ 洛必达前必须先验证0/0或∞/∞，否则公式不成立",
    "⚠️ x→∞时sinx/x→0而不是1！重要极限必须是x→0",
    "⚠️ 无穷小×有界函数=无穷小，秒杀选择题利器",
  ],
  speedRun: [
    { question: "lim(x→0) sin5x/x = ?", options: ["0", "1", "5", "不存在"], correctIndex: 2, explanation: "sin5x~5x，原式=5x/x=5" },
    { question: "lim(x→0) (1-cos2x)/x² = ?", options: ["0", "1", "2", "4"], correctIndex: 2, explanation: "1-cos2x~(2x)²/2=2x²，原式=2" },
    { question: "lim(x→∞) sinx/x = ?", options: ["0", "1", "∞", "不存在"], correctIndex: 0, explanation: "|sinx|≤1有界，1/x→0，有界×无穷小=0" },
    { question: "lim(x→0) (e^3x-1)/x = ?", options: ["0", "1", "3", "e³"], correctIndex: 2, explanation: "e^3x-1~3x，原式=3" },
    { question: "lim(x→0+) x·lnx = ?", options: ["0", "1", "-∞", "∞"], correctIndex: 0, explanation: "改写为lnx/(1/x)，洛必达得-lim x=0" },
    { question: "lim(x→∞) (1+1/x)^(2x) = ?", options: ["1", "e", "e²", "2e"], correctIndex: 2, explanation: "=[(1+1/x)^x]²→e²" },
    { question: "lim(x→0) tanx/x = ?", options: ["0", "1", "不存在", "∞"], correctIndex: 1, explanation: "tanx~x，直接替换得1" },
    { question: "lim(x→0) (x²sin(1/x))/x = ?", options: ["0", "1", "不存在", "∞"], correctIndex: 0, explanation: "=lim x·sin(1/x)，有界×无穷小=0" },
  ],
};

export default chapter;
