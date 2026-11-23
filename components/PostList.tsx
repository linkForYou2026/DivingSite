// ブログ記事のカード一覧
import Link from "next/link";
import { Post, formatDate } from "@/lib/blog";

export default function PostList({ posts }: { posts: Post[] }) {
  if (!posts.length) return <p className="rounded-xl bg-sky-50 p-6 text-center text-slate-600">記事は準備中です。</p>;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {posts.map((p) => (
        <Link key={p.slug} href={`/blog/${p.slug}/`} className="flex flex-col overflow-hidden rounded-2xl border border-sky-100 bg-white hover:shadow-lg">
          <div className="bg-gradient-to-br from-[#4fc3f7] to-ocean-deep px-3 py-6">
            <span className="rounded bg-black/30 px-1.5 text-xs text-white">{p.categoryLabel}</span>
          </div>
          <div className="flex flex-1 flex-col gap-1 p-4">
            <h2 className="font-bold">{p.title}</h2>
            <p className="text-sm text-slate-600">{p.description}</p>
            <time className="mt-auto text-xs text-slate-500" dateTime={p.date}>{formatDate(p.date)}</time>
          </div>
        </Link>
      ))}
    </div>
  );
}
