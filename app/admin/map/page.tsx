"use client";

// BO-03 サイトの表示マップ（バックオフィス仕様書 9.3②・10章）
import Link from "next/link";
import { useAdmin } from "@/components/admin/AdminContext";
import { PageTitle } from "@/components/admin/ui";
import { getTable } from "@/shared/admin-schema";
import { REFLECT_TEXT, SITE_MAP } from "@/shared/site-map";

export default function Page() {
  const { can } = useAdmin();
  const pages = Array.from(new Set(SITE_MAP.map((p) => p.page)));
  return (
    <>
      <PageTitle>サイトのページから探す</PageTitle>
      <p className="mb-4 text-sm text-slate-600">サイトのページごとに、各部分と、それを編集する管理画面の一覧です。</p>
      <nav aria-label="ページ" className="mb-4 flex flex-wrap gap-2 text-sm">
        {pages.map((pg) => (
          <a key={pg} href={`#p-${pg}`} className="rounded-full border bg-white px-3 py-1 hover:bg-sky-50">{pg}</a>
        ))}
      </nav>
      <div className="space-y-6">
        {pages.map((pg) => {
          const rows = SITE_MAP.filter((p) => p.page === pg);
          return (
            <section key={pg} id={`p-${pg}`} className="scroll-mt-16">
              <h2 className="mb-2 flex items-center gap-3 font-bold text-ocean-deep">
                {pg}
                <a href={rows[0].path} target="_blank" rel="noopener noreferrer" className="text-xs font-normal text-ocean underline">サイトで見る ↗</a>
              </h2>
              <div className="overflow-x-auto rounded-xl border bg-white">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-slate-100 text-left">
                    <tr><th className="px-3 py-2">ページの部分</th><th className="px-3 py-2">編集する画面</th><th className="px-3 py-2">表示される条件</th><th className="px-3 py-2">反映</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.map((r) => {
                      const t = r.table ? getTable(r.table) : null;
                      const isSettings = !r.table && r.editLabel.startsWith("サイト設定");
                      const href = t ? `/admin/t/?table=${t.name}` : r.table === "inquiries" ? "/admin/inquiries/" : isSettings ? "/admin/settings/" : null;
                      const allowed = t ? can(t.cap) : r.table === "inquiries" ? can("inquiries") : isSettings ? can("settings") : false;
                      return (
                        <tr key={r.part}>
                          <td className="px-3 py-2">{r.part}</td>
                          <td className="px-3 py-2">{href && allowed ? <Link href={href} className="text-ocean underline">{r.editLabel}</Link> : r.editLabel}</td>
                          <td className="px-3 py-2 text-slate-600">{r.condition}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs">{r.reflect === "instant" ? "約1分" : r.reflect === "publish" ? "サイトに反映" : REFLECT_TEXT[r.reflect]}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
