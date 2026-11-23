// ダイビングで稼ぐには：仕事にしたい方向け（仕様書 6.9 B）
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import ContactBand from "@/components/ContactBand";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta(
  "ダイビングで稼ぐには",
  "ダイビングを仕事にしたい方へ。ダイブマスター、インストラクターなど資格とできる仕事の関係、ダイビング関連の仕事の種類を紹介します。",
  "/work/earn/",
);

const ROWS: [string, string][] = [
  ["ダイブマスター", "ファンダイブのガイド、講習のアシスト"],
  ["アシスタント・インストラクター", "一部の講習の担当、講習のアシスト"],
  ["インストラクター", "資格講習・体験ダイビングの実施"],
];
const JOBS = ["ガイド", "インストラクター", "水中撮影", "ツアー企画", "ショップスタッフ", "SNS・動画発信", "ライター"];

export default function Page() {
  return (
    <>
      <PageHeader title="ダイビングで稼ぐには" lead="ダイビングを仕事にしたい方へ。資格と仕事の関係をまとめました。" crumbs={[{ label: "ダイビングの仕事", href: "/work/" }]} />
      <div className="mx-auto max-w-6xl px-4">
        <Section title="資格と仕事の関係">
          <div className="overflow-x-auto rounded-xl border border-sky-100">
            <table className="w-full text-sm">
              <thead><tr><th className="bg-pro px-3 py-2 text-left text-white">資格</th><th className="bg-pro px-3 py-2 text-left text-white">できる仕事の例</th></tr></thead>
              <tbody>
                {ROWS.map(([a, b]) => (
                  <tr key={a}><td className="border-b border-sky-100 px-3 py-2 font-bold">{a}</td><td className="border-b border-sky-100 px-3 py-2">{b}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link href="/license/" className="btn btn-primary mt-4 text-sm">資格ガイドで取る順番を見る</Link>
        </Section>
        <Section title="ダイビングに関わる仕事の種類" lead="資格を活かす仕事のほか、写真・動画や発信の力を活かす仕事もあります。">
          <ul className="flex flex-wrap gap-2">
            {JOBS.map((j) => <li key={j} className="rounded-full border border-sky-200 bg-white px-4 py-1.5 text-sm font-bold text-pro">{j}</li>)}
          </ul>
        </Section>
        <Section title="国家資格「潜水士」について">
          <p className="rounded-xl bg-sand px-4 py-3 text-sm">業務として潜水を行う場合に関わる国家資格「潜水士」についても、こちらで紹介する予定です（準備中）。</p>
        </Section>
        <ContactBand title="プロを目指したい方へ" text="ダイブマスターやインストラクターを目指す方のご相談も受け付けています。" button="相談する" purpose="講習の申し込み" />
      </div>
    </>
  );
}
