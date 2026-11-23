// よくある質問（仕様書 F-13）
import PageHeader from "@/components/PageHeader";
import FaqList from "@/components/FaqList";
import ContactBand from "@/components/ContactBand";
import { pageMeta } from "@/lib/meta";
import { getFaqs } from "@/lib/content";

export const metadata = pageMeta(
  "よくある質問",
  "泳げなくても大丈夫？何歳から？耳抜きは？など、ダイビングを始める前によくいただく質問にお答えします。",
  "/beginner/faq/",
);

export default async function Page() {
  const { categories, items } = await getFaqs();
  return (
    <>
      <PageHeader title="よくある質問" lead="ダイビングについて、よくいただく質問をまとめました。" crumbs={[{ label: "はじめての方へ", href: "/beginner/" }]} />
      <div className="mx-auto max-w-4xl px-4 pt-8">
        <FaqList categories={categories} items={items} />
        <ContactBand title="解決しないときは" text="お気軽にお問い合わせください。" button="お問い合わせ" />
      </div>
    </>
  );
}
