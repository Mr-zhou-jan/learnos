import { ChapterContent } from "./types";

const chapter: ChapterContent = {
  subject: "高等数学",
  chapter: "定积分",
  examWeight: 5,
  examScore: "约18分/100",
  formulas: [
    { name: "牛顿-莱布尼茨公式", latex: "∫[a,b] f(x)dx = F(b)-F(a)", note: "定积分计算核心！先求原函数再代上下限" },
    { name: "定积分换元", latex: "∫[a,b]f(x)dx=∫[α,β]f[g(t)]g'(t)dt", note: "换元同时换限！x=a→t=α, x=b→t=β" },
    { name: "定积分分部积分", latex: "∫[a,b]udv = uv|[a,b] - ∫[a,b]vdu", note: "和不定积分一样，最后代上下限" },
    { name: "对称性简化", latex: "偶函数:∫[-a,a]=2∫[0,a]; 奇函数:∫[-a,a]=0", note: "见到对称区间先判断奇偶！省一半时间" },
    { name: "变上限积分求导", latex: "d/dx ∫[a,x] f(t)dt = f(x)", note: "上限是x²要乘2x！上限是函数必须链式" },
    { name: "反常积分", latex: "无穷限：lim(b→∞)∫[a,b]; 瑕积分：lim(ε→0)∫[a,b-ε]", note: "先算定积分再取极限，判断收敛/发散" },
    { name: "定积分的面积应用", latex: "面积=∫[a,b]|f(x)|dx 或 ∫|f(x)-g(x)|dx", note: "注意正负号！f<0时积分是负的" },
  ],
  problemTypes: [
    {
      name: "牛顿-莱布尼茨公式",
      examFrequency: "每次必考",
      example: {
        question: "∫[0,1] x² dx",
        answer: "1/3",
        solution: "原函数F(x)=x³/3。∫[0,1]x²dx=F(1)-F(0)=1/3-0=1/3",
        steps: ["原函数x³/3", "F(1)=1/3", "F(0)=0", "相减得1/3"],
      },
      practice: {
        question: "∫[0,π] sinx dx",
        answer: "2",
        solution: "原函数=-cosx。F(π)-F(0)=(-cosπ)-(-cos0)=1-(-1)=2",
        steps: ["原函数-cosx", "F(π)=1", "F(0)=-1", "相减得2"],
      },
    },
    {
      name: "定积分换元法",
      examFrequency: "必考",
      example: {
        question: "∫[0,1] 1/(1+√x) dx",
        answer: "2-2ln2",
        solution: "令√x=t,x=t²,dx=2tdt。x:0→1→t:0→1。=∫[0,1]2t/(1+t)dt=2∫(1-1/(1+t))dt=2[t-ln(1+t)]|[0,1]=2(1-ln2)",
        steps: ["令t=√x", "换元换限", "化简", "积分代限"],
      },
      practice: {
        question: "∫[0,1] x√(1-x²) dx",
        answer: "1/3",
        solution: "令u=1-x²,du=-2xdx。x:0→1→u:1→0。=∫[1,0]√u(-du/2)=1/2·∫[0,1]u^(1/2)du=1/2·(2/3)u^(3/2)|[0,1]=1/3",
        steps: ["令u=1-x²", "换元换限", "积分", "代限"],
      },
    },
    {
      name: "变上限积分求导",
      examFrequency: "高频",
      example: {
        question: "设F(x)=∫[0,x] e^(t²) dt，求F'(x)",
        answer: "e^(x²)",
        solution: "直接：F'(x)=e^(x²)（被积函数t换成x）",
        steps: ["识别变上限积分", "被积函数t换成x"],
      },
      practice: {
        question: "F(x)=∫[0,x²] sin(t²)dt，求F'(x)",
        answer: "2x·sin(x⁴)",
        solution: "上限是函数！链式：F'(x)=sin((x²)²)·2x=2x·sin(x⁴)",
        steps: ["上限是x²需要链式法则", "被积函数t换成x²", "乘以x²的导数2x"],
      },
    },
    {
      name: "对称区间+奇偶性",
      examFrequency: "常见",
      example: {
        question: "∫[-π,π] x·cosx dx",
        answer: "0",
        solution: "x奇函数×cosx偶函数=奇函数。对称区间上奇函数定积分=0",
        steps: ["x奇", "cosx偶", "奇×偶=奇", "奇函数对称区间积分=0"],
      },
      practice: {
        question: "∫[-1,1] (x³+1) dx",
        answer: "2",
        solution: "x³奇=0，1偶=2∫[0,1]1dx=2。结果是2",
        steps: ["拆开奇偶", "奇函数0", "偶函数2×面积"],
      },
    },
  ],
  traps: [
    "⚠️ 定积分换元必须同时换上下限！这是和不定积分最大的区别",
    "⚠️ 变上限积分求导：上限是x²要乘2x！上限是函数必须链式法则",
    "⚠️ 求面积注意正负：曲线在x轴下方时积分是负的，面积取绝对值",
    "⚠️ 分部积分代限时uv|[a,b]先算乘积再相减，别漏了",
  ],
  speedRun: [
    { question: "∫[0,1] 3x² dx = ?", options: ["1", "3", "0", "1/3"], correctIndex: 0, explanation: "原函数=x³，F(1)-F(0)=1" },
    { question: "∫[-1,1] x³ dx = ?", options: ["0", "1/2", "1/4", "2"], correctIndex: 0, explanation: "x³奇函数，对称区间积分为0" },
    { question: "d/dx ∫[0,x] ln(1+t²)dt = ?", options: ["ln(1+x²)", "ln(1+t²)", "2x/(1+x²)", "x·ln(1+x²)"], correctIndex: 0, explanation: "变上限积分求导，t换成x" },
    { question: "∫[0,π/2] cosx dx = ?", options: ["0", "1", "2", "-1"], correctIndex: 1, explanation: "原函数=sinx，sin(π/2)-sin0=1" },
    { question: "d/dx ∫[0,x²] e^t dt = ?", options: ["e^(x²)", "2xe^(x²)", "e^x", "e^(x²)+C"], correctIndex: 1, explanation: "上限x²，链式：e^(x²)·2x" },
    { question: "∫[0,1] 1/√x dx = ?", options: ["发散", "1", "2", "1/2"], correctIndex: 2, explanation: "瑕积分，原函数2√x，lim=2" },
    { question: "∫[-2,2] sinx/(1+x²) dx = ?", options: ["0", "1", "2", "发散"], correctIndex: 0, explanation: "分子奇分母偶=奇函数，对称区间=0" },
    { question: "∫[0,π] x·sinx dx = ?", options: ["0", "π", "-π", "2π"], correctIndex: 1, explanation: "分部积分：u=x,dv=sinxdx。=-xcosx|[0,π]+∫cosxdx=π+0=π" },
  ],
};

export default chapter;
