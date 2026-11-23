// 運営者情報
import PageHeader from "@/components/PageHeader";
import { site } from "@/lib/data";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta("運営者情報", `${site.name}の運営者情報です。`, "/about/");

export default function Page() {
  const rows: [string, string][] = [
    ["サイト名", site.name],
    ["URL", site.url],
    ["運営者", site.operator.name || "準備中"],
    ["お問い合わせ", site.contact.email || "お問い合わせフォームから"],
  ];
  return (
    <>
      <PageHeader title="運営者情報" />
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <dl className="divide-y divide-sky-100 rounded-2xl border border-sky-100">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[8rem_1fr] gap-2 px-4 py-3 text-sm">
              <dt className="font-bold text-pro">{k}</dt>
              <dd className="break-all">{v}</dd>
            </div>
          ))}
        </dl>
        {site.operator.note && <p className="mt-4 text-sm text-slate-600">{site.operator.note}</p>}
      </div>
    </>
  );
}
