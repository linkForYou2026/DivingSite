// 運営者情報
import PageHeader from "@/components/PageHeader";
import { site } from "@/lib/data";
import { getSiteText } from "@/lib/content";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta("運営者情報", "このサイトの運営者情報です。", "/about/");

export default async function Page() {
  const { name } = await getSiteText();
  const rows: [string, string][] = [
    ["サイト名", name],
    ["URL", site.url],
    ["お問い合わせ", "お問い合わせフォームから"],
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
      </div>
    </>
  );
}
