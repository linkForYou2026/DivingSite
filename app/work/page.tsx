// ダイビングの仕事：依頼したい方向け（仕様書 6.9 A／F-02）。料金は管理画面の「自社メニュー・料金」
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import ServiceCards from "@/components/ServiceCards";
import ContactBand from "@/components/ContactBand";
import PriceNotice from "@/components/PriceNotice";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta(
  "ダイビングの仕事（仕事メニュー・料金）",
  "水中撮影・動画制作、ダイビングガイド、水中調査・マップ作り、取材・SNS発信、ツアー企画など、ダイビングに関するお仕事をお受けしています。",
  "/work/",
);

export default function Page() {
  return (
    <>
      <PageHeader title="ダイビングの仕事" lead="ダイビングに関するお仕事をお受けしています（ご依頼をお考えの方向け）。" />
      <div className="mx-auto max-w-6xl px-4">
        <Section title="仕事メニュー・料金">
          <ServiceCards />
          <PriceNotice className="mt-3" />
        </Section>
        <p className="mt-6 text-sm">講習の料金は<Link href="/license/course/" className="text-ocean underline">講習案内</Link>をご覧ください。</p>
        <p className="mt-2 text-right text-sm"><Link href="/work/earn/" className="text-ocean underline">ダイビングを仕事にしたい方はこちら →</Link></p>
        <ContactBand title="お仕事のご依頼・お見積り" text="内容・日程・場所を教えていただければ、お見積りします。" button="仕事を依頼する" purpose="work" />
      </div>
    </>
  );
}
