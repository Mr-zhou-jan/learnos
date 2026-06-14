import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  const sents = (text || "").split(/[.!?]+/).filter((s: string) => s.trim().length > 80).slice(0, 3);
  const result = sents.map((s: string, i: number) => ({
    original: s.trim(),
    breakdown: [{ part: s.trim().slice(0, Math.floor(s.length/2)), label: "主句" }, { part: s.trim().slice(Math.floor(s.length/2)), label: "从句/修饰" }],
    translation: "[AI翻译] 第" + (i+1) + "句",
    grammarNotes: "涉及定语从句、非谓语动词等语法结构",
  }));
  return NextResponse.json({ sentences: result });
}