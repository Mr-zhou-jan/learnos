import { ChapterContent } from "./types";

const chapter: ChapterContent = {
  subject: "高等数学",
  chapter: "不定积分",
  examWeight: 5,
  examScore: "约18分/100",
  formulas: [
    { name: "基本积分公式", latex: "∫x^ndx=x^(n+1)/(n+1)+C(n≠-1), ∫1/xdx=ln|x|+C, ∫e^xdx=e^x+C, ∫sinxdx=-cosx+C, ∫cosxdx=sinx+C, ∫sec²xdx=tanx+C", note: "求导反过来就是积分，必须都会" },
    { name: "凑微分（第一类换元）", latex: "∫f[g(x)]g'(x)dx = ∫f(u)du = F(u)+C", note: "核心技能！复合函数+内层导数=凑微分" },
    { name: "三角换元（第二类换元）", latex: "√(a²-x²)→x=asint, √(a²+x²)→x=atant, √(x²-a²)→x=asect", note: "有根号且凑微分搞不定时用" },
    { name: "分部积分", latex: "∫udv = uv - ∫vdu", note: "口诀'反对幂指三'选u优先级：反三角→对数→幂→指数→三角" },
  ],
  problemTypes: [
    {
      name: "凑微分法",
      examFrequency: "每次必考",
      example: {
        question: "∫ sin(2x+1) dx",
        answer: "-cos(2x+1)/2 + C",
        solution: "令u=2x+1, du=2dx, dx=du/2。∫sinu·du/2=-cosu/2+C=-cos(2x+1)/2+C",
        steps: ["识别u=2x+1", "dx=du/2", "∫sinudu=-cosu", "代回"],
      },
      practice: {
        question: "∫ xe^(x²) dx",
        answer: "e^(x²)/2 + C",
        solution: "令u=x², du=2xdx, xdx=du/2。∫e^u·du/2=e^u/2=e^(x²)/2+C",
        steps: ["注意到xdx=x²微分的一半", "令u=x²", "凑微分", "积分"],
      },
    },
    {
      name: "分部积分法",
      examFrequency: "必考",
      example: {
        question: "∫ x·e^x dx",
        answer: "e^x(x-1) + C",
        solution: "u=x(幂),dv=e^xdx(指)。du=dx,v=e^x。∫xe^xdx=xe^x-∫e^xdx=xe^x-e^x+C",
        steps: ["u=x, dv=e^xdx", "du=dx, v=e^x", "uv-∫vdu", "算余下的积分"],
      },
      practice: {
        question: "∫ ln x dx",
        answer: "xlnx - x + C",
        solution: "u=lnx(对函数优先),dv=dx。du=dx/x,v=x。∫lnxdx=xlnx-∫x·dx/x=xlnx-∫dx=xlnx-x+C",
        steps: ["u=lnx(对数优先)", "dv=dx", "代入公式", "化简"],
      },
    },
    {
      name: "三角换元",
      examFrequency: "常见",
      example: {
        question: "∫ 1/√(1-x²) dx",
        answer: "arcsin x + C",
        solution: "令x=sint,dx=cost dt。√(1-x²)=cost。∫cost/cost dt=∫dt=t+C=arcsinx+C",
        steps: ["√(1-x²)用x=sint", "替换dx和根号", "简化", "代回"],
      },
      practice: {
        question: "∫ 1/(x²+1) dx",
        answer: "arctan x + C",
        solution: "基本积分公式：(arctanx)'=1/(1+x²)",
        steps: ["直接套公式", "arctanx+C"],
      },
    },
    {
      name: "有理函数积分",
      examFrequency: "期末常考",
      example: {
        question: "∫ 1/(x²-1) dx",
        answer: "(1/2)ln|(x-1)/(x+1)| + C",
        solution: "分解=1/[(x-1)(x+1)]=1/2·[1/(x-1)-1/(x+1)]，积分=(1/2)(ln|x-1|-ln|x+1|)+C",
        steps: ["部分分式分解", "求系数", "逐项积分", "合并"],
      },
      practice: {
        question: "∫ 1/[x(x+1)] dx",
        answer: "ln|x/(x+1)| + C",
        solution: "=∫[1/x-1/(x+1)]dx=ln|x|-ln|x+1|+C=ln|x/(x+1)|+C",
        steps: ["分解分式", "逐项积分", "合并"],
      },
    },
  ],
  traps: [
    "⚠️ 不定积分后面一定加C！不加C考试扣分",
    "⚠️ ∫1/x dx = ln|x|+C，绝对值不能省",
    "⚠️ 分部积分u选错顺序会越积越复杂，记住'反对幂指三'",
    "⚠️ 凑微分时别漏了dx转换的系数",
  ],
  speedRun: [
    { question: "∫ cos3x dx = ?", options: ["sin3x+C", "sin3x/3+C", "3sin3x+C", "-sin3x/3+C"], correctIndex: 1, explanation: "u=3x,dx=du/3，∫cosu·du/3=sinu/3+C" },
    { question: "∫ 1/(2x+1) dx = ?", options: ["ln|2x+1|+C", "ln|2x+1|/2+C", "2ln|2x+1|+C", "1/(2x+1)²+C"], correctIndex: 1, explanation: "u=2x+1,dx=du/2，∫1/u·du/2=ln|u|/2+C" },
    { question: "∫ x·cosx dx = ?", options: ["xsinx+cosx+C", "xsinx-cosx+C", "cosx+xsinx+C", "-xcosx+sinx+C"], correctIndex: 0, explanation: "分部：u=x,dv=cosxdx。=xsinx-∫sinxdx=xsinx+cosx+C" },
    { question: "分部积分u选哪个优先级最高？", options: ["幂函数", "指数函数", "三角函数", "反三角函数"], correctIndex: 3, explanation: "反对幂指三，反三角函数最优先" },
    { question: "∫ e^(2x) dx = ?", options: ["e^(2x)+C", "2e^(2x)+C", "e^(2x)/2+C", "e^x²+C"], correctIndex: 2, explanation: "u=2x,dx=du/2，∫e^u·du/2=e^u/2+C" },
    { question: "∫ sec²x dx = ?", options: ["tanx+C", "secx+C", "secx·tanx+C", "ln|secx|+C"], correctIndex: 0, explanation: "(tanx)'=sec²x，这是基本公式" },
    { question: "∫ x/(1+x²) dx = ?", options: ["arctanx+C", "ln(1+x²)/2+C", "ln(1+x²)+C", "x²/(1+x²)+C"], correctIndex: 1, explanation: "u=1+x²,du=2xdx。∫1/u·du/2=ln|u|/2+C" },
    { question: "∫ 1/x dx (x<0) = ?", options: ["lnx+C", "ln(-x)+C", "-lnx+C", "ln|x|+C"], correctIndex: 3, explanation: "x<0时ln(-x)导数=1/x，但写ln|x|+C总是对的" },
  ],
};

export default chapter;
