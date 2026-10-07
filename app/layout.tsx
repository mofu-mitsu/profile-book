import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Profile Book — SNSプロフィールカードメーカー", description: "好きな項目だけ選んで作れるSNSプロフィール帳メーカー。" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ja"><body>{children}</body></html>; }