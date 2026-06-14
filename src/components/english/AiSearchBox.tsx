"use client";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";

interface Props {
  moduleName: string;
  placeholder?: string;
}

export default function AiSearchBox({ moduleName, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const history = [...messages, { role: "user", content: text }];
    setMessages(history);
    setLoading(true);

    try {
      const resp = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: `你是CET-4/6英语${moduleName}的AI辅导专家。用户正在做${moduleName}练习，请围绕这个主题回答综合性问题。用中文回答，示例要清晰。` },
            ...history,
          ],
          stream: true,
        }),
      });
      if (!resp.ok) throw new Error("请求失败");
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("无法读取响应流");
      const decoder = new TextDecoder();
      let reply = "";
      setMessages([...history, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content || "";
            reply += delta;
            setMessages([...history, { role: "assistant", content: reply }]);
          } catch {}
        }
      }
    } catch {
      setMessages([...history, { role: "assistant", content: "抱歉，AI服务暂时不可用，请稍后再试。" }]);
    }
    setLoading(false);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary-500 text-white shadow-lg hover:bg-primary-600 transition-all flex items-center justify-center"
          title={`AI ${moduleName}助手`}
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-zinc-200 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary-50 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-500" />
              <span className="font-bold text-sm">AI {moduleName}助手</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-zinc-400 text-sm py-8">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>在{moduleName}中遇到问题？</p>
                <p className="mt-1">问我任何综合性问题吧！</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-primary-500 text-white rounded-br-md"
                    : "bg-zinc-100 text-zinc-800 rounded-bl-md"
                }`}>
                  {m.content || (m.role === "assistant" && loading && <Loader2 className="w-4 h-4 animate-spin inline" />)}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="border-t p-3 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }}}
              placeholder={placeholder || `问关于${moduleName}的问题...`}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 disabled:bg-zinc-50"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 disabled:bg-zinc-200 disabled:text-zinc-400 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
