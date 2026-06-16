"use client";

const KEY = "learnos_streak";

function today(): string { return new Date().toISOString().slice(0, 10); }
function yesterday(d: string): string { const dt = new Date(d); dt.setDate(dt.getDate()-1); return dt.toISOString().slice(0,10); }

export function getStreak() {
  if (typeof window === "undefined") return { dates: [] as string[], current: 0, longest: 0 };
  try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : { dates: [], current: 0, longest: 0 }; }
  catch { return { dates: [] as string[], current: 0, longest: 0 }; }
}

export function isCheckedInToday(): boolean { return getStreak().dates.includes(today()); }

export function checkIn() {
  const d = today();
  const s = getStreak();
  if (s.dates.includes(d)) return s;
  s.dates.push(d); s.dates.sort();
  if (s.dates.length > 400) s.dates = s.dates.slice(-400);
  const cur = calc(s.dates);
  s.current = cur;
  if (cur > s.longest) s.longest = cur;
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

function calc(dates: string[]): number {
  if (!dates.length) return 0;
  const sorted = [...dates].sort().reverse();
  const t = today();
  if (sorted[0] !== t && sorted[0] !== yesterday(t)) return 0;
  let count = sorted[0] === t ? 1 : 0;
  let cur = sorted[0] === t ? t : yesterday(t);
  for (let i = sorted[0] === t ? 1 : 0; i < sorted.length; i++) {
    const exp = yesterday(cur);
    if (sorted[i] === exp) { count++; cur = exp; } else break;
  }
  return count;
}
