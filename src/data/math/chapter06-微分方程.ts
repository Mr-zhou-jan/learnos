import { ChapterContent } from "./types";

const chapter: ChapterContent = {
  subject: "高等数学",
  chapter: "微分方程",
  examWeight: 4,
  examScore: "约12分/100",
  formulas: [
    { name: "可分离变量", latex: "dy/dx=f(x)g(y) → ∫dy/g(y)=∫f(x)dx", note: "x和y分别移到等号两边，各自积分" },
    { name: "一阶线性通解公式", latex: "y'+P(x)y=Q(x) → y=e^(-∫Pdx)[∫Q·e^(∫Pdx)dx+C]", note: "积分因子μ=e^(∫Pdx)。核心：乘μ后左边变成(μy)'" },
    { name: "伯努利方程", latex: "y'+P(x)y=Q(x)y^n (n≠0,1)", note: "令z=y^(1-n)化为一阶线性" },
    { name: "二阶常系数齐次", latex: "y''+py'+qy=0 → 特征方程r²+pr+q=0", note: "不等实根→C₁e^(r₁x)+C₂e^(r₂x)；重根→(C₁+C₂x)e^(rx)；共轭复根→e^(αx)(C₁cosβx+C₂sinβx)" },
    { name: "二阶常系数非齐次特解", latex: "f(x)=Pm(x)e^(λx)型", note: "λ不是根→Qm(x)e^(λx)；单根→xQm(x)e^(λx)；重根→x²Qm(x)e^(λx)" },
    { name: "可降阶方程", latex: "缺y型：令p=y'；缺x型：令p=y',y''=p·dp/dy", note: "没有y用第一种，没有x用第二种" },
  ],
  problemTypes: [
    {
      name: "可分离变量方程",
      examFrequency: "每次必考",
      example: {
        question: "解 dy/dx = 2xy，满足y(0)=1",
        answer: "y = e^(x²)",
        solution: "分离：dy/y=2xdx。积分：ln|y|=x²+C。y=Ce^(x²)。代入y(0)=1得C=1",
        steps: ["分离：dy/y=2xdx", "两边积分", "解出y=Ce^(x²)", "代入初值"],
      },
      practice: {
        question: "解 dy/dx = y·cosx，y(0)=1",
        answer: "y = e^(sinx)",
        solution: "dy/y=cosxdx，ln|y|=sinx+C，y=Ce^(sinx)，y(0)=C=1",
        steps: ["分离", "积分", "代入初值"],
      },
    },
    {
      name: "一阶线性方程（通解公式）",
      examFrequency: "必考",
      example: {
        question: "解 y' + y/x = x²",
        answer: "y = x³/4 + C/x",
        solution: "P=1/x,Q=x²。μ=e^(∫1/xdx)=x。y=(1/x)[∫x·x²dx+C]=(1/x)[x⁴/4+C]=x³/4+C/x",
        steps: ["找P(x)=1/x, Q(x)=x²", "求积分因子μ=x", "套公式", "化简"],
      },
      practice: {
        question: "解 y' + 2xy = x，y(0)=1",
        answer: "y = 1/2 + e^(-x²)/2",
        solution: "μ=e^(∫2xdx)=e^(x²)。y=e^(-x²)[∫xe^(x²)dx+C]=e^(-x²)[e^(x²)/2+C]=1/2+Ce^(-x²)。y(0)=1/2+C=1⇒C=1/2",
        steps: ["求μ", "套公式", "代初值"],
      },
    },
    {
      name: "二阶常系数齐次方程",
      examFrequency: "期末必考",
      example: {
        question: "解 y'' - 3y' + 2y = 0",
        answer: "y = C₁e^x + C₂e^(2x)",
        solution: "特征方程：r²-3r+2=0。(r-1)(r-2)=0，r₁=1,r₂=2，不等实根",
        steps: ["写特征方程", "解特征根", "套不等实根公式"],
      },
      practice: {
        question: "解 y'' + 4y' + 4y = 0",
        answer: "y = (C₁ + C₂x)e^(-2x)",
        solution: "r²+4r+4=0，(r+2)²=0，重根r=-2→(C₁+C₂x)e^(-2x)",
        steps: ["特征方程", "重根", "套重根公式"],
      },
    },
    {
      name: "二阶非齐次求特解",
      examFrequency: "常见",
      example: {
        question: "y'' - y = e^x 的一个特解设为？",
        answer: "y* = (1/2)xe^x",
        solution: "齐次通解：r²-1=0, r=±1。f(x)=e^x中λ=1是单根，设y*=Axe^x。代入得A=1/2",
        steps: ["先求齐次通解", "λ=1是特征根（单根）", "设特解y*=Axe^x", "代入求A"],
      },
      practice: {
        question: "y'' - 2y' + y = e^x 特解设为？",
        answer: "y* = Ax²e^x",
        solution: "齐次：r²-2r+1=0，r=1重根。λ=1是二重根，设y*=Ax²e^x",
        steps: ["求特征根：r=1重根", "λ=1是二重根", "特解设x²Ae^x"],
      },
    },
  ],
  traps: [
    "⚠️ 一阶线性方程必须先写成y'+P(x)y=Q(x)标准形，y'系数=1",
    "⚠️ 可分离变量别忘了绝对值：ln|y|而不是lny",
    "⚠️ 非齐次特解形式看λ是不是特征根：不是→Ae^(λx)，单根→Axe^(λx)，重根→Ax²e^(λx)",
    "⚠️ 共轭复根sin/cos前都是+号：e^(αx)(C₁cosβx+C₂sinβx)",
  ],
  speedRun: [
    { question: "dy/dx=2xy是哪种方程？", options: ["可分离变量", "一阶线性", "伯努利", "二阶"], correctIndex: 0, explanation: "写成dy/y=2xdx即可分离" },
    { question: "y'+y/x=x²的积分因子μ=？", options: ["1/x", "x", "e^x", "lnx"], correctIndex: 1, explanation: "μ=e^(∫1/xdx)=e^(lnx)=x" },
    { question: "y''-4y=0的通解？", options: ["C₁e^(2x)+C₂e^(-2x)", "C₁cos2x+C₂sin2x", "(C₁+C₂x)e^(2x)", "C₁e^(4x)+C₂"], correctIndex: 0, explanation: "r²=4⇒r=±2，不等实根" },
    { question: "y''+y=0的通解？", options: ["C₁e^x+C₂e^(-x)", "C₁cosx+C₂sinx", "C₁cosx-C₂sinx", "e^x(C₁+C₂x)"], correctIndex: 1, explanation: "r²+1=0⇒r=±i，α=0,β=1→C₁cosx+C₂sinx" },
    { question: "y'=y的通解？", options: ["y=Cx", "y=Ce^x", "y=x+C", "y=e^x+C"], correctIndex: 1, explanation: "dy/y=dx，ln|y|=x+C⇒y=Ce^x" },
    { question: "y''+4y'+4y=0特征根？", options: ["r=±2", "r=-2(重根)", "r=2(重根)", "r=±2i"], correctIndex: 1, explanation: "(r+2)²=0⇒r=-2重根" },
    { question: "y''-y=e^x中λ=1是特征根的？", options: ["不是根", "单根", "重根", "共轭根"], correctIndex: 1, explanation: "r²-1=0⇒r=±1，λ=1是其中一个" },
    { question: "y''+2y'+y=0满足y(0)=1,y'(0)=0的解？", options: ["e^(-x)", "(1+x)e^(-x)", "e^x", "cosx"], correctIndex: 1, explanation: "r=-1重根，y=(C₁+C₂x)e^(-x)，代入初始条件得C₁=1,C₂=1" },
  ],
};

export default chapter;
