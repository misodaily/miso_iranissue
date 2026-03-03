import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "미국-이란 실시간 이슈 대시보드",
  description: "Real-time US-Iran news monitoring and risk analysis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
