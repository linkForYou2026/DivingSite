import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FixedBar from "@/components/FixedBar";
import SiteChrome from "@/components/SiteChrome";
import { site } from "@/lib/data";
import { getSiteText } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const { name } = await getSiteText();
  return {
    metadataBase: new URL(site.url),
    title: { default: `${name}｜${site.tagline}`, template: `%s | ${name}` },
    description: site.description,
    openGraph: { type: "website", locale: "ja_JP", siteName: name, title: name, description: site.description, url: "/" },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = {
  themeColor: "#0d47a1",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { name } = await getSiteText();
  return (
    <html lang="ja">
      <body className="min-h-screen bg-white text-slate-800 antialiased">
        <SiteChrome header={<Header siteName={name} />} footer={<Footer siteName={name} tagline={site.tagline} />} fixedBar={<FixedBar />}>
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
