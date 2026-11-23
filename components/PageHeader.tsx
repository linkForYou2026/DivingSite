// 各ページの見出し部分（パンくずリスト＋タイトル＋説明）
import Link from "next/link";

export type Crumb = { label: string; href?: string };

export default function PageHeader({ title, lead, crumbs = [] }: { title: string; lead?: string; crumbs?: Crumb[] }) {
  const all: Crumb[] = [{ label: "トップ", href: "/" }, ...crumbs, { label: title }];
  return (
    <div className="border-b border-sky-100 bg-gradient-to-r from-sky-50 to-white">
      <div className="mx-auto max-w-6xl px-4 pb-6 pt-3">
        <nav aria-label="パンくずリスト" className="text-xs text-slate-500">
          <ol className="flex flex-wrap gap-1">
            {all.map((c, i) => (
              <li key={i} className="flex gap-1">
                {i > 0 && <span aria-hidden="true">＞</span>}
                {c.href ? <Link href={c.href} className="underline">{c.label}</Link> : <span aria-current="page">{c.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="mt-3 text-2xl font-bold text-pro md:text-3xl">{title}</h1>
        {lead && <p className="mt-1 text-slate-600">{lead}</p>}
      </div>
    </div>
  );
}
