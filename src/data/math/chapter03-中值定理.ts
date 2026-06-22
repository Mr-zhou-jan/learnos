import { ChapterContent } from "./types";

const chapter: ChapterContent = {
  subject: "高等数学",
  chapter: "中值定理与导数应用",
  examWeight: 4,
  examScore: "约15分/100",
  formulas: [
    { name: "罗尔定理", latex: "f(a)=f(b) ⇒ 存在ξ∈(a,b)使f'(ξ)=0", note: "两端点函数值相等是前提" },
    { name: "拉格朗日中值定理", latex: "存在ξ∈(a,b)使f'(ξ)=[f(b)-f(a)]/(b-a)", note: "罗尔定理的推广" },
    { name: "泰勒/麦克劳林公式", latex: "f(x)=Σf^(n)(x₀)(x-x₀)^n/n!+Rn", note: "e^x=1+x+x²/2!+x³/3!+..., sinx=x-x³/3!+..., cosx=1-x²/2!+..., ln(1+x)=x-x²/2+x³/3-..." },
    { name: "单调性判定", latex: "f'(x)>0⇒递增, f'(x)<0⇒递减", note: "一阶导数符号决定增减" },
    { name: "极值判定", latex: "f'(x₀)=0且f''(x₀)>0⇒极小, f''(x₀)<0⇒极大", note: "一阶导为零+二阶导定号" },
    { name: "凹凸性与拐点", latex: "f''(x)>0⇒凹(∪), f''(x)<0⇒凸(∩)", note: "二阶导变号处为拐点" },
  ],
  problemTypes: [
    {
      name: "中值定理证明",
      examFrequency: "压轴常见",
      example: {
        question: "证明：当x>0时，x/(1+x)<ln(1+x)<x",
        answer: "构造函数+拉格朗日中值",
        solution: "令f(t)=ln(1+t)，在[0,x]上用拉格朗日：ln(1+x)-0=f'(ξ)·x=x/(1+ξ)，0<ξ<x，所以x/(1+x)<x/(1+ξ)<x",
        steps: ["构造函数f(t)=ln(1+t)", "在[0,x]上用拉格朗日", "利用ξ∈(0,x)缩放"],
      },
      practice: {
        question: "证明：e^x≥1+x（x∈R）",
        answer: "先构造再导",
        solution: "令f(x)=e^x-1-x，f'(x)=e^x-1，唯一驻点x=0，f''(x)=e^x>0，极小值f(0)=0，所以f(x)≥0",
        steps: ["构造函数", "求导找驻点", "二阶导判定", "得证"],
      },
    },
    {
      name: "泰勒展开",
      examFrequency: "必考",
      example: {
        question: "写出e^x的三阶麦克劳林公式（带拉格朗日余项）",
        answer: "e^x=1+x+x²/2+x³/6+e^(θx)·x⁴/24 (0<θ<1)",
        solution: "f(0)=f'(0)=f''(0)=f'''(0)=1，所以e^x=1+x+x²/2+x³/6+e^(θx)x⁴/24",
        steps: ["计算各阶导在0的值", "代入泰勒公式", "写拉格朗日余项"],
      },
      practice: {
        question: "写出sinx的三阶麦克劳林公式",
        answer: "sinx=x-x³/6+cos(θx)·x⁵/120",
        solution: "sin0=0,cos0=1,-sin0=0,-cos0=-1，所以sinx=x-x³/6+R₄",
        steps: ["求各阶导在0的值", "代入公式", "写余项"],
      },
    },
    {
      name: "单调区间与极值",
      examFrequency: "每次必考",
      example: {
        question: "求f(x)=x³-3x的单调区间和极值",
        answer: "增:(-∞,-1)∪(1,+∞)；减:(-1,1)；极大f(-1)=2；极小f(1)=-2",
        solution: "f'=3x²-3=3(x+1)(x-1)，驻点±1。f''=6x，f''(-1)=-6<0极大，f''(1)=6>0极小",
        steps: ["求一阶导分解因式", "画符号表", "二阶导判定类型", "计算极值"],
      },
      practice: {
        question: "求f(x)=xe^x的极值",
        answer: "极小值f(-1)=-1/e",
        solution: "f'=e^x(1+x)，驻点x=-1，x<-1递减，x>-1递增，极小值=-e^(-1)=-1/e",
        steps: ["求一阶导", "找驻点", "判断符号", "计算极值"],
      },
    },
    {
      name: "闭区间上求最值",
      examFrequency: "应用题常考",
      example: {
        question: "求f(x)=x³-3x+2在[-2,2]上的最值",
        answer: "最大f(-1)=4/f(2)=4，最小f(-2)=f(1)=0",
        solution: "f'=3x²-3，驻点x=±1。比较：f(-2)=0, f(-1)=4, f(1)=0, f(2)=4。最大4，最小0",
        steps: ["求导找驻点", "计算驻点和端点值", "比较取最值"],
      },
      practice: {
        question: "求f(x)=x+1/x在[1/2,2]上的最值",
        answer: "最大2.5，最小2",
        solution: "f'=1-1/x²，驻点x=1。f(1/2)=2.5, f(1)=2, f(2)=2.5。最大2.5，最小2",
        steps: ["求导找驻点", "计算并比较", "得最值"],
      },
    },
  ],
  traps: [
    "⚠️ 罗尔定理三条件缺一不可：闭区间连续+开区间可导+端点相等",
    "⚠️ 驻点不一定是极值点！x³在x=0处导数为0但不是极值",
    "⚠️ 极值看f'变号，拐点看f''变号，别搞混",
    "⚠️ 泰勒展开别忘了余项！没有余项是近似公式",
  ],
  speedRun: [
    { question: "罗尔定理需要几个条件？", options: ["1", "2", "3", "4"], correctIndex: 2, explanation: "闭区间连续+开区间可导+端点等值，三个条件" },
    { question: "f(x)=x³在[-1,1]上能用罗尔定理吗？", options: ["能", "不能（端点不等）", "不能（不可导）", "不能（不连续）"], correctIndex: 1, explanation: "f(-1)=-1≠f(1)=1，不满足端点相等" },
    { question: "sinx的麦克劳林展开到x³项？", options: ["1+x-x²/2", "x-x³/6", "x+x²/2", "1-x³/3"], correctIndex: 1, explanation: "sinx=x-x³/3!+...=x-x³/6" },
    { question: "f(x)=x²e^(-x)的极大值点？", options: ["x=0", "x=1", "x=2", "没有"], correctIndex: 2, explanation: "f'=x(2-x)e^(-x)，驻点0,2，f''(0)>0极小，f''(2)<0极大" },
    { question: "曲线y=x³的拐点在？", options: ["x=0", "x=1", "x=-1", "没有"], correctIndex: 0, explanation: "y''=6x，在x=0处由负变正" },
    { question: "f'(x₀)=0,f''(x₀)<0⇒？", options: ["极大值", "极小值", "拐点", "不确定"], correctIndex: 0, explanation: "一阶导=0+二阶导<0⇒极大值" },
    { question: "拉格朗日中值定理的结论？", options: ["f'(ξ)=0", "f'(ξ)=平均变化率", "f(ξ)=平均值", "ξ在区间中点"], correctIndex: 1, explanation: "存在ξ使f'(ξ)=[f(b)-f(a)]/(b-a)" },
    { question: "e^x泰勒展开到x²是？", options: ["1+x", "1+x+x²/2", "1+x+x²", "e+xe+x²/2"], correctIndex: 1, explanation: "e^x=1+x+x²/2!+...=1+x+x²/2" },
  ],
};

export default chapter;
