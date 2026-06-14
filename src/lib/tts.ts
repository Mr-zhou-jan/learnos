"use client";

interface DialogueLine { speaker: "M" | "W" | "neutral"; text: string; }

export function parseDialogue(script: string): DialogueLine[] {
  if (!script) return [];
  const lines = script.split(/\n/);
  const result: DialogueLine[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let match = trimmed.match(/^(?:\(?\s*)?(M|Man|Male)(?:\s*[):\]\)]\s*)/i);
    if (match) { const text = trimmed.slice(match[0].length).trim(); if (text) result.push({ speaker: "M", text }); continue; }
    match = trimmed.match(/^(?:\(?\s*)?(W|Woman|Female)(?:\s*[):\]\)]\s*)/i);
    if (match) { const text = trimmed.slice(match[0].length).trim(); if (text) result.push({ speaker: "W", text }); continue; }
    result.push({ speaker: "neutral", text: trimmed });
  }
  return result;
}

/** 选语音：优先 en-US（美音连读），其次 en-GB，再其次任意英文 */
function pickVoice(gender: "M" | "W" | "neutral"): SpeechSynthesisVoice | null {
  if (typeof window === "undefined") return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const us = voices.filter(v => v.lang === "en-US");
  const gb = voices.filter(v => v.lang === "en-GB");
  const pool = us.length > 0 ? us : gb.length > 0 ? gb : voices.filter(v => v.lang.startsWith("en-"));
  const fallback = pool.length > 0 ? pool : voices.filter(v => v.lang.startsWith("en"));

  // M = 男人 → 找 male 关键词
  if (gender === "M") {
    for (const k of ["male", "david", "mark", "james", "tom", "daniel", "fred", "guy", "chris", "paul"]) {
      const v = pool.find(v => v.name.toLowerCase().includes(k));
      if (v) return v;
    }
    // 回退：排除明显女声的任意英文语音
    const notFemale = fallback.find(v => !/(?:female|woman|samantha|zira|catherine|susan|linda|moira|eva|karen)/i.test(v.name));
    if (notFemale) return notFemale;
  }
  // W = 女人 → 找 female 关键词
  if (gender === "W") {
    for (const k of ["female", "zira", "samantha", "catherine", "susan", "linda", "moira", "eva", "karen", "amy"]) {
      const v = pool.find(v => v.name.toLowerCase().includes(k));
      if (v) return v;
    }
  }
  return pool[0] || fallback[0] || voices[0] || null;
}

/** 普通朗读 */
export function speakText(text: string, opts?: { rate?: number }): void {
  if (!text || typeof window === "undefined") return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US"; u.rate = opts?.rate ?? 1.0;
  const v = pickVoice("neutral");
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

// ------ 播放状态追踪 ------
let _speaking = false;
let _paused = false;

function resetState() { _speaking = false; _paused = false; }

/** 停止所有语音 */
export function stopSpeaking(): void {
  if (typeof window !== "undefined") { window.speechSynthesis.cancel(); resetState(); }
}

/** 男女声分离链式朗读 */
export function speakDialogue(script: string): void {
  if (!script || typeof window === "undefined") return;
  window.speechSynthesis.cancel();
  resetState();

  const lines = parseDialogue(script);
  if (lines.length === 0) { speakText(script); return; }

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    window.speechSynthesis.addEventListener("voiceschanged", () => speakDialogue(script), { once: true });
    return;
  }

  const mVoice = pickVoice("M"); // 男声
  const wVoice = pickVoice("W"); // 女声
  const nVoice = pickVoice("neutral");

  _speaking = true;
  let idx = 0;
  const next = () => {
    if (!_speaking || idx >= lines.length) { resetState(); return; }
    const line = lines[idx++];
    const u = new SpeechSynthesisUtterance(line.text);
    u.lang = "en-US"; u.rate = 1.0;
    // M=男人→男声低音, W=女人→女声高音
    if (line.speaker === "M" && mVoice) { u.voice = mVoice; u.pitch = 0.88; }
    else if (line.speaker === "W" && wVoice) { u.voice = wVoice; u.pitch = 1.12; }
    else if (nVoice) { u.voice = nVoice; u.pitch = 1.0; }
    u.onend = next;
    window.speechSynthesis.speak(u);
  };
  next();
}

/** 切换：播放 ↔ 暂停 ↔ 继续 */
export function toggleDialogue(script: string): void {
  if (typeof window === "undefined") return;
  if (_speaking) {
    // 正在播放 → 暂停
    window.speechSynthesis.pause();
    _speaking = false;
    _paused = true;
  } else if (_paused) {
    // 已暂停 → 恢复
    window.speechSynthesis.resume();
    _speaking = true;
    _paused = false;
  } else {
    // 空闲 → 开始
    speakDialogue(script);
  }
}

export function toggleSpeaking(text: string): void {
  if (typeof window === "undefined") return;
  if (_speaking) {
    window.speechSynthesis.pause();
    _speaking = false;
    _paused = true;
  } else if (_paused) {
    window.speechSynthesis.resume();
    _speaking = true;
    _paused = false;
  } else {
    speakText(text);
  }
}
