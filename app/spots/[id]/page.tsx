// スポット詳細（仕様書 6.5）
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import SpotCard, { SpotImage } from "@/components/SpotCard";
import { contactHref, monthsText } from "@/lib/data";
import { getSpots } from "@/lib/content";
import { pageMeta } from "@/lib/meta";
import { asOf, yen } from "@/shared/format";

export async function generateStaticParams() {
  const { spots } = await getSpots();
  // 静的書き出しでは1件以上必要なため、スポットがまだないときは空のページを1つだけ作る
  return spots.length ? spots.map((s) => ({ id: s.slug })) : [{ id: "_" }];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = (await getSpots()).spots.find((x) => x.slug === id);
  if (!s) return {};
  return pageMeta(`${s.name}のダイビング`, `${s.name}（${s.area}）のダイビング情報。${s.summary}`, `/spots/${s.slug}/`);
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { spots } = await getSpots();
  const s = spots.find((x) => x.slug === id);
  if (!s) notFound();
  const related = spots.filter((x) => x.slug !== s.slug && x.purposes.some((p) => s.purposes.includes(p))).slice(0, 3);
  const rows: [string, string][] = [
    ["エリア", `${s.regionLabel}・${s.area}`],
    ["楽しめること", s.purposes.join("、") || "—"],
    ["レベルの目安", s.levelLabel],
    ["ベストシーズン", monthsText(s.months)],
    ["費用の目安", s.cost !== null ? `${yen(s.cost)}〜（1人あたり・税込）${s.costNote ? `／${s.costNote}` : ""}${s.isEstimate ? `／${asOf(s.checkedOn)}の目安` : ""}` : "—"],
  ];
  if (s.access) rows.push(["行き方", s.access]);
  return (
    <>
      <PageHeader title={s.name} lead={s.summary} crumbs={[{ label: "海・スポットを探す", href: "/spots/" }]} />
      <div className="mx-auto max-w-6xl px-4 pt-8">
        <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
          <div className="overflow-hidden rounded-2xl"><SpotImage spot={s} tall /></div>
          <div>
            <dl className="divide-y divide-sky-100 rounded-2xl border border-sky-100">
              {rows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[7.5rem_1fr] gap-2 px-4 py-2.5 text-sm">
                  <dt className="font-bold text-pro">{k}</dt>
                  <dd className="whitespace-pre-wrap">{v}</dd>
                </div>
              ))}
            </dl>
            <Link href={contactHref({ purpose: "other", detail: `スポット「${s.name}」について相談したい` })} className="btn btn-warm mt-4 block">
              このスポットについて相談する
            </Link>
          </div>
        </div>
        {s.bodyHtml && <div className="prose-blog mt-8 max-w-3xl" dangerouslySetInnerHTML={{ __html: s.bodyHtml }} />}
        {related.length > 0 && (
          <Section title="似ているスポット">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => <SpotCard key={r.slug} spot={r} />)}
            </div>
          </Section>
        )}
        <p className="mt-8 text-sm"><Link href="/spots/" className="text-ocean underline">← スポット検索に戻る</Link></p>
      </div>
    </>
  );
}
