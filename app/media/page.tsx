// 動画・SNS（仕様書 6.10／F-08）
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import SnsIcons from "@/components/SnsIcons";
import { FacebookEmbed, InstagramEmbed, TikTokEmbed, YouTubeEmbed } from "@/components/SocialEmbeds";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta("動画・SNS", "海の様子やイベントの雰囲気を、YouTube・Instagram・TikTok・Facebookで発信しています。", "/media/");

export default function Page() {
  return (
    <>
      <PageHeader title="動画・SNS" lead="海の様子やイベントの雰囲気を、動画と写真で発信しています。" />
      <div className="mx-auto max-w-6xl px-4">
        <div className="mt-6"><SnsIcons /></div>
        <Section title="YouTube"><YouTubeEmbed /></Section>
        <Section title="Instagram"><InstagramEmbed /></Section>
        <Section title="TikTok"><TikTokEmbed /></Section>
        <Section title="Facebook"><FacebookEmbed /></Section>
        <p className="mt-10 text-right text-sm"><Link href="/blog/" className="text-ocean underline">ブログも見る →</Link></p>
      </div>
    </>
  );
}
