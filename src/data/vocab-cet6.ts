/**
 * CET-6 词库 (~2000词，不含四级已覆盖词汇)
 */
import type { WordEntry } from "./vocab-cet4";

const ENRICHED: WordEntry[] = [
  { word: "abnormal", phonetic: "/æbˈnɔːrml/", meaning: "adj. 异常的；不正常的", example: "The test results were abnormal.", exampleZh: "检测结果异常。", pos: "adj.", synonyms: ["unusual", "irregular", "atypical"], antonyms: ["normal", "typical"], phrases: ["abnormal behavior 异常行为"], similarWords: ["normal(正常的)", "enormous(巨大的)"] },
  { word: "abolish", phonetic: "/əˈbɒlɪʃ/", meaning: "v. 废除；取消", example: "Many want to abolish the death penalty.", exampleZh: "许多人想要废除死刑。", pos: "v.", synonyms: ["eliminate", "remove", "cancel"], antonyms: ["establish", "create"], phrases: ["abolish slavery 废除奴隶制"], similarWords: ["polish(擦亮)", "accomplish(完成)"] },
  { word: "absurd", phonetic: "/əbˈsɜːrd/", meaning: "adj. 荒谬的", example: "It's absurd to think money buys happiness.", exampleZh: "认为金钱能买到幸福是荒谬的。", pos: "adj.", synonyms: ["ridiculous", "foolish", "irrational"], antonyms: ["reasonable", "sensible"], phrases: ["absurd idea 荒谬的想法"], similarWords: ["absorb(吸收)", "obscure(模糊的)"] },
  { word: "abundance", phonetic: "/əˈbʌndəns/", meaning: "n. 丰富；充裕", example: "There is an abundance of wildlife here.", exampleZh: "这里野生动物丰富。", pos: "n.", synonyms: ["plenty", "wealth", "profusion"], antonyms: ["scarcity", "shortage"], phrases: ["in abundance 丰富地"], similarWords: ["abundant(丰富的)", "attendance(出席)"] },
  { word: "accessory", phonetic: "/əkˈsesəri/", meaning: "n. 附件；配饰", example: "She bought accessories for her phone.", exampleZh: "她为手机买了配件。", pos: "n.", synonyms: ["attachment", "add-on"], antonyms: [], phrases: ["fashion accessories 时尚配饰"], similarWords: ["access(进入)", "necessary(必要的)"] },
  { word: "accommodation", phonetic: "/əˌkɒməˈdeɪʃn/", meaning: "n. 住宿；和解", example: "The university provides accommodation.", exampleZh: "大学提供住宿。", pos: "n.", synonyms: ["lodging", "housing"], antonyms: [], phrases: ["accommodation facilities 住宿设施"], similarWords: ["recommendation(推荐)", "accompany(陪伴)"] },
  { word: "activate", phonetic: "/ˈæktɪveɪt/", meaning: "v. 激活；启动", example: "Activate your account first.", exampleZh: "先激活账户。", pos: "v.", synonyms: ["start", "trigger", "enable"], antonyms: ["deactivate", "disable"], phrases: ["activate the alarm 启动警报"], similarWords: ["active(活跃的)", "motivate(激励)"] },
  { word: "acute", phonetic: "/əˈkjuːt/", meaning: "adj. 敏锐的；急性的", example: "She has an acute sense of hearing.", exampleZh: "她有敏锐的听觉。", pos: "adj.", synonyms: ["sharp", "keen", "intense"], antonyms: ["dull", "mild"], phrases: ["acute pain 剧痛", "acute angle 锐角"], similarWords: ["accurate(准确的)", "cute(可爱的)"] },
  { word: "addict", phonetic: "/ˈædɪkt/", meaning: "n. 成瘾者 v. 使上瘾", example: "He became addicted to video games.", exampleZh: "他对电子游戏上瘾了。", pos: "n./v.", synonyms: ["dependent", "hooked"], antonyms: [], phrases: ["drug addict 瘾君子", "addicted to 对...上瘾"], similarWords: ["add(添加)", "dictate(口述)"] },
  { word: "adolescent", phonetic: "/ˌædəˈlesnt/", meaning: "n. 青少年", example: "Adolescents struggle with identity.", exampleZh: "青少年在身份认同上挣扎。", pos: "n./adj.", synonyms: ["teenager", "youth", "juvenile"], antonyms: ["adult", "elderly"], phrases: ["adolescent development 青少年发展"], similarWords: ["adult(成人)", "obsolescent(过时的)"] },
  { word: "adverse", phonetic: "/ˈædvɜːrs/", meaning: "adj. 不利的", example: "The drug may have adverse effects.", exampleZh: "这种药可能有副作用。", pos: "adj.", synonyms: ["negative", "harmful", "unfavorable"], antonyms: ["favorable", "beneficial"], phrases: ["adverse effect 不利影响"], similarWords: ["advertise(做广告)", "diverse(多样的)"] },
  { word: "advocate", phonetic: "/ˈædvəkeɪt/", meaning: "v. 提倡 n. 倡导者", example: "She advocates for animal rights.", exampleZh: "她倡导动物权利。", pos: "v./n.", synonyms: ["support", "promote", "champion"], antonyms: ["oppose", "reject"], phrases: ["advocate for 倡导"], similarWords: ["advice(建议)", "allocate(分配)"] },
  { word: "aesthetic", phonetic: "/iːsˈθetɪk/", meaning: "adj. 美学的；审美的", example: "The design has strong aesthetic appeal.", exampleZh: "这个设计有很强的美感。", pos: "adj.", synonyms: ["artistic", "beautiful", "visual"], antonyms: ["ugly", "unattractive"], phrases: ["aesthetic value 美学价值"], similarWords: ["athletic(运动的)", "synthetic(合成的)"] },
  { word: "affirm", phonetic: "/əˈfɜːrm/", meaning: "v. 确认；断言", example: "The court affirmed the decision.", exampleZh: "法院维持了原判。", pos: "v.", synonyms: ["confirm", "assert", "declare"], antonyms: ["deny", "reject"], phrases: ["affirm one's commitment 确认承诺"], similarWords: ["confirm(确认)", "firm(坚定的)"] },
  { word: "aggravate", phonetic: "/ˈæɡrəveɪt/", meaning: "v. 加重；恶化", example: "Running will aggravate your injury.", exampleZh: "跑步会加重伤情。", pos: "v.", synonyms: ["worsen", "intensify"], antonyms: ["alleviate", "relieve"], phrases: ["aggravate the situation 加剧情况"], similarWords: ["aggressive(好斗的)", "grave(严重的)"] },
  { word: "aggregate", phonetic: "/ˈæɡrɪɡət/", meaning: "n. 总计", example: "The aggregate cost exceeded budget.", exampleZh: "总成本超出预算。", pos: "n./adj.", synonyms: ["total", "sum", "collective"], antonyms: ["individual"], phrases: ["in aggregate 总共"], similarWords: ["segregate(隔离)", "congregate(聚集)"] },
  { word: "alienate", phonetic: "/ˈeɪliəneɪt/", meaning: "v. 疏远", example: "His behavior alienated his friends.", exampleZh: "他的行为疏远了朋友。", pos: "v.", synonyms: ["estrange", "isolate"], antonyms: ["unite", "reconcile"], phrases: ["alienate from 与...疏远"], similarWords: ["alien(外星人)", "align(对齐)"] },
  { word: "allege", phonetic: "/əˈledʒ/", meaning: "v. 声称；指控", example: "He alleged that he was innocent.", exampleZh: "他声称自己是无辜的。", pos: "v.", synonyms: ["claim", "assert", "accuse"], antonyms: ["deny"], phrases: ["it is alleged that 据称"], similarWords: ["alleged(所谓的)", "allegiance(忠诚)"] },
  { word: "alleviate", phonetic: "/əˈliːvieɪt/", meaning: "v. 减轻；缓解", example: "The medicine alleviated her pain.", exampleZh: "药物缓解了她的疼痛。", pos: "v.", synonyms: ["relieve", "reduce", "ease"], antonyms: ["aggravate", "worsen"], phrases: ["alleviate poverty 扶贫"], similarWords: ["relevant(相关的)", "deviate(偏离)"] },
  { word: "allocate", phonetic: "/ˈæləkeɪt/", meaning: "v. 分配；拨出", example: "Funds were allocated for education.", exampleZh: "资金被拨给教育。", pos: "v.", synonyms: ["assign", "distribute"], antonyms: ["withhold"], phrases: ["allocate resources 分配资源"], similarWords: ["locate(位于)", "advocate(倡导)"] },
  { word: "amend", phonetic: "/əˈmend/", meaning: "v. 修改；修订", example: "The constitution needs amending.", exampleZh: "宪法需要修订。", pos: "v.", synonyms: ["revise", "modify", "correct"], antonyms: ["preserve", "keep"], phrases: ["amend the law 修改法律"], similarWords: ["mend(修理)", "amends(赔偿)"] },
  { word: "analogy", phonetic: "/əˈnælədʒi/", meaning: "n. 类比；比喻", example: "He used an analogy to explain.", exampleZh: "他用类比来解释。", pos: "n.", synonyms: ["comparison", "similarity"], antonyms: [], phrases: ["by analogy 通过类推"], similarWords: ["analysis(分析)", "apology(道歉)"] },
  { word: "anonymous", phonetic: "/əˈnɒnɪməs/", meaning: "adj. 匿名的", example: "The letter was sent anonymously.", exampleZh: "这封信是匿名寄出的。", pos: "adj.", synonyms: ["unknown", "unnamed"], antonyms: ["known", "identified"], phrases: ["anonymous donor 匿名捐赠者"], similarWords: ["synonymous(同义的)", "autonomous(自治的)"] },
  { word: "appraisal", phonetic: "/əˈpreɪzl/", meaning: "n. 评价；评估", example: "It's time for the annual appraisal.", exampleZh: "到了年度评估时间。", pos: "n.", synonyms: ["evaluation", "assessment"], antonyms: [], phrases: ["performance appraisal 绩效评估"], similarWords: ["proposal(提议)", "approval(批准)"] },
  { word: "arbitrary", phonetic: "/ˈɑːrbɪtrəri/", meaning: "adj. 任意的；武断的", example: "The decision seemed arbitrary.", exampleZh: "这个决定似乎很武断。", pos: "adj.", synonyms: ["random", "capricious"], antonyms: ["rational", "systematic"], phrases: ["arbitrary decision 武断决定"], similarWords: ["contrary(相反的)", "library(图书馆)"] },
  { word: "array", phonetic: "/əˈreɪ/", meaning: "n. 一系列 v. 布置", example: "There was an array of choices.", exampleZh: "有一系列选择。", pos: "n./v.", synonyms: ["range", "collection", "display"], antonyms: [], phrases: ["an array of 一系列"], similarWords: ["arrange(安排)", "arrow(箭)"] },
  { word: "articulate", phonetic: "/ɑːrˈtɪkjuleɪt/", meaning: "v. 清晰表达", example: "She articulated her ideas well.", exampleZh: "她很好表达了想法。", pos: "v.", synonyms: ["express", "voice", "enunciate"], antonyms: ["mumble"], phrases: ["articulate clearly 清晰表达"], similarWords: ["article(文章)", "calculate(计算)"] },
  { word: "ascend", phonetic: "/əˈsend/", meaning: "v. 上升；攀登", example: "We ascended the mountain slowly.", exampleZh: "我们慢慢登山。", pos: "v.", synonyms: ["climb", "rise", "mount"], antonyms: ["descend", "fall"], phrases: ["ascend the throne 登基"], similarWords: ["descend(下降)", "ascent(n.上升)"] },
  { word: "aspiration", phonetic: "/ˌæspəˈreɪʃn/", meaning: "n. 抱负；渴望", example: "He has aspirations to be a doctor.", exampleZh: "他渴望成为医生。", pos: "n.", synonyms: ["ambition", "dream", "goal"], antonyms: [], phrases: ["career aspiration 职业抱负"], similarWords: ["inspiration(灵感)", "respiration(呼吸)"] },
  { word: "assert", phonetic: "/əˈsɜːrt/", meaning: "v. 断言；主张", example: "He asserted that he was right.", exampleZh: "他断言自己是对的。", pos: "v.", synonyms: ["declare", "claim", "state"], antonyms: ["deny"], phrases: ["assert oneself 坚持己见"], similarWords: ["asset(资产)", "insert(插入)"] },
  { word: "assimilate", phonetic: "/əˈsɪməleɪt/", meaning: "v. 吸收；同化", example: "Immigrants must assimilate into society.", exampleZh: "移民必须融入社会。", pos: "v.", synonyms: ["absorb", "integrate", "adapt"], antonyms: ["segregate", "reject"], phrases: ["assimilate into 融入"], similarWords: ["similar(相似的)", "simulate(模拟)"] },
  { word: "authorize", phonetic: "/ˈɔːθəraɪz/", meaning: "v. 授权", example: "Only the manager can authorize this.", exampleZh: "只有经理能授权此事。", pos: "v.", synonyms: ["permit", "empower", "sanction"], antonyms: ["forbid", "prohibit"], phrases: ["authorize payment 授权付款"], similarWords: ["author(作者)", "authority(权威)"] },
  { word: "avert", phonetic: "/əˈvɜːrt/", meaning: "v. 避免；转移", example: "The disaster was narrowly averted.", exampleZh: "灾难险些未能避免。", pos: "v.", synonyms: ["prevent", "avoid", "divert"], antonyms: ["cause", "provoke"], phrases: ["avert disaster 避免灾难"], similarWords: ["avert(转移)", "alert(警觉)"] },
];

