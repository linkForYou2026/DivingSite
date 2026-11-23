// サイトマップ（人が見る用。検索エンジン向けは /sitemap.xml）
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { STATIC_PAGES } from "@/lib/nav";
import { getSpots } from "@/lib/content";
import { getAllPosts } from "@/lib/blog";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta("サイトマップ", "サイト内のページの一覧です。", "/site-map/");

export default async function Page() {
  const { spots } = await getSpots();
  return (
    <>
      <PageHeader title="サイトマップ" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-8 md:grid-cols-3">
        <section>
          <h2 className="font-bold text-pro">ページ</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {STATIC_PAGES.map((p) => <li key={p.href}><Link href={p.href} className="text-ocean underline">{p.label}</Link></li>)}
          </ul>
        </section>
        <section>
          <h2 className="font-bold text-pro">スポット</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {spots.map((s) => <li key={s.slug}><Link href={`/spots/${s.slug}/`} className="text-ocean underline">{s.name}</Link></li>)}
          </ul>
        </section>
        <section>
          <h2 className="font-bold text-pro">ブログ記事</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {getAllPosts().map((p) => <li key={p.slug}><Link href={`/blog/${p.slug}/`} className="text-ocean underline">{p.title}</Link></li>)}
          </ul>
        </section>
      </div>
    </>
  );
}
