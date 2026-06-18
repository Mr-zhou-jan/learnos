"use client";

const OPTIONS = [
  { id: "easy", label: "基础", sub: "~1min", icon: "🟢" },
  { id: "medium", label: "中等", sub: "~2min", icon: "🟡" },
  { id: "hard", label: "困难", sub: "~3min", icon: "🔴" },
  { id: "mixed", label: "综合", sub: "混合", icon: "🔀" },
];

export default function DifficultyPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map(d => (
        <button key={d.id} onClick={() => { onChange(d.id); localStorage.setItem("learnos_quiz_difficulty", d.id); }}
          className={"flex-1 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all " +
            (value === d.id ? "border-primary-500 bg-primary-50 text-primary-700 shadow-sm" : "border-zinc-200 text-zinc-500 hover:border-zinc-300")}>
          <span className="block">{d.icon} {d.label}</span>
          <span className="text-[10px] opacity-60">{d.sub}</span>
        </button>
      ))}
    </div>
  );
}
