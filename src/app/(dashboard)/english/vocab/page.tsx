"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Settings, Volume2, CheckCircle2, RefreshCw, Calendar, BookmarkPlus, BookMarked, Plus, Trash2, Search, X } from "lucide-react";
import { lookupCET4Word, getCET4WordList, getCET4WordCount, type WordEntry } from "@/data/vocab-cet4";
import { lookupCET6Word, getCET6WordList, getCET6WordCount } from "@/data/vocab-cet6";
import {
  loadProgress, saveProgress, markCorrect, markWrong, getTodayQueue, getVocabStats,
  type VocabProgressData, type VocabSettings, DEFAULT_SETTINGS, tryCheckIn, getStreak, addWordSource,
} from "@/lib/vocab-scheduler";
import { useTrainingMemory, saveTrainingRecord, getStubbornVocabWords, getTrainingRecords } from "@/lib/use-training-memory";
import { getNotebookWords, addNotebookWord, removeNotebookWord, searchNotebookWords, type NotebookWord } from "@/lib/vocab-notebook";

type Mode = "handwrite" | "spell";
type PageTab = "recite" | "notebook";

export default function VocabPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<VocabSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [progress, setProgress] = useState<VocabProgressData | null>(null);
  const [currentQueue, setCurrentQueue] = useTrainingMemory<string[]>("vocab_queue", []);
  const [queueIndex, setQueueIndex] = useTrainingMemory<number>("vocab_idx", 0);
  const [queueDateStamp, setQueueDateStamp] = useTrainingMemory<string>("vocab_queue_date", "");
  const [input, setInput] = useTrainingMemory<string>("vocab_input", "");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showCard, setShowCard] = useTrainingMemory<boolean>("vocab_showCard", false);
  const [currentMode, setCurrentMode] = useState<Mode>("handwrite");
  const [speaking, setSpeaking] = useState(false);
  // 生词本
  const [pageTab, setPageTab] = useState<PageTab>("recite");
  const [notebookWords, setNotebookWords] = useState<NotebookWord[]>([]);
  const [nbWord, setNbWord] = useState("");
  const [nbMeaning, setNbMeaning] = useState("");
  const [nbNote, setNbNote] = useState("");
  const [nbTags, setNbTags] = useState("");
  const [nbSearch, setNbSearch] = useState("");
  const [showNbForm, setShowNbForm] = useState(false);
  const [expandedNbWord, setExpandedNbWord] = useState<string | null>(null); // 展开的生词ID
  const [nbWordDetails, setNbWordDetails] = useState<Record<string, any>>({}); // 生词释义缓存

  useEffect(() => {
    setNotebookWords(getNotebookWords());
  }, []);

  // 获取生词详细释义（优先从词库，否则 AI）
  const fetchNbWordDetail = (word: string) => {
    if (nbWordDetails[word]) return;
    // 先从词库查
    const fromBank = settings.bank === "cet4" ? lookupCET4Word(word) : lookupCET6Word(word);
    if (fromBank) {
      setNbWordDetails(prev => ({ ...prev, [word]: fromBank }));
      return;
    }
    // 词库没有的，请求 AI
    fetch("/api/english/word-definition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, level: settings.bank }),
    }).then(r => r.json()).then(d => {
      if (d.source === "ai" || d.meaning) {
        setNbWordDetails(prev => ({ ...prev, [word]: d }));
      }
    }).catch(() => {});
  };

  // 朗读文本
  const speakText = (text: string) => {
    if (!text || typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[🎧📻❓📖📝📄]/g, ""));
    u.lang = "en-US"; u.rate = 0.85;
    window.speechSynthesis.speak(u);
  };

  const handleAddWord = () => {
    if (!nbWord.trim() || !nbMeaning.trim()) return;
    const tags = nbTags.split(/[,，]/).map(t => t.trim()).filter(Boolean);
    addNotebookWord(nbWord, nbMeaning, tags, nbNote);
    setNotebookWords(getNotebookWords());
    setNbWord(""); setNbMeaning(""); setNbNote(""); setNbTags("");
    setShowNbForm(false);
  };

  const handleDeleteWord = (id: string) => {
    removeNotebookWord(id);
    setNotebookWords(getNotebookWords());
  };

  const displayedNbWords = nbSearch ? searchNotebookWords(nbSearch) : notebookWords;

  const currentWord = currentQueue[queueIndex];
  const wordData: WordEntry | null = currentWord
    ? (settings.bank === "cet4" ? lookupCET4Word(currentWord) : lookupCET6Word(currentWord))
    : null;
  const wordList = settings.bank === "cet4" ? getCET4WordList() : getCET6WordList();
  const totalWords = settings.bank === "cet4" ? getCET4WordCount() : getCET6WordCount();

  useEffect(() => {
    const p = loadProgress(settings.bank);
    setProgress(p);
    setSettings(p.settings);
    const today = new Date().toDateString();
    // 使用 queueDateStamp 检测是否跨天：跨天强制刷新队列
    const isNewDay = queueDateStamp !== today;
    // 同一天且队列已有数据：直接恢复，不重新生成队列
    if (!isNewDay && currentQueue.length > 0) {
      return;
    }
    // 新的一天 / 首次使用 / 换词库 → 重新生成
    setQueueDateStamp(today);
    refreshQueue(p, isNewDay ? 0 : queueIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.bank]);

  // 切换tab/页面时强制保存所有状态（进度 + 当前队列位置）
  useEffect(() => {
    const saveAll = () => {
      if (progress) saveProgress(progress);
    };
    const handleVisibility = () => { if (document.hidden) saveAll(); };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", saveAll);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", saveAll);
    };
  }, [progress]);

  const refreshQueue = (p: VocabProgressData, restoreIdx?: number) => {
    const { newWords, reviewWords } = getTodayQueue(p, wordList);
    const queue = [...reviewWords, ...newWords];
    if (queue.length === 0) {
      const remaining = wordList.filter(w => !p.words[w]);
      setCurrentQueue(remaining.slice(0, p.settings.dailyNewWords));
      setQueueIndex(0); // 空队列重建 → 从头开始
    } else {
      setCurrentQueue(queue);
      // 恢复进度：同一天用已保存的索引，否则从0开始
      const safeIdx = (restoreIdx !== undefined && restoreIdx >= 0 && restoreIdx < queue.length) ? restoreIdx : 0;
      setQueueIndex(safeIdx);
    }
    setInput("");
    setFeedback(null);
    setShowCard(false);
  };

  const pickMode = useCallback(() => {
    if (settings.mode === "mixed") {
      setCurrentMode(Math.random() > 0.5 ? "handwrite" : "spell");
    } else {
      setCurrentMode(settings.mode as Mode);
    }
  }, [settings.mode]);

  useEffect(() => { if (currentWord) pickMode(); }, [currentWord, pickMode]);

  const speak = () => {
    if (!currentWord) return;
    const u = new SpeechSynthesisUtterance(currentWord);
    u.lang = "en-US"; u.rate = 0.8;
    setSpeaking(true);
    u.onend = () => setSpeaking(false);
    speechSynthesis.speak(u);
  };

  useEffect(() => {
    if (currentMode === "spell" && currentWord && !showCard) {
      const t = setTimeout(speak, 300);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMode, currentWord, queueIndex]);

  const [lastRecordId, setLastRecordId] = useState<string | null>(null);
  // AI 精准释义
  const [aiEnriched, setAiEnriched] = useState<Record<string, any>>({});

  // 当单词卡片展示时，对非丰富词条请求 AI 精准释义
  useEffect(() => {
    if (!currentWord || !wordData) return;
    // 已经是丰富词条（有同义词/短语），不需要 AI
    if (wordData.synonyms.length > 0 || wordData.phrases.length > 0) return;
    // 已在缓存或正在请求中
    if (aiEnriched[currentWord]) return;

    let cancelled = false;
    fetch("/api/english/word-definition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: currentWord, level: settings.bank }),
    }).then(r => r.json()).then(d => {
      if (!cancelled && d.source === "ai") {
        setAiEnriched(prev => ({ ...prev, [currentWord]: d }));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [currentWord, wordData, settings.bank, aiEnriched]);

  // 合并本地数据 + AI 精准释义
  const enrichedData: WordEntry | null = (() => {
    if (!wordData) return null;
    const ai = aiEnriched[currentWord];
    if (!ai) return wordData;
    return {
      ...wordData,
      meaning: ai.meaning || wordData.meaning,
      phonetic: ai.phonetic || wordData.phonetic,
      pos: ai.pos || wordData.pos,
      example: ai.example || wordData.example,
      exampleZh: ai.exampleZh || wordData.exampleZh,
      synonyms: ai.synonyms?.length > 0 ? ai.synonyms : wordData.synonyms,
      antonyms: ai.antonyms?.length > 0 ? ai.antonyms : wordData.antonyms,
      phrases: ai.phrases?.length > 0 ? ai.phrases : wordData.phrases,
      similarWords: ai.similarWords?.length > 0 ? ai.similarWords : wordData.similarWords,
    };
  })();

  const handleSubmit = () => {
    if (!currentWord || !progress) return;
    const isCorrect = input.trim().toLowerCase() === currentWord.toLowerCase();
    setFeedback(isCorrect ? "correct" : "wrong");
    setShowCard(true);
    if (isCorrect) {
      markCorrect(progress, currentWord);
    } else {
      markWrong(progress, currentWord);
      setCurrentQueue(prev => [...prev, currentWord]);
    }
    setProgress({ ...progress });
    // 保存训练记录
    const r = saveTrainingRecord({
      module: "vocab", title: `${settings.bank}词汇`,
      question: currentMode === "handwrite" ? enrichedData?.meaning || currentWord : "听音拼写",
      userAnswer: input.trim(), correctAnswer: currentWord, isCorrect,
      explanation: `${enrichedData?.phonetic || ""} ${enrichedData?.meaning || ""}`,
    });
    setLastRecordId(r.id);
  };

  // 手动打卡
  const [showCheckInSuccess, setShowCheckInSuccess] = useState(false);
  const handleManualCheckIn = () => {
    if (!progress) return;
    const done = tryCheckIn(progress);
    if (done) {
      setProgress({ ...progress });
      setShowCheckInSuccess(true);
      setTimeout(() => setShowCheckInSuccess(false), 3000);
    }
  };

  const nextWord = () => {
    if (queueIndex < currentQueue.length - 1) {
      setQueueIndex(queueIndex + 1);
    } else {
      const p = progress!;
      const { newWords, reviewWords } = getTodayQueue(p, wordList);
      const remaining = [...reviewWords, ...newWords];
      if (remaining.length > 0) {
        setCurrentQueue(remaining);
        setQueueIndex(0);
      } else {
        setCurrentQueue([]);
      }
    }
    setInput("");
    setFeedback(null);
    setShowCard(false);
  };

  const handleSaveSettings = () => {
    if (!progress) return;
    progress.settings = { ...settings };
    saveProgress(progress);
    setShowSettings(false);
    // 设置变更后重置队列到开头
    refreshQueue(progress, 0);
  };

  const handleBankChange = (bank: "cet4" | "cet6") => {
    setSettings(prev => ({ ...prev, bank }));
    const p = loadProgress(bank);
    p.settings = { ...p.settings, bank };
    setProgress(p);
    setSettings(p.settings);
    refreshQueue(p);
  };

  const stats = progress ? getVocabStats(progress, totalWords) : null;
  const remainingWords = totalWords - (progress?.totalLearned || 0);
  const estimatedDays = settings.dailyNewWords > 0 ? Math.ceil(remainingWords / settings.dailyNewWords) : 0;

  if (!progress) return <div className="p-12 text-center"><div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"/></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Tab 切换：背诵 | 生词本 */}
      <div className="flex bg-zinc-100 rounded-xl p-1 mb-6">
        <button onClick={() => setPageTab("recite")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            pageTab === "recite" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}>
          📚 背诵
        </button>
        <button onClick={() => { setPageTab("notebook"); setNotebookWords(getNotebookWords()); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            pageTab === "notebook" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"}`}>
          <BookMarked className="w-4 h-4" /> 生词本
          {notebookWords.length > 0 && (
            <span className="text-[10px] bg-primary-100 text-primary-600 px-1.5 py-0.5 rounded-full">{notebookWords.length}</span>
          )}
        </button>
      </div>

      {/* ============ 生词本 ============ */}
      {pageTab === "notebook" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">生词本</h1>
            <button onClick={() => setShowNbForm(!showNbForm)}
              className="btn-primary text-xs px-3 py-2 flex items-center gap-1">
              <Plus className="w-4 h-4" /> 添加生词
            </button>
          </div>

          {/* 添加表单 */}
          {showNbForm && (
            <div className="card p-4 mb-4 space-y-3 animate-slide-up">
              <div className="flex gap-3">
                <div className="flex-1">
                  <input type="text" value={nbWord} onChange={e => setNbWord(e.target.value)}
                    placeholder="英文单词" className="w-full px-3 py-2 border rounded-lg text-sm" autoFocus />
                </div>
                <div className="flex-1">
                  <input type="text" value={nbMeaning} onChange={e => setNbMeaning(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAddWord()}
                    placeholder="中文释义" className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex gap-3">
                <input type="text" value={nbTags} onChange={e => setNbTags(e.target.value)}
                  placeholder="标签（用逗号分隔，如：高频,易错）"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                <input type="text" value={nbNote} onChange={e => setNbNote(e.target.value)}
                  placeholder="备注（可选）"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddWord} disabled={!nbWord.trim() || !nbMeaning.trim()}
                  className="btn-primary text-sm px-4 py-1.5">添加</button>
                <button onClick={() => setShowNbForm(false)} className="btn-secondary text-sm px-4 py-1.5">取消</button>
              </div>
            </div>
          )}

          {/* 搜索 */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input type="text" value={nbSearch} onChange={e => setNbSearch(e.target.value)}
              placeholder="搜索生词…" className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm" />
            {nbSearch && (
              <button onClick={() => setNbSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            )}
          </div>

          {/* 生词列表 */}
          {displayedNbWords.length > 0 ? (
            <div className="space-y-2">
              {displayedNbWords.map(w => {
                const isExpanded = expandedNbWord === w.id;
                const detail = nbWordDetails[w.word];
                return (
                <div key={w.id}>
                  <div
                    onClick={() => {
                      if (isExpanded) { setExpandedNbWord(null); return; }
                      setExpandedNbWord(w.id);
                      fetchNbWordDetail(w.word);
                    }}
                    className={`card p-4 flex items-start gap-3 group cursor-pointer transition-all ${
                      isExpanded ? "border-primary-300 bg-primary-50/30 rounded-b-none" : "hover:border-primary-200"
                    }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-primary-700">{w.word}</span>
                        {w.tags.map((tag, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-50 text-primary-600 border border-primary-200">
                            {tag}
                          </span>
                        ))}
                        {detail?.phonetic && <span className="text-xs text-zinc-400">{detail.phonetic}</span>}
                      </div>
                      <p className="text-sm text-zinc-600">{detail?.meaning || w.meaning}</p>
                      {w.note && <p className="text-xs text-zinc-400 mt-0.5">💬 {w.note}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); speakText(w.word); }}
                        className="p-1.5 rounded-lg text-zinc-300 hover:text-blue-500 hover:bg-blue-50 transition-all">
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteWord(w.id); setExpandedNbWord(null); }}
                        className="p-1.5 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 展开的详细释义 */}
                  {isExpanded && (
                    <div className="card border-t-0 rounded-t-none border-primary-200 bg-white p-5 space-y-3 animate-slide-up">
                      {!detail && (
                        <div className="flex items-center gap-2 text-sm text-zinc-400 py-2">
                          <div className="w-4 h-4 rounded-full border-2 border-primary-300 border-t-transparent animate-spin" />
                          正在获取详细释义…
                        </div>
                      )}
                      {detail && (
                        <>
                          {/* 基本释义 */}
                          <div className="p-3 bg-zinc-50 rounded-lg">
                            <p className="text-xs text-zinc-400 mb-1">📖 释义</p>
                            <p className="font-bold text-primary-700">{detail.meaning || w.meaning}</p>
                            {detail.pos && <p className="text-xs text-zinc-500 mt-0.5">{detail.pos}</p>}
                          </div>

                          {/* 例句 */}
                          {detail.example && (
                            <div className="p-3 bg-zinc-50 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-zinc-400">📝 例句</p>
                                <button onClick={() => speakText(detail.example)}
                                  className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700 transition-colors">
                                  <Volume2 className="w-3 h-3" /> 朗读
                                </button>
                              </div>
                              <p className="text-sm italic text-zinc-700">"{detail.example}"</p>
                              {detail.exampleZh && <p className="text-sm text-zinc-500 mt-1">{detail.exampleZh}</p>}
                            </div>
                          )}

                          {/* 同义词 */}
                          {detail.synonyms?.length > 0 && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <p className="text-xs text-zinc-400 mb-1">🔗 近义词</p>
                              <p className="text-sm text-blue-700">{detail.synonyms.join(" · ")}</p>
                            </div>
                          )}

                          {/* 反义词 */}
                          {detail.antonyms?.length > 0 && (
                            <div className="p-3 bg-orange-50 rounded-lg">
                              <p className="text-xs text-zinc-400 mb-1">🔄 反义词</p>
                              <p className="text-sm text-orange-700">{detail.antonyms.join(" · ")}</p>
                            </div>
                          )}

                          {/* 相关短语 */}
                          {detail.phrases?.length > 0 && (
                            <div className="p-3 bg-purple-50 rounded-lg">
                              <p className="text-xs text-zinc-400 mb-1">📖 相关短语</p>
                              {detail.phrases.map((ph: string, i: number) => (
                                <p key={i} className="text-sm text-purple-700">{ph}</p>
                              ))}
                            </div>
                          )}

                          {/* 形近易混淆词 */}
                          {detail.similarWords?.length > 0 && (
                            <div className="p-3 bg-red-50 rounded-lg">
                              <p className="text-xs text-zinc-400 mb-1">⚠️ 形近易混淆词</p>
                              <p className="text-sm text-red-700">{detail.similarWords.join(" · ")}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          ) : (
            <div className="card text-center py-12">
              <BookMarked className="w-12 h-12 text-zinc-200 mx-auto mb-3" />
              <p className="text-zinc-500">生词本还是空的</p>
              <p className="text-sm text-zinc-400 mb-4">点击「添加生词」手动录入你想记住的单词</p>
              <button onClick={() => setShowNbForm(true)} className="btn-primary text-sm">
                <Plus className="w-4 h-4 inline mr-1" /> 添加第一个生词
              </button>
            </div>
          )}

          <p className="text-xs text-zinc-400 mt-6 text-center">
            共 {notebookWords.length} 个生词 · 手动添加，不会自动收录错题
          </p>
        </div>
      )}

      {/* ============ 背诵模式 ============ */}
      {pageTab === "recite" && (
      <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">词汇背诵</h1>
          <p className="text-sm text-zinc-500">{settings.bank === "cet4" ? "CET-4" : "CET-6"} · {totalWords} 词</p>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className="btn-secondary text-xs px-3 py-2 flex items-center gap-1">
          <Settings className="w-4 h-4" /> 学习设置
        </button>
      </div>

      {/* 统计条 */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[{ v: stats.totalMastered, l: "已掌握", c: "text-primary-600" },
            { v: stats.todayNew + stats.todayReview, l: "今日已学", c: "text-amber-600" },
            { v: `${stats.progressPercent}%`, l: "进度", c: "text-emerald-600" },
            { v: `${getStreak(progress)}天`, l: "连续打卡", c: "text-indigo-600" }].map((x, i) => (
            <div key={i} className="card p-3 text-center">
              <p className={`text-xl font-bold ${x.c}`}>{x.v}</p>
              <p className="text-xs text-zinc-400">{x.l}</p>
            </div>
          ))}
        </div>
      )}

      {/* 设置面板 */}
      {showSettings && (
        <div className="card mb-6 p-5 space-y-4 animate-slide-up">
          <h3 className="font-bold text-lg">⚙️ 学习设置</h3>
          <div>
            <p className="text-sm font-medium mb-2">词库选择</p>
            <div className="flex gap-2">
              {(["cet4", "cet6"] as const).map(bank => (
                <button key={bank} onClick={() => handleBankChange(bank)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    settings.bank === bank ? "border-primary-500 bg-primary-50 text-primary-700" : "border-zinc-200"}`}>
                  {bank === "cet4" ? "CET-4 四级" : "CET-6 六级"}
                  <span className="block text-xs text-zinc-400 font-normal">{bank === "cet4" ? "~4500词" : "~2000词"}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">每日新词：{settings.dailyNewWords} 个</p>
            <input type="range" min={10} max={100} step={5} value={settings.dailyNewWords}
              onChange={e => setSettings({ ...settings, dailyNewWords: Number(e.target.value) })} className="w-full" />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">每日最大复习：{settings.dailyMaxReview} 个</p>
            <input type="range" min={20} max={200} step={10} value={settings.dailyMaxReview}
              onChange={e => setSettings({ ...settings, dailyMaxReview: Number(e.target.value) })} className="w-full" />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">学习模式</p>
            <div className="flex gap-2">
              {[{ v: "handwrite" as const, l: "✍️ 手写" }, { v: "spell" as const, l: "🔊 听写" }, { v: "mixed" as const, l: "🔀 混合" }].map(m => (
                <button key={m.v} onClick={() => setSettings({ ...settings, mode: m.v })}
                  className={`flex-1 py-2 rounded-lg text-sm border transition-all ${
                    settings.mode === m.v ? "border-primary-500 bg-primary-50 text-primary-700" : "border-zinc-200"}`}>{m.l}</button>
              ))}
            </div>
          </div>
          <div className="p-3 bg-zinc-50 rounded-lg text-sm">
            <Calendar className="w-4 h-4 inline mr-1 text-zinc-500" />
            按当前设置预计 <span className="font-bold text-primary-600">~{estimatedDays} 天</span> 完成
          </div>
          <button onClick={handleSaveSettings} className="btn-primary w-full">保存设置</button>
        </div>
      )}

      {/* 学习卡片 */}
      {currentWord && enrichedData ? (

        <div className="card p-8 text-center">
          <p className="text-sm text-zinc-400 mb-4">
            第 {queueIndex + 1}/{currentQueue.length} 个
            {progress.words[currentWord]?.status === "review" && <span className="text-amber-500 ml-2">📋 复习</span>}
            {progress.words[currentWord]?.status === "new" && <span className="text-emerald-500 ml-2">🆕 新词</span>}
            {aiEnriched[currentWord]?.source === "ai" && <span className="text-blue-500 ml-2">🤖 AI精准释义</span>}
          </p>

          {currentMode === "handwrite" ? (
            <>
              <p className="text-2xl font-bold text-primary-700 mb-4">{enrichedData.meaning}</p>
              <p className="text-xs text-zinc-400 mb-2">请输入对应的英文单词</p>
              <p className="text-xs text-zinc-300 mb-4">提示：{enrichedData.word.charAt(0)}...{enrichedData.word.charAt(enrichedData.word.length - 1)}（{enrichedData.word.length}个字母）</p>
            </>
          ) : (
            <>
              <button onClick={speak} disabled={speaking}
                className="btn-secondary text-lg px-6 py-4 mb-4 flex items-center gap-2 mx-auto">
                <Volume2 className={`w-6 h-6 ${speaking ? "text-primary-500 animate-pulse" : ""}`} />
                {speaking ? "播放中..." : "🔊 点击听发音"}
              </button>
              <p className="text-xs text-zinc-400 mb-4">听音后输入你听到的单词</p>
            </>
          )}

          {!showCard ? (
            <div className="space-y-3">
              <input type="text" value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && input.trim() && handleSubmit()}
                placeholder={currentMode === "handwrite" ? "输入英文单词..." : "输入你听到的单词..."}
                className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 text-center text-lg focus:border-primary-500 focus:outline-none" autoFocus />
              <button onClick={handleSubmit} disabled={!input.trim()} className="btn-primary w-full">提交</button>
              <button onClick={speak} className="btn-secondary w-full text-sm"><Volume2 className="w-4 h-4 inline mr-1" /> 听发音</button>
            </div>
          ) : (
            <div className="animate-slide-up space-y-4 text-left">
              <div className={`p-4 rounded-xl ${feedback === "correct" ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                <p className="text-3xl font-bold mb-1">{enrichedData.word}</p>
                <p className="text-zinc-500 mb-1">{enrichedData.phonetic}</p>
                <p className="font-bold text-primary-700">{enrichedData.meaning}</p>
                <p className="text-sm text-zinc-400 mt-1">{enrichedData.pos}</p>
              </div>
              <div className="p-3 bg-zinc-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-zinc-400">📝 例句</p>
                  <button onClick={() => speakText(enrichedData.example)}
                    className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700 transition-colors">
                    <Volume2 className="w-3 h-3" /> 朗读例句
                  </button>
                </div>
                <p className="text-sm italic">"{enrichedData.example}"</p>
                <p className="text-sm text-zinc-500 mt-1">{enrichedData.exampleZh}</p>
              </div>
              {enrichedData.synonyms.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-zinc-400 mb-1">🔗 近义词 / 同义词</p>
                  <p className="text-sm text-blue-700">{enrichedData.synonyms.join(" · ")}</p>
                </div>
              )}
              {enrichedData.antonyms.length > 0 && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-xs text-zinc-400 mb-1">🔄 反义词</p>
                  <p className="text-sm text-orange-700">{enrichedData.antonyms.join(" · ")}</p>
                </div>
              )}
              {enrichedData.phrases.length > 0 && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-zinc-400 mb-1">📖 相关短语</p>
                  {enrichedData.phrases.map((ph, i) => <p key={i} className="text-sm text-purple-700">{ph}</p>)}
                </div>
              )}
              {enrichedData.similarWords.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-zinc-400 mb-1">⚠️ 形近易混淆词</p>
                  <p className="text-sm text-red-700">{enrichedData.similarWords.join(" · ")}</p>
                </div>
              )}
              {/* 题目来源：从训练记录中匹配（词边界匹配，避免误匹配） */}
              {currentWord && showCard && (() => {
                const allRecords = getTrainingRecords();
                const word = currentWord.toLowerCase();
                const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                const matches = allRecords.filter(r => {
                  const text = `${r.question} ${r.correctAnswer}`;
                  return pattern.test(text);
                }).slice(0, 5);
                if (matches.length === 0) return null;
                return (
                  <div className="p-3 bg-green-50 rounded-lg text-left">
                    <p className="text-xs text-zinc-400 mb-2">📝 题目来源（{matches.length}处匹配）</p>
                    {matches.map((r, si) => (
                      <div key={si} className="mb-2 last:mb-0 p-2 bg-white rounded border border-green-100">
                        <p className="text-xs text-zinc-500 mb-1">
                          <span className="font-medium">{r.module}</span> · {new Date(r.date).toLocaleDateString("zh-CN")}
                        </p>
                        <p className="text-xs text-zinc-600 italic mb-1 line-clamp-2">"{r.question.slice(0, 150)}"</p>
                        <button onClick={(e) => { e.stopPropagation(); router.push(`/english/history?tab=${r.module}&id=${r.id}`); }}
                          className="text-xs text-primary-500 hover:text-primary-700 underline">
                          查看历史记录 →
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <button onClick={nextWord} className="btn-primary w-full flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {feedback === "correct" ? "答对了！继续" : "已记住，继续"}
              </button>
              {/* 加入生词本 */}
              <button onClick={() => {
                const exists = notebookWords.find(w => w.word.toLowerCase() === currentWord.toLowerCase());
                if (!exists) {
                  addNotebookWord(currentWord, enrichedData?.meaning || "", [], "");
                  setNotebookWords(getNotebookWords());
                }
              }}
                disabled={notebookWords.some(w => w.word.toLowerCase() === currentWord?.toLowerCase())}
                className={`w-full text-sm flex items-center justify-center gap-1.5 mt-2 py-2 rounded-lg transition-colors ${
                  notebookWords.some(w => w.word.toLowerCase() === currentWord?.toLowerCase())
                    ? "bg-emerald-50 text-emerald-600 text-xs"
                    : "btn-secondary"
                }`}>
                <BookMarked className="w-3.5 h-3.5" />
                {notebookWords.some(w => w.word.toLowerCase() === currentWord?.toLowerCase())
                  ? "已在生词本中 ✓"
                  : "加入生词本"}
              </button>
              {feedback === "wrong" && lastRecordId && (
                <button onClick={() => { import("@/lib/use-training-memory").then(m => m.toggleErrorBook(lastRecordId!)); }}
                  className="btn-secondary w-full text-sm flex items-center justify-center gap-1 mt-2">
                  <BookmarkPlus className="w-3.5 h-3.5" /> 加入错题本
                </button>
              )}
            </div>
          )}
        </div>
      ) : currentQueue.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">今日任务完成！🎉</h2>
          <p className="text-zinc-500 mb-2">今日新学 {stats?.todayNew || 0} 词，复习 {stats?.todayReview || 0} 词 · 连续打卡 {getStreak(progress)} 天</p>
          {/* 打卡按钮 */}
          {!progress.checkIns.includes(new Date().toDateString()) ? (
            <button onClick={handleManualCheckIn} className="btn-primary mb-4 px-8 py-3 text-base flex items-center gap-2 mx-auto">
              <CheckCircle2 className="w-5 h-5" /> 打卡签到
            </button>
          ) : (
            <p className="text-emerald-500 font-bold mb-4">✅ 今日已打卡 · 连续 {getStreak(progress)} 天</p>
          )}
          {showCheckInSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm animate-slide-up">
              🎉 打卡成功！连续打卡 {getStreak(progress)} 天！
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-left max-w-xs mx-auto mb-4">
            {[{ l: "已掌握", v: stats?.totalMastered, c: "text-emerald-600" },
              { l: "总进度", v: `${stats?.progressPercent || 0}%`, c: "text-primary-600" },
              { l: "学习中", v: stats?.learning, c: "text-amber-600" },
              { l: "待复习", v: stats?.review, c: "text-indigo-600" }].map((x, i) => (
              <div key={i} className="p-3 bg-zinc-50 rounded-lg">
                <p className="text-xs text-zinc-400">{x.l}</p>
                <p className={`font-bold ${x.c}`}>{x.v}</p>
              </div>
            ))}
          </div>
          <button onClick={() => { const p = progress!; const { newWords, reviewWords } = getTodayQueue(p, wordList); const extra = wordList.filter(w => !p.words[w]).slice(0, p.settings.dailyNewWords); setCurrentQueue([...reviewWords, ...newWords, ...extra]); setQueueIndex(0); }} className="btn-secondary">
            <RefreshCw className="w-4 h-4 inline mr-1" /> 再多学一些
          </button>
        </div>
      ) : <div className="card p-12 text-center"><div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"/></div>}
      </>
      )}
    </div>
  );
}
