// トップページ（仕様書 6.1）
import Link from "next/link";
import Section from "@/components/Section";
import SpotCard from "@/components/SpotCard";
import EventList from "@/components/EventList";
import WorkCards from "@/components/WorkCards";
import ContactBand from "@/components/ContactBand";
import { YouTubeEmbed, InstagramEmbed } from "@/components/SocialEmbeds";
import { site, spotsData, voices } from "@/lib/data";
import { formatDate, getAllPosts } from "@/lib/blog";

const DOORS = [
  { label: "はじめての方", sub: "何から始める？費用は？", href: "/beginner/" },
  { label: "資格を取りたい", sub: "取る順番と内容", href: "/license/" },
  { label: "潜りに行きたい", sub: "目的・エリアで探す", href: "/spots/" },
  { label: "仕事を頼みたい", sub: "撮影・ガイド・講習", href: "/work/" },
];

const PURPOSE_ICONS: Record<string, string> = {
  サンゴ礁: "🪸", 沈船: "⚓", "地形・洞窟": "🪨", 大物: "🦈", マクロ: "🦐", 透明度: "💎",
};
const PURPOSE_LABEL: Record<string, string> = { 透明度: "綺麗な海", マクロ: "マクロ（小さな生き物）" };

export default function Home() {
  const popular = spotsData.spots
    .filter((s) => s.popularRank)
    .sort((a, b) => (a.popularRank ?? 0) - (b.popularRank ?? 0))
    .slice(0, 5);
  const posts = getAllPosts().slice(0, 4);

  return (
    <>
      {/* 1. メインビジュアル */}
      <div className="relative overflow-hidden bg-[radial-gradient(ellipse_at_20%_0%,rgba(179,229,252,0.55),transparent_55%),linear-gradient(180deg,#0288d1_0%,#01579b_55%,#062a4f_100%)] text-white">
        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-12 md:pt-16">
          <p className="text-xs tracking-[0.25em] opacity-90 md:text-sm">{site.tagline}</p>
          <h1 className="mt-2 text-3xl font-bold leading-snug drop-shadow md:text-5xl">
            {site.catchCopy.map((line, i) => (
              <span key={i} className="block">{line}</span>
            ))}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed opacity-95 md:text-base">
            資格の取り方から、潜りに行く海選び、撮影、仕事の依頼、仲間づくりまで。「行ってみたい」から「申し込む」まで、迷わず進めます。
          </p>
          <div className="mt-6 grid max-w-4xl grid-cols-2 gap-2.5 md:grid-cols-4">
            {DOORS.map((d) => (
              <Link key={d.href} href={d.href} className="rounded-2xl bg-white/95 px-4 py-3 font-extrabold text-pro shadow-lg transition hover:-translate-y-0.5">
                {d.label}
                <span className="block text-xs font-normal text-slate-500">{d.sub}</span>
              </Link>
            ))}
          </div>
        </div>
        <svg aria-hidden="true" className="absolute inset-x-0 -bottom-px h-14 w-full" viewBox="0 0 1200 56" preserveAspectRatio="none">
          <path d="M0 30 C 200 0 400 56 600 28 S 1000 4 1200 30 L1200 56 L0 56Z" fill="#fff" />
        </svg>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        {/* 2. 目的から探す */}
        <Section title="目的から探す" en="PURPOSE" lead="見たいもの・やりたいことから、ぴったりの海が見つかります。">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {spotsData.purposes.map((p) => (
              <Link
                key={p}
                href={`/spots/?purpose=${encodeURIComponent(p)}`}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-sky-100 bg-white px-2 py-4 text-sm font-bold hover:border-ocean hover:text-pro"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-2xl" aria-hidden="true">{PURPOSE_ICONS[p] ?? "🌊"}</span>
                {PURPOSE_LABEL[p] ?? p}
              </Link>
            ))}
          </div>
        </Section>

        {/* 3. 人気のスポット */}
        <Section title="人気のスポット" en="RANKING">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {popular.map((s) => <SpotCard key={s.id} spot={s} rank={s.popularRank ?? undefined} />)}
          </div>
          <p className="mt-3 text-right text-sm"><Link href="/spots/" className="text-ocean underline">スポットをもっと探す →</Link></p>
        </Section>

        {/* 4. 次のイベント */}
        <Section title="次のイベント" en="EVENT">
          <EventList limit={3} />
          <p className="mt-3 text-right text-sm"><Link href="/events/" className="text-ocean underline">イベント・ツアーの一覧を見る →</Link></p>
        </Section>

        {/* 5. 資格ステップアップ */}
        <Section title="資格ステップアップ" en="LICENSE">
          <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
            <ol className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold">
              <li className="rounded-lg bg-leisure px-2.5 py-1 text-leisure-ink">① OW</li><li aria-hidden="true" className="text-ocean">→</li>
              <li className="rounded-lg bg-leisure px-2.5 py-1 text-leisure-ink">② AOW</li><li aria-hidden="true" className="text-ocean">→</li>
              <li className="rounded-lg bg-leisure px-2.5 py-1 text-leisure-ink">③ レスキュー</li><li className="text-ocean">｜ここからプロ｜</li>
              <li className="rounded-lg bg-pro px-2.5 py-1 text-white">④ ダイブマスター</li><li aria-hidden="true" className="text-ocean">→</li>
              <li className="rounded-lg border-2 border-dashed border-pro bg-white px-2.5 py-0.5 text-pro">⑤ 準インストラクター（任意）</li><li aria-hidden="true" className="text-ocean">→</li>
              <li className="rounded-lg bg-pro px-2.5 py-1 text-white">⑥ インストラクター</li>
            </ol>
            <p className="mt-3 text-sm">はじめての資格からプロまで、取る順番と「その資格で何ができるか」を図で解説しています。</p>
            <Link href="/license/" className="btn btn-primary mt-3 text-sm">資格ガイドを見る</Link>
          </div>
        </Section>

        {/* 6. 動画・SNS */}
        <Section title="動画・SNS" en="MOVIE & SNS">
          <div className="grid gap-4 md:grid-cols-2">
            <YouTubeEmbed compact />
            <InstagramEmbed limit={1} />
          </div>
        </Section>

        <div className="grid gap-x-8 md:grid-cols-2">
          {/* 7. お知らせ・新着記事 */}
          <Section title="お知らせ・新着記事" en="NEWS">
            {posts.length ? (
              <ul>
                {posts.map((p) => (
                  <li key={p.slug} className="flex gap-3 border-b border-dotted border-sky-100 py-2 text-sm">
                    <time className="flex-none text-slate-500" dateTime={p.date}>{formatDate(p.date)}</time>
                    <Link href={`/blog/${p.slug}/`} className="text-ocean underline">{p.title}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">記事は準備中です。</p>
            )}
            <p className="mt-3 text-right text-sm"><Link href="/blog/" className="text-ocean underline">ブログ一覧へ →</Link></p>
          </Section>

          {/* 8. 参加者の声 */}
          <Section title="参加者の声" en="VOICE">
            <div className="grid gap-3">
              {voices.items.map((v) => (
                <figure key={v.text} className="rounded-2xl border border-sky-100 bg-white p-4 text-sm">
                  <blockquote>“{v.text}”</blockquote>
                  <figcaption className="mt-1.5 text-xs text-slate-500">{v.who}</figcaption>
                </figure>
              ))}
            </div>
          </Section>
        </div>

        {/* 9. ダイビングの仕事 */}
        <Section title="ダイビングの仕事" en="WORK" lead="水中撮影、ガイド、講習、調査など、ダイビングに関するお仕事をお受けしています。">
          <WorkCards limit={3} withButton={false} />
          <p className="mt-3 text-right text-sm"><Link href="/work/" className="text-ocean underline">仕事メニュー・料金を見る →</Link></p>
        </Section>

        {/* 10. お問い合わせ */}
        <ContactBand />
      </div>
    </>
  );
}
