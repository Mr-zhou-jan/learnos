"use client";
import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { parseDialogue } from "@/lib/tts";

interface Props {
  script: string;
  hideQuestions?: boolean;
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const SPEECH_RATE = 1.0;  // 四六级标准语速
const PAUSE_MS = 80;       // 句间停顿（减半）

function estimateDuration(text: string): number {
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  return words * 350 + 1000;
}

function getVoice(gender: "M" | "W" | "neutral"): SpeechSynthesisVoice | null {
  if (typeof window === "undefined") return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // 优先英文语音
  const enVoices = voices.filter(v => v.lang.startsWith("en-"));
  const allEn = enVoices.length > 0 ? enVoices : voices.filter(v => v.lang.startsWith("en"));

  // M → 找含 male/man 关键词的语音
  if (gender === "M") {
    for (const kw of ["male", "man", "david", "mark", "james"]) {
      const v = allEn.find(v => v.name.toLowerCase().includes(kw));
      if (v) return v;
    }
    // 回退：找不含 female/woman 的英文男声
    const nonFemale = allEn.find(v => !/(?:female|woman|samantha|zira|catherine|susan|linda|moira)/i.test(v.name));
    if (nonFemale) return nonFemale;
  }

  // W → 找含 female/woman 关键词的语音
  if (gender === "W") {
    for (const kw of ["female", "woman", "samantha", "zira", "catherine", "susan"]) {
      const v = allEn.find(v => v.name.toLowerCase().includes(kw));
      if (v) return v;
    }
  }

  return allEn[0] || voices[0] || null;
}

export default function ListeningPlayer({ script, hideQuestions }: Props) {
  const [playing, setPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const totalDuration = script ? Math.max(estimateDuration(script) / 1000, 5) : 5;
  const progressPct = Math.min((currentTime / totalDuration) * 100, 100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const speakingRef = useRef(false);
  const [voicesReady, setVoicesReady] = useState(false);

  // 预加载语音（减少首次点击延迟）
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesReady(true);
        // 预热：发一个空 utterance 激活语音引擎
        const u = new SpeechSynthesisUtterance("");
        u.volume = 0; u.rate = 1;
        window.speechSynthesis.speak(u);
      }
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices, { once: true });
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  const stopAll = () => {
    window.speechSynthesis.cancel();
    speakingRef.current = false;
    setPlaying(false);
    setIsPaused(false);
    stopTimer();
  };

  useEffect(() => () => stopAll(), []);

  const togglePlay = () => {
    if (playing) {
      // 正在播放 → 暂停
      window.speechSynthesis.pause();
      setPlaying(false);
      setIsPaused(true);
      stopTimer();
    } else if (isPaused) {
      // 已暂停 → 恢复
      window.speechSynthesis.resume();
      setPlaying(true);
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const n = prev + 0.1;
          if (n >= totalDuration) { stopTimer(); setPlaying(false); setIsPaused(false); return 0; }
          return n;
        });
      }, 100);
    } else {
      // 新播放
      speak();
    }
  };

  const speak = () => {
    if (!script) return;
    stopAll();
    const lines = parseDialogue(script);
    const mVoice = getVoice("M");
    const wVoice = getVoice("W");
    const nVoice = getVoice("neutral");

    speakingRef.current = true;
    setPlaying(true);
    setCurrentTime(0);

    if (lines.length === 0) {
      const u = new SpeechSynthesisUtterance(script);
      u.lang = "en-US"; u.rate = SPEECH_RATE;
      if (nVoice) u.voice = nVoice;
      u.onend = () => { stopTimer(); setPlaying(false); speakingRef.current = false; setCurrentTime(0); };
      window.speechSynthesis.speak(u);
      const dur = estimateDuration(script) / 1000;
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => { const n = prev + 0.1; if (n >= dur) { stopTimer(); setPlaying(false); speakingRef.current = false; } return n; });
      }, 100);
      return;
    }

    let totalMs = 0;
    for (const line of lines) totalMs += estimateDuration(line.text) + PAUSE_MS;

    const finalTotal = totalMs;
    timerRef.current = setInterval(() => {
      if (!speakingRef.current) { stopTimer(); setPlaying(false); return; }
      setCurrentTime(prev => {
        const n = prev + 0.1;
        if (n >= finalTotal / 1000) { stopTimer(); setPlaying(false); speakingRef.current = false; return 0; }
        return n;
      });
    }, 100);

    // 链式播放（onend 自动触发下一句，支持 pause/resume）
    let idx = 0;
    const speakNext = () => {
      if (idx >= lines.length || !speakingRef.current) return;
      const line = lines[idx];
      idx++;
      const u = new SpeechSynthesisUtterance(line.text);
      u.lang = "en-US"; u.rate = SPEECH_RATE;
      if (line.speaker === "M" && mVoice) { u.voice = mVoice; u.pitch = 0.88; }
      else if (line.speaker === "W" && wVoice) { u.voice = wVoice; u.pitch = 1.12; }
      else if (nVoice) { u.voice = nVoice; u.pitch = 1; }
      u.onend = speakNext;
      window.speechSynthesis.speak(u);
    };
    speakNext();
  };

  const skip = (sec: number) => {
    stopAll();
    // 简化实现：跳过时重新播放
    const newTime = Math.max(0, Math.min(currentTime + sec, totalDuration));
    setCurrentTime(newTime);
  };

  if (!script) return null;

  return (
    <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 mb-5">
      {/* 进度条 */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-zinc-500 mb-1">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(totalDuration)}</span>
        </div>
        <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <button onClick={() => skip(-15)}
          className="p-2 rounded-full hover:bg-blue-100 transition-colors" title="后退15秒">
          <SkipBack className="w-5 h-5 text-blue-600" />
        </button>
        <button onClick={togglePlay}
          className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          title={playing ? "暂停" : "播放"}>
          {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </button>
        <button onClick={() => skip(15)}
          className="p-2 rounded-full hover:bg-blue-100 transition-colors" title="前进15秒">
          <SkipForward className="w-5 h-5 text-blue-600" />
        </button>
        <button onClick={speak}
          className="p-2 rounded-full hover:bg-blue-100 transition-colors" title="重新播放">
          <RotateCcw className="w-5 h-5 text-blue-600" />
        </button>
      </div>

      {/* 脚本区域 */}
      <div className="bg-white rounded-lg p-3 text-xs leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
        {hideQuestions ? (
          <p className="text-zinc-400 italic text-center text-sm py-4">
            听力原文已加载，题目将在交卷后显示。<br/>
            请仔细听对话内容，根据听到的信息作答。
          </p>
        ) : (
          parseDialogue(script).map((line, i) => (
            <span key={i} className={
              line.speaker === "M" ? "text-blue-700" :
              line.speaker === "W" ? "text-pink-600" : "text-zinc-700"
            }>
              {line.speaker !== "neutral" && (
                <span className="font-bold text-[10px] mr-0.5">
                  {line.speaker === "M" ? "👨" : "👩"}
                </span>
              )}
              {line.text}{" "}
            </span>
          ))
        )}
      </div>

      {!voicesReady && (
        <p className="text-[10px] text-zinc-400 mt-2 text-center">语音引擎加载中…</p>
      )}
    </div>
  );
}
