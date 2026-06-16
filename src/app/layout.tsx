import type { Metadata } from "next";
import "./globals.css";
import SwRegister from "./sw-register";
import ThemeProvider from "@/components/shared/ThemeProvider";

export const metadata: Metadata = {
  title: { default: "LearnOS - AI主动学习平台", template: "%s | LearnOS" },
  description: "面向大学生和自学者的AI驱动主动学习操作系统。AI诊断、知识图谱、费曼训练、艾宾浩斯记忆引擎，从被动浏览到主动掌握。",
  keywords: ["AI学习", "主动学习", "知识图谱", "间隔重复", "费曼训练", "四六级", "诊断测验", "错题本"],
  authors: [{ name: "LearnOS" }],
  openGraph: {
    type: "website", siteName: "LearnOS",
    title: "LearnOS - AI主动学习平台",
    description: "AI诊断 · 知识图谱 · 费曼训练 · 艾宾浩斯记忆引擎",
  },
  twitter: { card: "summary_large_image", title: "LearnOS - AI主动学习平台" },
  robots: { index: true, follow: true },
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/favicon.png" }] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
        <SwRegister />
      </body>
    </html>
  );
}
