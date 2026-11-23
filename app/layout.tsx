import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://diving.link-since2026.jp"),
  title: {
    default: "ダイビング総合ポータル（仮）",
    template: "%s | ダイビング総合ポータル（仮）",
  },
  description:
    "ダイビングの資格、海・スポット選び、水中撮影、仕事の依頼、イベントまで。学ぶ・潜る・撮る・働く・つながるをひとつに。",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "ダイビング総合ポータル（仮）",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-white text-slate-800 antialiased">{children}</body>
    </html>
  );
}
