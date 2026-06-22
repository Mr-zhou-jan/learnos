// 数学错题存储 (localStorage)

export interface MathError {
  id: string;
  chapter: string;
  question: string;
  options: string[];
  correctIndex: number;
  userAnswer: number;
  explanation: string;
  timestamp: number;
}

const KEY = "learnos_math_errors";

export function getMathErrors(): MathError[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function addMathError(err: Omit<MathError, "id" | "timestamp">): void {
  const errors = getMathErrors();
  errors.push({ ...err, id: `me-${Date.now()}`, timestamp: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(errors));
}

export function removeMathError(id: string): void {
  localStorage.setItem(KEY, JSON.stringify(getMathErrors().filter(e => e.id !== id)));
}

export function clearMathErrors(chapter?: string): void {
  if (chapter) {
    localStorage.setItem(KEY, JSON.stringify(getMathErrors().filter(e => e.chapter !== chapter)));
  } else {
    localStorage.removeItem(KEY);
  }
}

export function getMathErrorsByChapter(): Record<string, MathError[]> {
  const g: Record<string, MathError[]> = {};
  for (const e of getMathErrors()) { if (!g[e.chapter]) g[e.chapter] = []; g[e.chapter].push(e); }
  return g;
}

export function getMathErrorCount(): number {
  return getMathErrors().length;
}
