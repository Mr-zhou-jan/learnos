import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LearnOS - AI主动学习平台",
  description: "面向大学生的AI学习操作系统",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
