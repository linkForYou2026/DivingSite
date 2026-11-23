// ブログのカテゴリ別一覧
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import BlogSidebar from "@/components/BlogSidebar";
import PostList from "@/components/PostList";
import { blogCategories } from "@/lib/data";
import { getAllPosts } from "@/lib/blog";
import { pageMeta } from "@/lib/meta";

export function generateStaticParams() {
  return blogCategories.items.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = blogCategories.items.find((x) => x.id === id);
  if (!c) return {};
  return pageMeta(`${c.label}の記事`, `ブログ「${c.label}」カテゴリの記事一覧です。`, `/blog/category/${c.id}/`);
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = blogCategories.items.find((x) => x.id === id);
  if (!c) notFound();
  return (
    <>
      <PageHeader title={`${c.label}の記事`} crumbs={[{ label: "ブログ", href: "/blog/" }]} />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 pt-8 md:grid-cols-[2fr_1fr]">
        <PostList posts={getAllPosts().filter((p) => p.category === c.id)} />
        <BlogSidebar />
      </div>
    </>
  );
}
