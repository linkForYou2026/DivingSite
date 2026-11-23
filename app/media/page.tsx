// 動画・SNS（仕様書 6.10／F-08）。管理画面の「動画・SNS投稿」に登録した投稿を表示
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import SnsIcons from "@/components/SnsIcons";
import SocialEmbeds from "@/components/SocialEmbeds";
import { getEmbeds } from "@/lib/content";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta("動画・SNS", "海の様子やイベントの雰囲気を、YouTube・Instagram・TikTok・Facebookで発信しています。", "/media/");

export default async function Page() {
  const embeds = await getEmbeds();
  return (
    <>
      <PageHeader title="動画・SNS" lead="海の様子やイベントの雰囲気を、動画と写真で発信しています。" />
      <div className="mx-auto max-w-6xl px-4">
        <div className="mt-6"><SnsIcons /></div>
        <Section title="YouTube"><SocialEmbeds embeds={embeds} platforms={["youtube", "youtube_playlist"]} emptyTitle="YouTube" /></Section>
        <Section title="Instagram"><SocialEmbeds embeds={embeds} platforms={["instagram"]} emptyTitle="Instagram" /></Section>
        <Section title="TikTok"><SocialEmbeds embeds={embeds} platforms={["tiktok"]} emptyTitle="TikTok" /></Section>
        <Section title="Facebook"><SocialEmbeds embeds={embeds} platforms={["facebook"]} emptyTitle="Facebook" /></Section>
        <p className="mt-10 text-right text-sm"><Link href="/blog/" className="text-ocean underline">ブログも見る →</Link></p>
      </div>
    </>
  );
}
