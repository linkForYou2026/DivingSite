// 講習案内・申し込み
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import ContactBand from "@/components/ContactBand";
import { contactHref, courses } from "@/lib/data";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta("講習案内・申し込み", "体験ダイビング、オープン・ウォーター、リフレッシュ講習などの講習案内と、申し込みの流れです。", "/license/course/");

const FLOW = [
  ["1. フォームで申し込み", "希望の講習と日程を送信"],
  ["2. 日程のご連絡", "原則2営業日以内に返信します"],
  ["3. 事前学習", "教材やオンラインで予習"],
  ["4. 講習当日", "プール・海で実習"],
];

export default function Page() {
  return (
    <>
      <PageHeader title="講習案内・申し込み" lead="開催している講習と、申し込みの流れです。" crumbs={[{ label: "資格ガイド", href: "/license/" }]} />
      <div className="mx-auto max-w-6xl px-4">
        <Section title="講習一覧">
          <div className="overflow-x-auto rounded-xl border border-sky-100">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr>{["講習", "日数の目安", "料金", ""].map((h) => <th key={h} className="bg-pro px-3 py-2 text-left text-white">{h}</th>)}</tr>
              </thead>
              <tbody>
                {courses.items.map((c) => (
                  <tr key={c.name}>
                    <td className="border-b border-sky-100 px-3 py-2 font-bold">{c.name}</td>
                    <td className="border-b border-sky-100 px-3 py-2">{c.days}</td>
                    <td className="border-b border-sky-100 px-3 py-2">{c.price}</td>
                    <td className="border-b border-sky-100 px-3 py-2 text-right">
                      <Link href={contactHref({ purpose: "講習の申し込み", detail: `${c.name}の講習を希望` })} className="btn btn-warm py-1 text-sm">申し込む</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-500">※ 料金・日数は準備中です。資格の内容は<Link href="/license/" className="text-ocean underline">資格ガイド</Link>をご覧ください。</p>
        </Section>
        <Section title="申し込みの流れ">
          <ol className="grid gap-3 md:grid-cols-4">
            {FLOW.map(([t, d]) => (
              <li key={t} className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4"><b>{t}</b><br /><span className="text-sm">{d}</span></li>
            ))}
          </ol>
        </Section>
        <ContactBand purpose="講習の申し込み" button="講習を申し込む" />
      </div>
    </>
  );
}
