// 広告・アフィリエイトについて（仕様書 11章：ステルスマーケティング規制への対応）
import PageHeader from "@/components/PageHeader";
import { site } from "@/lib/data";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta("広告・アフィリエイトについて", `${site.name}における広告・アフィリエイトの表記について。`, "/ads/");

export default function Page() {
  return (
    <>
      <PageHeader title="広告・アフィリエイトについて" />
      <div className="mx-auto max-w-3xl px-4 pt-8 text-[15px]">
        <p>当サイトでは、撮影機材や器材、旅行などの紹介に、アフィリエイトプログラム（商品の紹介によって当サイトが報酬を受け取る仕組み）を利用することがあります。</p>
        <p className="mt-3">広告やアフィリエイトリンク、企業とのタイアップを含むページには、ページ内に「広告」「PR」などの表記を行います。</p>
        <p className="mt-3">紹介する商品やサービスは、運営者が実際に使ったり、内容を確認したりしたうえで選んでいます。</p>
      </div>
    </>
  );
}
