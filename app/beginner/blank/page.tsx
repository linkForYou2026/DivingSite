// ブランクダイバーの方へ（仕様書 6.3）
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import ContactBand from "@/components/ContactBand";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta(
  "ブランクダイバーの方へ",
  "久しぶりにダイビングを再開したい方へ。ブランク期間ごとのおすすめと、リフレッシュ講習の内容を紹介します。",
  "/beginner/blank/",
);

const PERIODS = [
  { tag: "1年未満", t: "そのままファンダイブへ", d: "潜る前に、器材の使い方やスキルを軽くおさらい。不安があれば1本目は浅いポイントから。" },
  { tag: "1〜3年", t: "リフレッシュ講習がおすすめ", d: "浅い場所でスキルを確認してから海へ。感覚を取り戻してからファンダイブを楽しめます。" },
  { tag: "3年以上", t: "リフレッシュ講習＋ゆっくり再開", d: "知識の復習からしっかり。プールや穏やかな海で練習してから、少しずつステップアップ。" },
];

export default function Page() {
  return (
    <>
      <PageHeader
        title="ブランクダイバーの方へ"
        lead="久しぶりでも大丈夫。ブランクの長さに合わせて、無理なく再開できます。"
        crumbs={[{ label: "はじめての方へ", href: "/beginner/" }]}
      />
      <div className="mx-auto max-w-6xl px-4">
        <Section title="ブランク期間ごとのおすすめ">
          <div className="grid gap-4 md:grid-cols-3">
            {PERIODS.map((p) => (
              <article key={p.tag} className="rounded-2xl border border-sky-100 bg-white p-4">
                <span className="rounded bg-sky-100 px-2 text-xs font-bold text-leisure-ink">{p.tag}</span>
                <h3 className="mt-1 font-bold">{p.t}</h3>
                <p className="mt-1 text-sm text-slate-600">{p.d}</p>
              </article>
            ))}
          </div>
        </Section>
        <Section title="リフレッシュ講習">
          <div className="grid gap-6 rounded-2xl border border-sky-100 bg-sky-50/60 p-5 md:grid-cols-2">
            <div>
              <h3 className="font-bold text-ocean-deep">内容（例）</h3>
              <ul className="mt-2 list-disc pl-5 text-[15px]">
                <li>器材のセッティングとチェック</li>
                <li>マスククリア・レギュレーターリカバリーなどの基本スキル</li>
                <li>中性浮力の練習</li>
                <li>浅いポイントでの1〜2ダイブ</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-ocean-deep">費用の目安</h3>
              <p className="mt-2 text-sm">「費用とモデルプラン」の<Link href="/beginner/cost/" className="text-ocean underline">ブランクからの再開</Link>をご覧ください。料金は準備中です。</p>
            </div>
          </div>
        </Section>
        <ContactBand
          title="再開の相談をする"
          text="最後に潜った時期と本数を教えていただければ、最適なプランをご提案します。"
          button="ブランク相談をする"
          purpose="ブランク相談"
        />
      </div>
    </>
  );
}
