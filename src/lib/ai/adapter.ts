import type { ChatMessage, ChatOptions } from "@/types";

export interface AIModelAdapter {
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>;
  streamChat(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string>;
}

export function createDeepSeekAdapter(apiKey: string, baseUrl?: string): AIModelAdapter {
  const BASE = baseUrl || "https://api.deepseek.com/v1";
  return {
    async chat(messages, options) {
      const res = await fetch(`${BASE}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: options?.model || "deepseek-chat", messages, temperature: options?.temperature ?? 0.7, max_tokens: options?.maxTokens ?? 2048, stream: false }),
      });
      if (!res.ok) throw new Error(`DeepSeek API error: ${res.status}`);
      const data = await res.json();
      return data.choices[0]?.message?.content || "";
    },
    async *streamChat(messages, options) {
      const res = await fetch(`${BASE}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: options?.model || "deepseek-chat", messages, temperature: options?.temperature ?? 0.7, max_tokens: options?.maxTokens ?? 2048, stream: true }),
      });
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ") && line.slice(6) !== "[DONE]") {
            try { const c = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content; if (c) yield c; } catch {}
          }
        }
      }
    },
  };
}

export function buildSocraticPrompt(topic: string, desc?: string): ChatMessage[] {
  return [{
    role: "system",
    content: `你是苏格拉底式导师，通过提问引导学生思考，绝不直接给答案。

规则：1.每次只问一个问题 2.基于回答追问深层"为什么" 3.正确则肯定后继续深入 4.错误则用更简单的问题引导 5.适时总结已知信息 6.绝不给答案

知识点：${topic}${desc ? `\n描述：${desc}` : ""}`,
  }, {
    role: "user",
    content: `请教我关于"${topic}"的知识。用提问引导我思考。`,
  }];
}

export function buildFeynmanScoringPrompt(topic: string, definition: string, paraphrase: string): ChatMessage[] {
  return [{
    role: "system",
    content: `评估学生关于"${topic}"的复述。定义：${definition}

返回JSON: { "accuracy":0-100, "completeness":0-100, "logic":0-100, "clarity":0-100, "score":加权总分, "feedback":"中文反馈", "missingPoints":["遗漏点"] }`,
  }, {
    role: "user",
    content: `学生复述：${paraphrase}`,
  }];
}
