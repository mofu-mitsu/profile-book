import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://profile-book-nine.vercel.app";
const pageTitle = "SNSプロフィールカード作成・プロフィール帳メーカー｜Profile Book";
const pageDescription = "SNSで使えるプロフィールカードを無料作成！好きなもの・趣味・MBTI・SNSスタンスなど、好きな項目とデザインを選んでかわいいプロフィール帳を作成。PNG画像で保存・共有できます。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: pageTitle, template: "%s｜Profile Book" },
  description: pageDescription,
  applicationName: "Profile Book",
  keywords: ["プロフィールカード", "プロフィール帳", "SNSプロフィール", "プロフィール画像 作成", "プロフカード", "プロフ帳", "自己紹介カード", "MBTI プロフィール", "SNS 自己紹介", "プロフィールカードメーカー", "無料", "PNG 保存"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", url: siteUrl + "/", siteName: "Profile Book", locale: "ja_JP",
    title: pageTitle, description: pageDescription,
    images: [{ url: siteUrl + "/ogp.png", width: 1200, height: 630, alt: "Profile Book｜無料SNSプロフィールカード・プロフィール帳メーカー" }]
  },
  twitter: {
    card: "summary_large_image", title: pageTitle, description: pageDescription,
    images: [{ url: siteUrl + "/ogp.png", alt: "Profile Book｜SNSプロフィールカードメーカー" }]
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } }
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
