import { NextRequest, NextResponse } from "next/server";
import * as tls from "tls";

// 内存存储验证码（key=email, value={code, expires}）
const codeStore = new Map<string, { code: string; expires: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of codeStore) { if (now > v.expires) codeStore.delete(k); }
}, 60000);

export function verifyCode(email: string, code: string): boolean {
  const stored = codeStore.get(email.trim().toLowerCase());
  if (!stored || Date.now() > stored.expires) { codeStore.delete(email); return false; }
  return stored.code === code;
}

export function clearCode(email: string): void {
  codeStore.delete(email.trim().toLowerCase());
}

function genCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendSmtp(host: string, port: number, user: string, pass: string, to: string, subject: string, body: string): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok: boolean) => { if (!done) { done = true; try { s.destroy(); } catch {} resolve(ok); } };
    const timer = setTimeout(() => finish(false), 15000);

    const s = tls.connect(port, host, { rejectUnauthorized: false }, () => {
      let step = 0, buf = "";
      s.on("data", (d: Buffer) => {
        buf += d.toString();
        const lines = buf.split("\r\n"); buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const code = parseInt(line.slice(0, 3));
          switch (step) {
            case 0: if (code === 220) { step = 1; s.write(`EHLO lmos\r\n`); } else finish(false); break;
            case 1: if (code === 250) { step = 2; s.write(`AUTH LOGIN\r\n`); } else finish(false); break;
            case 2: if (code === 334) { step = 3; s.write(`${Buffer.from(user).toString("base64")}\r\n`); } else finish(false); break;
            case 3: if (code === 334) { step = 4; s.write(`${Buffer.from(pass).toString("base64")}\r\n`); } else finish(false); break;
            case 4: if (code === 235) { step = 5; s.write(`MAIL FROM:<${user}>\r\n`); } else finish(false); break;
            case 5: if (code === 250) { step = 6; s.write(`RCPT TO:<${to}>\r\n`); } else finish(false); break;
            case 6: if (code === 250 || code === 251) { step = 7; s.write(`DATA\r\n`); } else finish(false); break;
            case 7: if (code === 354) {
              s.write(`From: LearnOS <${user}>\r\nTo: <${to}>\r\nSubject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${body}\r\n.\r\n`);
              step = 8;
            } else finish(false); break;
            case 8: if (code === 250) { s.write(`QUIT\r\n`); finish(true); } else finish(false); break;
          }
        }
      });
      s.on("error", () => finish(false));
    });
    s.on("error", () => finish(false));
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ success: false, reason: "请输入邮箱" });

    const trimmed = email.trim().toLowerCase();

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "465");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass || user === "your_email@qq.com") {
      return NextResponse.json({ success: false, reason: "邮件服务未配置，请在 .env.local 设置 SMTP" });
    }

    const code = genCode();
    codeStore.set(trimmed, { code, expires: Date.now() + 5 * 60 * 1000 });

    const ok = await sendSmtp(host, port, user, pass, trimmed,
      "LearnOS 邮箱验证码",
      `您好！\n\n您的 LearnOS 验证码是：${code}\n\n验证码 5 分钟内有效，请勿泄露。\n\n—— LearnOS`
    );

    if (ok) return NextResponse.json({ success: true });
    codeStore.delete(trimmed);
    return NextResponse.json({ success: false, reason: "验证码发送失败，请检查 SMTP 配置是否正确" });
  } catch {
    return NextResponse.json({ success: false, reason: "发送失败，请稍后重试" });
  }
}
