// ダイビングの仕事：依頼したい方向け（仕様書 6.9 A／F-02）
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import WorkCards from "@/components/WorkCards";
import Placeholder from "@/components/Placeholder";
import ContactBand from "@/components/ContactBand";
import { works } from "@/lib/data";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta(
  "ダイビングの仕事（仕事メニュー・料金）",
  "水中撮影・動画制作、ダイビングガイド、講習、水中調査・マップ作り、取材・SNS発信、ツアー企画など、ダイビングに関するお仕事をお受けしています。",
  "/work/",
);

export default function Page() {
  return (
    <>
      <PageHeader title="ダイビングの仕事" lead="ダイビングに関するお仕事をお受けしています（ご依頼をお考えの方向け）。" />
      <div className="mx-auto max-w-6xl px-4">
        <Section title="仕事メニュー・料金">
          <WorkCards />
          <p className="mt-2 text-xs text-slate-500">※ 料金は準備中です。内容に応じてお見積りします。</p>
        </Section>
        <Section title="実績">
          {works.achievements.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {works.achievements.map((a) => (
                <figure key={a.title}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.image} alt={a.alt} className="aspect-[4/3] w-full rounded-xl object-cover" loading="lazy" />
                  <figcaption className="mt-1 text-xs">{a.title}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <Placeholder title="実績（写真・動画）" text="準備中です" />
          )}
        </Section>
        <p className="mt-6 text-right text-sm"><Link href="/work/earn/" className="text-ocean underline">ダイビングを仕事にしたい方はこちら →</Link></p>
        <ContactBand title="お仕事のご依頼・お見積り" text="内容・日程・場所を教えていただければ、お見積りします。" button="仕事を依頼する" purpose="仕事の依頼" />
      </div>
    </>
  );
}
