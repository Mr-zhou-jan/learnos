"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, PenLine, Languages, Headphones, FileText, ArrowRight, Link2 } from "lucide-react";

const TABS = [
  { id: "reading", label: "阅读理解", icon: BookOpen, desc: "仔细阅读 · 主旨推理 · 细节定位" },
  { id: "listening", label: "听力训练", icon: Headphones, desc: "短篇新闻 · 长对话 · 短文理解" },
  { id: "writing", label: "作文批改", icon: PenLine, desc: "议论文 · 书信 · 图表作文" },
  { id: "translation", label: "翻译训练", icon: Languages, desc: "文化类 · 经济类 · 社会类" },
  { id: "matching", label: "段落匹配", icon: Link2, desc: "关键词定位 · 同义替换 · 主旨匹配" },
  { id: "cloze", label: "选词填空", icon: FileText, desc: "15选10 · 词汇辨析 · 上下文线索" },
];

// CET-4 categorized content
const CATEGORIES = {
  reading: {
    sections: [
      { name: "仔细阅读", desc: "2篇×5题，考查深度理解与推理", icon: "📖", count: 8 },
    ]
  },
  listening: {
    sections: [
      { name: "短篇新闻听力", desc: "3篇新闻，考查主旨与细节抓取", icon: "📻", count: 6 },
      { name: "长对话听力", desc: "2段对话，考查语境理解与推断", icon: "💬", count: 4 },
      { name: "短文理解听力", desc: "3篇短文，考查综合听力能力", icon: "🎧", count: 6 },
    ]
  },
  writing: {
    sections: [
      { name: "议论文写作", desc: "观点论证类，120-180词", icon: "✍️", count: 8 },
      { name: "书信写作", desc: "建议信/申请信/投诉信等", icon: "📨", count: 6 },
      { name: "图表作文", desc: "数据描述与分析", icon: "📊", count: 4 },
    ]
  },
  translation: {
    sections: [
      { name: "文化类翻译", desc: "传统文化、节日习俗等汉译英", icon: "🏮", count: 6 },
      { name: "经济类翻译", desc: "经济发展、商业贸易等汉译英", icon: "💰", count: 4 },
      { name: "社会类翻译", desc: "教育、科技、环保等汉译英", icon: "🌍", count: 6 },
    ]
  },
  matching: {
    sections: [
      { name: "段落匹配", desc: "4段文章 × 4道题干，考查同义替换与主旨匹配", icon: "🔗", count: 4 },
    ]
  },
  cloze: {
    sections: [
      { name: "选词填空", desc: "15选10，考查词汇辨析、词性判断与上下文线索", icon: "📝", count: 6 },
    ]
  },
};

export default function EnglishHome() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("reading");
  const cat = CATEGORIES[activeTab as keyof typeof CATEGORIES];
  const tab = TABS.find(t => t.id === activeTab);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">英语训练</h1>
      <p className="text-zinc-500 mb-6">CET-4/6 专项训练 · 按题型分类 · 掌握度追踪</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-zinc-100 p-1 rounded-xl">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={"flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all " + (activeTab === t.id ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700")}>
            <t.icon className="w-4 h-4 inline mr-1.5"/>{t.label}
          </button>
        ))}
      </div>

      <div key={activeTab} className="animate-fade-in">
      {tab && (
        <div className="flex items-center gap-3 mb-6 p-4 bg-primary-50 rounded-xl transition-all duration-200">
          <tab.icon className="w-6 h-6 text-primary-500"/>
          <div><h2 className="font-bold text-lg">{tab.label}</h2><p className="text-sm text-zinc-600">{tab.desc}</p></div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3">
        {cat.sections.map((s, i) => (
          <button key={i} onClick={() => {
            if (activeTab === 'reading') router.push('/english/reading');
            else if (activeTab === 'writing') router.push('/english/writing');
            else if (activeTab === 'translation') router.push('/english/translation');
            else if (activeTab === 'listening') router.push('/english/listening');
            else if (activeTab === 'matching') router.push('/english/matching');
            else if (activeTab === 'cloze') router.push('/english/cloze');
          }}
            className="card-hover flex items-center gap-4 p-5 text-left w-full">
            <span className="text-3xl">{s.icon}</span>
            <div className="flex-1">
              <h3 className="font-bold">{s.name}</h3>
              <p className="text-sm text-zinc-500">{s.desc}</p>
            </div>
            <span className="text-xs text-zinc-400 shrink-0">∞ AI 生成</span>
            <ArrowRight className="w-5 h-5 text-zinc-300"/>
          </button>
        ))}
      </div>


      {/* Knowledge graph link */}
      <div className="mt-8 p-4 bg-gradient-to-r from-primary-50 to-indigo-50 rounded-2xl border border-primary-100">
        <p className="font-bold text-primary-700 mb-1">📊 查看掌握度</p>
        <p className="text-sm text-primary-600 mb-3">所有训练数据会自动汇总到知识图谱，追踪每个题型的掌握百分比。</p>
        <button onClick={() => router.push("/knowledge")} className="btn-primary text-sm">查看知识图谱 →</button>
      </div>
      </div>{/* animate-fade-in */}
    </div>
  );
}
