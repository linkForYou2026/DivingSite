// 資格ガイド（仕様書 6.4／付録A）
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import LicenseGuide from "@/components/LicenseGuide";
import ContactBand from "@/components/ContactBand";
import { getLicenses } from "@/lib/content";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta(
  "資格ガイド（ダイビング資格ステップアップ）",
  "ダイビングの資格（Cカード）の種類と取る順番、それぞれの資格でできること、取得条件、PADI・SSI・NAUIなど指導団体の違いを図で解説します。",
  "/license/",
);

const th = "whitespace-nowrap bg-pro px-3 py-2 text-left text-white";
const td = "border-b border-sky-100 px-3 py-2 align-top";
const stickyTd = `${td} sticky left-0 z-[1] bg-sky-50 font-bold`;

export default async function Page() {
  const licenses = await getLicenses();
  return (
    <>
      <PageHeader title="資格ガイド" lead="ダイビングの資格（Cカード）の種類と、取る順番、できることを解説します。カードを押すと詳しい説明が出ます。" />
      <div className="mx-auto max-w-6xl px-4">
        <Section title="資格ステップアップ">
          <LicenseGuide licenses={licenses} />
        </Section>

        <Section title="主な指導団体の特徴" lead="ダイビングの資格は国家資格ではなく、民間の「指導団体」が独自の基準で講習を行い発行しています。国内のダイビングショップの多くは、いずれかの指導団体に加盟しています。">
          <div className="overflow-x-auto rounded-xl border border-sky-100">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr><th className={`${th} sticky left-0 z-[2] bg-[#0a3a85]`}>団体</th><th className={th}>正式名称</th><th className={th}>発祥</th><th className={th}>特徴</th></tr></thead>
              <tbody>
                {licenses.profiles.map((a) => (
                  <tr key={a.name}>
                    <td className={stickyTd}>{a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer" className="underline">{a.name}</a> : a.name}</td>
                    <td className={td}>{a.fullName}</td>
                    <td className={`${td} whitespace-nowrap`}>{a.origin}</td>
                    <td className={td}>{a.feature}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="資格名の対応表（目安）">
          <div className="overflow-x-auto rounded-xl border border-sky-100">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr>
                  <th className={`${th} sticky left-0 z-[2] bg-[#0a3a85]`}>レベル</th>
                  {licenses.equivalence.headers.map((h) => <th key={h} className={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {licenses.equivalence.rows.map((r) => (
                  <tr key={r.level}>
                    <td className={stickyTd}>{r.level}</td>
                    {r.cells.map((c, i) => <td key={i} className={td}>{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            ※ 団体間の対応は目安です。正式な互換性は各指導団体・ダイビングショップにご確認ください。<br />
            ※ NAUI では、ダイブマスターがアシスタント・インストラクターより上位に位置付けられています。どちらからでもインストラクター養成コース（ITC）に進めます。
          </p>
        </Section>

        {licenses.shops.length > 0 && (
          <Section title="国内の加盟ショップ数（参考）">
            <div className="inline-block max-w-full overflow-x-auto rounded-xl border border-sky-100">
              <table className="text-sm">
                <thead><tr><th className={th}>団体</th><th className={th}>ショップ数</th></tr></thead>
                <tbody>
                  {licenses.shops.map((x) => (
                    <tr key={x.name}><td className={td}>{x.name}</td><td className={`${td} text-right`}>{x.count}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            {licenses.shops[0]?.source && <p className="mt-2 text-xs text-slate-500">出典：{licenses.shops[0].source}。1つのショップが複数団体に加盟している場合があります。</p>}
          </Section>
        )}

        <Section title="すべての資格の説明">
          {licenses.agencies.map((a) => (
            <details key={a.id} className="mb-2 rounded-xl border border-sky-100 bg-white">
              <summary className="cursor-pointer px-4 py-3 font-bold text-pro">{a.name}の資格（{a.steps.length}つ）</summary>
              <div className="grid gap-4 border-t border-sky-100 p-4 md:grid-cols-2">
                {a.steps.map((s) => (
                  <section key={s.id}>
                    <h3 className="font-bold">{s.nameJa}（{s.abbr}）<span className="ml-2 text-xs font-normal text-slate-500">{s.category === "pro" ? "プロ" : "レジャー"}</span></h3>
                    <p className="text-sm">{s.summary}</p>
                    {s.requirements.length > 0 && <p className="mt-1 text-xs text-slate-600">取得条件：{s.requirements.join("／")}</p>}
                  </section>
                ))}
              </div>
            </details>
          ))}
        </Section>

        <div className="mt-10 rounded-xl bg-sky-50 px-4 py-4 text-xs text-slate-600">
          <p className="font-bold text-slate-800">ご注意</p>
          <p>取得条件（年齢・本数など）は団体の基準改定により変わることがあります。受講前に各指導団体またはダイビングショップでご確認ください。</p>
          <p className="mt-1">最終確認日：{licenses.lastChecked}</p>
          <details className="mt-2">
            <summary className="cursor-pointer font-bold text-ocean">出典</summary>
            <ul className="mt-1 list-disc break-all pl-5">
              {licenses.sources.map(([t, u]) => <li key={u}><a href={u} target="_blank" rel="noopener noreferrer" className="text-ocean underline">{t}</a></li>)}
            </ul>
          </details>
        </div>

        <ContactBand title="講習のお申し込み・ご相談" text="どの資格から始めればいいか迷ったら、お気軽にご相談ください。" button="講習を申し込む" purpose="講習の申し込み" />
      </div>
    </>
  );
}
