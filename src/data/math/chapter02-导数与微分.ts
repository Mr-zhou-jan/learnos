import { ChapterContent } from "./types";

const chapter: ChapterContent = {
  subject: "高等数学",
  chapter: "导数与微分",
  examWeight: 5,
  examScore: "约18分/100",
  formulas: [
    { name: "导数定义", latex: "f'(x)=lim(h→0)[f(x+h)-f(x)]/h", note: "分段函数在分界点求导必用定义" },
    { name: "基本求导公式", latex: "(x^n)'=nx^(n-1), (e^x)'=e^x, (lnx)'=1/x, (sinx)'=cosx, (cosx)'=-sinx", note: "滚瓜烂熟！不然后面积分没法做" },
    { name: "乘法法则", latex: "(uv)'=u'v+uv'", note: "乘法的导数 ≠ 导数的乘积！" },
    { name: "除法法则", latex: "(u/v)'=(u'v-uv')/v²", note: "分母平方别忘，分子是减号" },
    { name: "链式法则", latex: "dy/dx=dy/du·du/dx", note: "复合函数求导核心，从外往里一层层剥" },
    { name: "隐函数求导", latex: "F(x,y)=0两边对x求导，y是x的函数", note: "遇到y就乘y'" },
    { name: "参数方程求导", latex: "dy/dx=(dy/dt)/(dx/dt)", note: "二阶导：d²y/dx²=(dy'/dt)/(dx/dt)" },
    { name: "对数求导法", latex: "取对数后两边求导", note: "幂指函数、多因式乘除时的利器" },
  ],
  problemTypes: [
    {
      name: "导数定义求极限",
      examFrequency: "必考",
      example: {
        question: "设f'(x₀)存在，求 lim(h→0)[f(x₀+h)-f(x₀-h)]/h",
        answer: "2f'(x₀)",
        solution: "=[f(x₀+h)-f(x₀)]/h + [f(x₀)-f(x₀-h)]/h → f'(x₀)+f'(x₀)=2f'(x₀)",
        steps: ["拆成两个差商", "分别用导数定义", "相加得2f'(x₀)"],
      },
      practice: {
        question: "设f'(0)=2，求 lim(x→0)[f(2x)-f(0)]/x",
        answer: "4",
        solution: "=2·lim(2x→0)[f(2x)-f(0)]/(2x)=2f'(0)=4",
        steps: ["提出常数2", "用导数定义", "代入f'(0)=2"],
      },
    },
    {
      name: "复合函数求导（链式法则）",
      examFrequency: "每次必考",
      example: {
        question: "y=ln(sin x²)，求dy/dx",
        answer: "2x·cot(x²)",
        solution: "y'=[1/sin(x²)]·cos(x²)·2x=2x·cot(x²)",
        steps: ["外层ln求导：1/sin(x²)", "中层sin求导：cos(x²)", "内层x²求导：2x", "连乘"],
      },
      practice: {
        question: "y=e^(sin x)，求y'",
        answer: "e^(sin x)·cos x",
        solution: "外层e^u不变，内层sinx求导=cosx，相乘",
        steps: ["外层e^u求导", "内层sinx求导", "相乘"],
      },
    },
    {
      name: "隐函数求导",
      examFrequency: "常见考题",
      example: {
        question: "x²+y²=1确定y=y(x)，求dy/dx",
        answer: "-x/y",
        solution: "两边对x求导：2x+2y·y'=0，所以y'=-x/y",
        steps: ["两边对x求导", "y²导数为2y·y'", "解出y'"],
      },
      practice: {
        question: "e^y+xy=e确定y=y(x)，求y'在(0,1)处的值",
        answer: "-1/e",
        solution: "e^y·y'+y+xy'=0，y'(e^y+x)=-y，y'=-y/(e^y+x)，代入：-1/e",
        steps: ["两边对x求导", "整理y'项", "代入点坐标"],
      },
    },
    {
      name: "参数方程求导",
      examFrequency: "期末高频",
      example: {
        question: "x=t², y=t³，求dy/dx和d²y/dx²",
        answer: "dy/dx=3t/2, d²y/dx²=3/(4t)",
        solution: "dy/dx=(3t²)/(2t)=3t/2；d²y/dx²=(3/2)/(2t)=3/(4t)",
        steps: ["分别求dy/dt和dx/dt", "相除得一阶导", "一阶导再对t求导÷dx/dt"],
      },
      practice: {
        question: "x=cos t, y=sin t，求dy/dx在t=π/4处的值",
        answer: "-1",
        solution: "dy/dx=cos t/(-sin t)=-cot t，t=π/4时=-1",
        steps: ["求dx/dt和dy/dt", "相除", "代入"],
      },
    },
  ],
  traps: [
    "⚠️ (uv)'≠u'v'！必须用乘法法则",
    "⚠️ 隐函数求导时y是x的函数，对y求导要乘y'",
    "⚠️ 参数方程二阶导不是直接再除一次！是dy'/dt÷dx/dt",
    "⚠️ 分段函数在分段点必须用定义求导，不能直接套公式",
  ],
  speedRun: [
    { question: "y=ln(cos x)的导数是？", options: ["tan x", "-tan x", "cot x", "-cot x"], correctIndex: 1, explanation: "y'=(1/cosx)·(-sinx)=-tanx" },
    { question: "y=x^x (x>0)的导数是？", options: ["x·x^(x-1)", "x^x·lnx", "x^x(1+lnx)", "x^x/(lnx)"], correctIndex: 2, explanation: "取对数lny=xlnx，求导y'/y=lnx+1，y'=x^x(1+lnx)" },
    { question: "x²+xy+y²=4在(2,-2)处切线斜率？", options: ["1", "-1", "2", "-2"], correctIndex: 0, explanation: "2x+y+xy'+2yy'=0，代入得y'=1" },
    { question: "y=arctan(e^x)的y'=？", options: ["e^x/(1+e^2x)", "1/(1+e^2x)", "e^x/arctan(e^x)", "1/(1+e^x)"], correctIndex: 0, explanation: "arctan(u)'=1/(1+u²)，u=e^x，链式相乘" },
    { question: "参数方程x=2t, y=t²+1，dy/dx=？", options: ["t", "2t", "t/2", "4t"], correctIndex: 0, explanation: "dx/dt=2, dy/dt=2t, dy/dx=2t/2=t" },
    { question: "f(x)=|x|在x=0处的导数？", options: ["0", "1", "-1", "不存在"], correctIndex: 3, explanation: "左导数=-1，右导数=1，不相等" },
    { question: "y=(sinx)/x的y'=？", options: ["cosx/x", "(xcosx-sinx)/x²", "(cosx-xsinx)/x²", "(xcosx+sinx)/x²"], correctIndex: 1, explanation: "除法法则：分子导×分母-分子×分母导，除以分母平方" },
    { question: "y=³√(x²)在x=0处可导吗？", options: ["可导", "不可导", "导数为0", "导数无穷"], correctIndex: 1, explanation: "y=x^(2/3)，y'=(2/3)x^(-1/3)在x=0无定义" },
  ],
};

export default chapter;
