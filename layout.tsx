import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulse｜遠端工作打卡",
  description: "簡潔、安心的遠端上班打卡與工時管理。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
