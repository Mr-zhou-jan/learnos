"use client";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { ListeningQuestionData } from "@/data/listening-sets";

interface Props {
  question: ListeningQuestionData;
  userAnswer: number | null;
  showCorrect: boolean;
}

function highlightScript(script: string, sourceSentence: string, sourceIndex: number) {
  if (!sourceSentence) return { before: script, highlighted: "", after: "" };
  const sentences = script.split(/(?<=[.!?])\s+/);
  const idx = Math.min(sourceIndex, sentences.length - 1);
  const before = sentences.slice(0, idx).join(" ");
  const after = sentences.slice(idx + 1).join(" ");
  return { before, highlighted: sentences[idx] || "", after };
}

export default function ListeningAnswerCard({ question, userAnswer, showCorrect }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isCorrect = userAnswer === question.correctIndex;
  const sourceSentence = question.answerSource?.sentence || "";
  const sourceIndex = question.answerSource?.sentenceIndex ?? 0;
  const { before, highlighted, after } = highlightScript(
    question.audioScript, sourceSentence, sourceIndex
  );
  const optionLabel = (i: number) => String.fromCharCode(65 + i);

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-zinc-50 transition-colors"
      >
        <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-zinc-100 text-zinc-600 shrink-0">
          {question.questionNumber}
        </span>
        <span className="flex-1 text-sm font-medium truncate">{question.question}</span>
        {showCorrect && (
          isCorrect
            ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            : <XCircle className="w-5 h-5 text-red-500 shrink-0" />
        )}
        {expanded ? <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t pt-4 space-y-4">
          <div>
            <p className="text-xs font-bold text-zinc-500 mb-2">听力原文（答案出处已标出）</p>
            <div className="p-3 bg-zinc-50 rounded-lg text-sm leading-relaxed">
              {before && <span className="text-zinc-600">{before} </span>}
              {highlighted && (
                <span className="bg-amber-200 text-amber-900 font-medium px-0.5 rounded">{highlighted}</span>
              )}
              {after && <span className="text-zinc-600"> {after}</span>}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-zinc-500 mb-2">选项</p>
            <div className="space-y-1.5">
              {question.options.map((opt, i) => {
                const isUserSel = userAnswer === i;
                const isCorrectAns = i === question.correctIndex;
                let cls = "text-sm px-3 py-2 rounded-lg border ";
                if (showCorrect) {
                  if (isCorrectAns) cls += "border-emerald-300 bg-emerald-50 text-emerald-800";
                  else if (isUserSel && !isCorrectAns) cls += "border-red-300 bg-red-50 text-red-800";
                  else cls += "border-zinc-100 text-zinc-500";
                } else {
                  cls += isUserSel ? "border-primary-300 bg-primary-50 text-primary-700" : "border-zinc-100 text-zinc-600";
                }
                return (
                  <div key={i} className={cls}>
                    <span className="font-bold mr-2">{optionLabel(i)}.</span>
                    {opt.replace(/^[A-D][.\s]+/, "")}
                    {showCorrect && isCorrectAns && <CheckCircle2 className="w-4 h-4 text-emerald-500 inline ml-2" />}
                    {showCorrect && isUserSel && !isCorrectAns && <XCircle className="w-4 h-4 text-red-500 inline ml-2" />}
                  </div>
                );
              })}
            </div>
          </div>

          {showCorrect && (
            <div className={`p-3 rounded-lg text-sm ${isCorrect ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
              <p className="font-bold mb-1">{isCorrect ? "回答正确" : `回答错误 · 正确答案: ${optionLabel(question.correctIndex)}`}</p>
              <p className="leading-relaxed">{question.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
