import { NextRequest, NextResponse } from "next/server";
import * as tls from "tls";

async function sendMail(host: string, port: number, user: string, pass: string, to: string, subject: string, body: string): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok: boolean) => { if (!done) { done = true; try { s.destroy(); } catch {} resolve(ok); } };
    setTimeout(() => finish(false), 15000);
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
    const { content, userName, userEmail } = await req.json();
    if (!content?.trim()) return NextResponse.json({ success: false, reason: "请输入反馈内容" });

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "465");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.log("[反馈]", userName, userEmail, content.slice(0, 200));
      return NextResponse.json({ success: true, devMode: true, message: "SMTP未配置，反馈已记录到服务器日志" });
    }

    // 尝试发送邮件，失败也不影响用户——内容已记录到日志
    sendMail(host, port, user, pass, user,
      `[LearnOS反馈] ${(userName||"用户").slice(0, 20)}`,
      `来自：${userName||"匿名"}\n邮箱：${userEmail||"未知"}\n\n${content}`
    ).catch(() => {});
    console.log("[反馈]", userName, userEmail, content.slice(0, 300));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, reason: "提交失败" });
  }
}
