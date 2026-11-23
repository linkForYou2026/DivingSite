// スポット詳細（仕様書 6.5）
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import SpotCard, { SpotImage } from "@/components/SpotCard";
import { contactHref, monthsText, spotsData, yen } from "@/lib/data";
import { pageMeta } from "@/lib/meta";

export function generateStaticParams() {
  return spotsData.spots.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = spotsData.spots.find((x) => x.id === id);
  if (!s) return {};
  return pageMeta(`${s.name}のダイビング`, `${s.name}（${s.area}）のダイビング情報。${s.desc}`, `/spots/${s.id}/`);
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = spotsData.spots.find((x) => x.id === id);
  if (!s) notFound();
  const related = spotsData.spots.filter((x) => x.id !== s.id && x.purposes.some((p) => s.purposes.includes(p))).slice(0, 3);
  const rows: [string, string][] = [
    ["エリア", `${s.region}・${s.area}`],
    ["楽しめること", s.purposes.join("、")],
    ["レベルの目安", s.level],
    ["ベストシーズン", monthsText(s.months)],
    ["費用の目安", `${yen(s.cost)}〜（1人あたり・概算）`],
  ];
  return (
    <>
      <PageHeader title={s.name} lead={s.desc} crumbs={[{ label: "海・スポットを探す", href: "/spots/" }]} />
      <div className="mx-auto max-w-6xl px-4 pt-8">
        <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
          <div className="overflow-hidden rounded-2xl"><SpotImage spot={s} tall /></div>
          <div>
            <dl className="divide-y divide-sky-100 rounded-2xl border border-sky-100">
              {rows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[7.5rem_1fr] gap-2 px-4 py-2.5 text-sm">
                  <dt className="font-bold text-pro">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <Link href={contactHref({ purpose: "その他", detail: `スポット「${s.name}」について相談したい` })} className="btn btn-warm mt-4 block">
              このスポットについて相談する
            </Link>
            {spotsData.meta.sample && <p className="mt-2 text-xs text-slate-500">※ 掲載している内容は仮のサンプルです。</p>}
          </div>
        </div>
        {related.length > 0 && (
          <Section title="似ているスポット">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => <SpotCard key={r.id} spot={r} />)}
            </div>
          </Section>
        )}
        <p className="mt-8 text-sm"><Link href="/spots/" className="text-ocean underline">← スポット検索に戻る</Link></p>
      </div>
    </>
  );
}
