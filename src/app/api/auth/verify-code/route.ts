import { NextRequest, NextResponse } from "next/server";
import { verifyCode, clearCode } from "@/app/api/auth/send-code/route";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) return NextResponse.json({ valid: false, reason: "请输入验证码" });

    if (verifyCode(email, code)) {
      clearCode(email);
      return NextResponse.json({ valid: true });
    }
    return NextResponse.json({ valid: false, reason: "验证码错误或已过期" });
  } catch {
    return NextResponse.json({ valid: false, reason: "验证失败" });
  }
}
