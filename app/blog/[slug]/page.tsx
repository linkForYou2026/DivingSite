// ブログ記事
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import BlogSidebar from "@/components/BlogSidebar";
import { formatDate, getAllPosts, getPost } from "@/lib/blog";
import { pageMeta } from "@/lib/meta";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) return {};
  return pageMeta(p.title, p.description, `/blog/${p.slug}/`);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) notFound();
  return (
    <>
      <PageHeader
        title={p.title}
        crumbs={[{ label: "ブログ", href: "/blog/" }, { label: p.categoryLabel, href: `/blog/category/${p.category}/` }]}
      />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-6 md:grid-cols-[2fr_1fr]">
        <article>
          <p className="text-sm text-slate-500">
            <time dateTime={p.date}>{formatDate(p.date)}</time>・{p.categoryLabel}
          </p>
          <div className="prose-blog mt-4" dangerouslySetInnerHTML={{ __html: p.html }} />
          {/* 記事の最後の関連ページボタン（仕様書 F-11） */}
          <div className="mt-10 grid gap-2 rounded-2xl bg-sky-50 p-4 sm:grid-cols-3">
            <Link href="/spots/" className="btn btn-ghost text-sm">海・スポットを探す</Link>
            <Link href="/events/" className="btn btn-ghost text-sm">イベントを見る</Link>
            <Link href="/contact/" className="btn btn-warm text-sm">お問い合わせ</Link>
          </div>
        </article>
        <BlogSidebar />
      </div>
    </>
  );
}