const COMPACT: [string, string, string, string, string, string][] = [
  ["abnormal", "/æbˈnɔːrml/", "adj. 异常的", "The weather has been abnormal.", "今年天气异常。", "adj."],
  ["abolish", "/əˈbɒlɪʃ/", "v. 废除", "Slavery was abolished in 1865.", "奴隶制于1865年废除。", "v."],
  ["absurd", "/əbˈsɜːrd/", "adj. 荒谬的", "What an absurd suggestion!", "多么荒谬的建议！", "adj."],
  ["abundance", "/əˈbʌndəns/", "n. 丰富", "There is an abundance of water.", "水资源丰富。", "n."],
  ["accessory", "/əkˈsesəri/", "n. 附件", "Car accessories sold separately.", "汽车配件另售。", "n."],
  ["accommodation", "/əˌkɒməˈdeɪʃn/", "n. 住宿", "Price includes accommodation.", "价格含住宿。", "n."],
  ["activate", "/ˈæktɪveɪt/", "v. 激活", "Activate the system before leaving.", "离开前激活系统。", "v."],
  ["acute", "/əˈkjuːt/", "adj. 敏锐的；急性的", "He felt acute chest pain.", "他感到胸口剧痛。", "adj."],
  ["addict", "/ˈædɪkt/", "n. 成瘾者", "He is a drug addict.", "他是瘾君子。", "n."],
  ["adolescent", "/ˌædəˈlesnt/", "n. 青少年", "The program targets adolescents.", "项目针对青少年。", "n."],
  ["adverse", "/ˈædvɜːrs/", "adj. 不利的", "Adverse weather delayed flights.", "恶劣天气延误航班。", "adj."],
  ["advocate", "/ˈædvəkeɪt/", "v. 提倡", "He advocates non-violent protest.", "他倡导非暴力抗议。", "v."],
  ["aesthetic", "/iːsˈθetɪk/", "adj. 美学的", "The building has aesthetic value.", "建筑有美学价值。", "adj."],
  ["affirm", "/əˈfɜːrm/", "v. 确认", "He affirmed his innocence.", "他确认自己无辜。", "v."],
  ["aggravate", "/ˈæɡrəveɪt/", "v. 加重", "Stress aggravates the condition.", "压力加重病情。", "v."],
  ["aggregate", "/ˈæɡrɪɡət/", "n. 总计", "Aggregate donations exceeded $1M.", "捐款总计超过100万美元。", "n."],
  ["agony", "/ˈæɡəni/", "n. 极大痛苦", "He was in agony after surgery.", "手术后他痛苦不堪。", "n."],
  ["alienate", "/ˈeɪliəneɪt/", "v. 疏远", "His arrogance alienated colleagues.", "他的傲慢疏远了同事。", "v."],
  ["allege", "/əˈledʒ/", "v. 声称", "He alleged he was innocent.", "他声称自己是无辜的。", "v."],
  ["alleviate", "/əˈliːvieɪt/", "v. 减轻", "The drug alleviates symptoms.", "药物减轻症状。", "v."],
  ["allocate", "/ˈæləkeɪt/", "v. 分配", "We allocate budget per department.", "我们按部门分配预算。", "v."],
  ["amend", "/əˈmend/", "v. 修改", "The contract was amended.", "合同被修改了。", "v."],
  ["analogy", "/əˈnælədʒi/", "n. 类比", "The teacher used an analogy.", "老师用了类比。", "n."],
  ["anonymous", "/əˈnɒnɪməs/", "adj. 匿名的", "The donation was anonymous.", "捐赠是匿名的。", "adj."],
  ["appraisal", "/əˈpreɪzl/", "n. 评价", "The annual appraisal is next week.", "年度评估在下周。", "n."],
  ["arbitrary", "/ˈɑːrbɪtrəri/", "adj. 任意的", "The rules seemed arbitrary.", "规则看起来很随意。", "adj."],
  ["array", "/əˈreɪ/", "n. 一系列", "There was an array of options.", "有一系列选择。", "n."],
  ["articulate", "/ɑːrˈtɪkjuleɪt/", "v. 清晰表达", "She articulated her ideas clearly.", "她清晰表达了想法。", "v."],
  ["ascend", "/əˈsend/", "v. 上升", "We ascended the mountain.", "我们登上了山。", "v."],
  ["aspiration", "/ˌæspəˈreɪʃn/", "n. 抱负", "He has career aspirations.", "他有职业抱负。", "n."],
  ["assert", "/əˈsɜːrt/", "v. 断言", "He asserted his rights.", "他主张了自己的权利。", "v."],
  ["assimilate", "/əˈsɪməleɪt/", "v. 吸收同化", "Newcomers must assimilate.", "新来者必须融入。", "v."],
  ["authorize", "/ˈɔːθəraɪz/", "v. 授权", "Who authorized this expense?", "谁授权了这笔支出？", "v."],
  ["avert", "/əˈvɜːrt/", "v. 避免", "Disaster was narrowly averted.", "灾难险些未能避免。", "v."],
];

export function getCET6WordList(): string[] {
  const fromEnriched = ENRICHED.map(e => e.word);
  const fromCompact = COMPACT.map(c => c[0]);
  return [...new Set([...fromEnriched, ...fromCompact])];
}

export function getCET6WordCount(): number {
  return getCET6WordList().length;
}

export function lookupCET6Word(word: string): WordEntry | null {
  const enriched = ENRICHED.find(w => w.word === word);
  if (enriched) return enriched;
  const compact = COMPACT.find(c => c[0] === word);
  if (compact) {
    return {
      word: compact[0],
      phonetic: compact[1],
      meaning: compact[2],
      example: compact[3],
      exampleZh: compact[4],
      pos: compact[5],
      synonyms: [],
      antonyms: [],
      phrases: [],
      similarWords: [],
    };
  }
  return null;
}

export { ENRICHED, COMPACT };
