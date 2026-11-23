// ブログ一覧（仕様書 F-11）
import PageHeader from "@/components/PageHeader";
import BlogSidebar from "@/components/BlogSidebar";
import PostList from "@/components/PostList";
import { getAllPosts } from "@/lib/blog";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta("ブログ", "初心者向けの話、スポット紹介、生き物、撮影テクニック、機材、仕事・キャリア、イベントレポートなどをお届けします。", "/blog/");

export default function Page() {
  return (
    <>
      <PageHeader title="ブログ" lead="海・生き物・撮影・仕事の話題をお届けします。" />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 pt-8 md:grid-cols-[2fr_1fr]">
        <PostList posts={getAllPosts()} />
        <BlogSidebar />
      </div>
    </>
  );
}
