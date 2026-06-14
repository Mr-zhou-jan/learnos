import { NextRequest, NextResponse } from "next/server";
import { promises as dns } from "dns";
import * as net from "net";

/** 临时邮箱域名黑名单 */
const DISPOSABLE_DOMAINS = new Set([
  "temp-mail.org", "tempmail.com", "tempmail.net",
  "10minutemail.com", "10minutemail.net", "10minmail.com",
  "guerrillamail.com", "guerrillamail.net", "guerrillamail.org",
  "mailinator.com", "mailinator.net",
  "yopmail.com", "yopmail.net",
  "throwaway.email", "throwawaymail.com",
  "sharklasers.com", "grr.la", "pokemail.net",
  "spam4.me", "trashmail.com", "trashmail.net",
  "dispostable.com", "maildrop.cc", "getairmail.com",
  "fakeinbox.com", "tempr.email", "emailondeck.com",
  "mohmal.com", "mailnesia.com", "anonbox.net",
  "mytrashmail.com", "mintemail.com",
  "chacuo.net", "linshiyou.com", "linshiyouxiang.net",
  "bccto.me", "moakt.com", "mailmetrash.com",
  "wegwerfmail.de", "trash-mail.com", "trashmail.de",
  "dropmail.me", "sammimail.com",
]);

/** 拼写纠错 */
const TYPO_SUGGESTIONS: Record<string, string> = {
  "gmial.com": "gmail.com", "gamil.com": "gmail.com", "gmai.com": "gmail.com",
  "gmail.con": "gmail.com", "gmali.com": "gmail.com",
  "qq.con": "qq.com", "qq.co": "qq.com", "qqcom": "qq.com",
  "163.con": "163.com", "163.co": "163.com",
  "126.con": "126.com",
  "outlook.con": "outlook.com", "outlok.com": "outlook.com",
  "hotmail.con": "hotmail.com", "hotmai.com": "hotmail.com",
  "yahoo.con": "yahoo.com", "yaho.com": "yahoo.com",
  "icloud.con": "icloud.com",
};

/**
 * SMTP RCPT TO 验证：连接邮件服务器，尝试验证收件地址是否存在
 * 注意：不会发送实际邮件（不会发送 DATA 指令）
 */
function smtpVerify(email: string, mxHost: string): Promise<"valid" | "invalid" | "unknown"> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let buffer = "";
    let step = 0; // 0=connect, 1=helo, 2=mailfrom, 3=rcptto
    const timeout = 8000;

    const cleanup = (result: "valid" | "invalid" | "unknown") => {
      clearTimeout(timer);
      try { socket.destroy(); } catch {}
      resolve(result);
    };

    const timer = setTimeout(() => cleanup("unknown"), timeout);

    socket.connect(25, mxHost);

    socket.on("connect", () => {
      // 等待服务器 greeting
    });

    socket.on("data", (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split("\r\n");
      // 保留最后一个未完成的行
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        const code = parseInt(line.slice(0, 3));

        switch (step) {
          case 0: // 收到 greeting
            if (code === 220) {
              step = 1;
              socket.write(`HELO learnos.local\r\n`);
            } else {
              cleanup("unknown");
            }
            break;

          case 1: // HELO 响应
            if (code === 250) {
              step = 2;
              socket.write(`MAIL FROM:<verify@learnos.local>\r\n`);
            } else {
              cleanup("unknown");
            }
            break;

          case 2: // MAIL FROM 响应
            if (code === 250) {
              step = 3;
              socket.write(`RCPT TO:<${email}>\r\n`);
            } else {
              cleanup("unknown");
            }
            break;

          case 3: // RCPT TO 响应 — 关键！
            socket.write(`QUIT\r\n`);
            if (code === 250 || code === 251) {
              cleanup("valid");
            } else if (code === 550 || code === 551 || code === 552 || code === 553 || code === 554) {
              // 550 = mailbox not found, 551 = user not local, etc.
              cleanup("invalid");
            } else {
              // 其他响应码（如 450/451 临时错误，或 252 等）
              cleanup("unknown");
            }
            break;
        }
      }
    });

    socket.on("error", () => cleanup("unknown"));
    socket.on("timeout", () => cleanup("unknown"));
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ valid: false, reason: "请输入邮箱" });

    const trimmed = email.trim().toLowerCase();
    const atIndex = trimmed.lastIndexOf("@");
    if (atIndex <= 0) return NextResponse.json({ valid: false, reason: "邮箱格式不正确" });

    const domain = trimmed.slice(atIndex + 1);

    // 1. 拼写纠错
    if (TYPO_SUGGESTIONS[domain]) {
      return NextResponse.json({
        valid: false,
        reason: `邮箱域名可能拼写有误，您是想输入 @${TYPO_SUGGESTIONS[domain]} 吗？`,
        suggestion: TYPO_SUGGESTIONS[domain],
      });
    }

    // 2. 临时邮箱黑名单
    if (DISPOSABLE_DOMAINS.has(domain)) {
      return NextResponse.json({ valid: false, reason: "不支持临时/一次性邮箱，请使用真实邮箱注册" });
    }

    // 3. DNS MX 记录查询
    let mxRecords: { exchange: string; priority: number }[];
    try {
      mxRecords = await dns.resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        return NextResponse.json({
          valid: false,
          reason: `邮箱域名 ${domain} 未配置邮件服务，无法接收邮件`,
        });
      }
    } catch {
      return NextResponse.json({
        valid: false,
        reason: `邮箱域名 ${domain} 不存在，请检查拼写`,
      });
    }

    // 4. SMTP 验证邮箱地址是否真实存在
    // 按优先级排序，从最高优先级开始尝试
    mxRecords.sort((a, b) => a.priority - b.priority);

    let smtpResult: "valid" | "invalid" | "unknown" = "unknown";
    for (const mx of mxRecords.slice(0, 3)) {
      // 跳过明显是网关/反垃圾的 MX
      const host = mx.exchange.toLowerCase();
      if (host.includes("spam") || host.includes("gw-")) continue;

      smtpResult = await smtpVerify(trimmed, mx.exchange);
      if (smtpResult !== "unknown") break; // 得到明确结果就停止
    }

    if (smtpResult === "invalid") {
      return NextResponse.json({
        valid: false,
        reason: `邮箱地址 ${trimmed} 不存在，请检查是否正确`,
      });
    }

    // SMTP 返回 valid 或 unknown 都放行
    // unknown 可能是因为服务器不透露信息（反垃圾策略），不能因此拒绝真实用户
    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ valid: false, reason: "验证服务异常，请稍后重试" });
  }
}
