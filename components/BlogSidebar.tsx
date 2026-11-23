// ブログのサイドバー（カテゴリ一覧・人気記事）
import Link from "next/link";
import { blogCategories } from "@/lib/data";
import { getAllPosts, getPopularPosts } from "@/lib/blog";

export default function BlogSidebar() {
  const posts = getAllPosts();
  const popular = getPopularPosts().slice(0, 5);
  return (
    <aside className="grid gap-4 self-start">
      <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
        <h2 className="font-bold text-ocean-deep">カテゴリ</h2>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {blogCategories.items.map((c) => {
            const n = posts.filter((p) => p.category === c.id).length;
            return (
              <li key={c.id}>
                <Link href={`/blog/category/${c.id}/`} className="inline-block rounded bg-white px-2 py-0.5 text-sm text-leisure-ink ring-1 ring-sky-100 hover:text-pro">
                  {c.label}（{n}）
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      {popular.length > 0 && (
        <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
          <h2 className="font-bold text-ocean-deep">人気記事</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            {popular.map((p) => <li key={p.slug}><Link href={`/blog/${p.slug}/`} className="text-ocean underline">{p.title}</Link></li>)}
          </ol>
        </div>
      )}
    </aside>
  );
}
