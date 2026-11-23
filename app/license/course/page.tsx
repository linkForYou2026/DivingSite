// 講習案内・申し込み
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import ContactBand from "@/components/ContactBand";
import CourseTable from "@/components/CourseTable";
import PriceNotice from "@/components/PriceNotice";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta("講習案内・申し込み", "体験ダイビング、オープン・ウォーター、リフレッシュ講習などの講習案内と、申し込みの流れです。", "/license/course/");

const FLOW = [
  ["1. フォームで申し込み", "希望の講習と日程を送信"],
  ["2. 日程のご連絡", "内容を確認してご連絡します"],
  ["3. 事前学習", "教材やオンラインで予習"],
  ["4. 講習当日", "プール・海で実習"],
];

export default function Page() {
  return (
    <>
      <PageHeader title="講習案内・申し込み" lead="開催している講習と、申し込みの流れです。" crumbs={[{ label: "資格ガイド", href: "/license/" }]} />
      <div className="mx-auto max-w-6xl px-4">
        <Section title="講習一覧">
          <CourseTable />
          <p className="mt-2 text-xs text-slate-500">資格の内容は<Link href="/license/" className="text-ocean underline">資格ガイド</Link>をご覧ください。</p>
          <PriceNotice className="mt-3" />
        </Section>
        <Section title="申し込みの流れ">
          <ol className="grid gap-3 md:grid-cols-4">
            {FLOW.map(([t, d]) => (
              <li key={t} className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4"><b>{t}</b><br /><span className="text-sm">{d}</span></li>
            ))}
          </ol>
        </Section>
        <ContactBand purpose="course" button="講習を申し込む" />
      </div>
    </>
  );
}
