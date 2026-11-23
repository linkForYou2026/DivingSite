// はじめての方へ（仕様書 6.2）
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import ContactBand from "@/components/ContactBand";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta(
  "はじめての方へ",
  "ダイビングを始めるまでの流れ（体験→資格→ファンダイブ）と、費用・持ち物・よくある質問をまとめました。",
  "/beginner/",
);

const STEPS = [
  { n: "STEP 1", t: "体験ダイビング", d: "資格がなくても、インストラクターと一緒に海の中を体験できます。まずは「楽しい」を確かめてみましょう。", c: "from-[#4fc3f7] to-[#0277bd]" },
  { n: "STEP 2", t: "資格（Cカード）を取る", d: "オープン・ウォーター・ダイバー講習で、バディと潜るための知識と技術を身につけます。", c: "from-[#29b6f6] to-[#01579b]" },
  { n: "STEP 3", t: "ファンダイブへ", d: "資格を取ったら、行ってみたい海へ。ガイドと一緒に潜るファンダイブを楽しめます。", c: "from-[#0288d1] to-[#062a4f]" },
];

export default function Page() {
  return (
    <>
      <PageHeader title="はじめての方へ" lead="ダイビングを始めるまでの流れと、かかる費用・持ち物をまとめました。" />
      <div className="mx-auto max-w-6xl px-4">
        <Section title="はじめるまでの流れ">
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="overflow-hidden rounded-2xl border border-sky-100 bg-white">
                <div className={`bg-gradient-to-br ${s.c} px-4 py-6 text-sm font-bold text-white`}>{s.n}</div>
                <div className="p-4">
                  <h3 className="font-bold">{s.t}</h3>
                  <p className="mt-1 text-sm text-slate-600">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Link href="/beginner/cost/" className="btn btn-ghost">費用とモデルプランを見る</Link>
            <Link href="/license/" className="btn btn-ghost">資格ガイドを見る</Link>
            <Link href="/beginner/faq/" className="btn btn-ghost">よくある質問を見る</Link>
          </div>
        </Section>

        <Section title="持ち物・レンタルでよいもの">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-5">
              <h3 className="font-bold text-ocean-deep">自分で用意するもの</h3>
              <ul className="mt-2 list-disc pl-5">
                <li>水着・タオル</li><li>日焼け止め・着替え</li><li>Cカード（資格を持っている方）</li><li>酔い止め（船に弱い方）</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-5">
              <h3 className="font-bold text-ocean-deep">レンタルでOKなもの</h3>
              <ul className="mt-2 list-disc pl-5">
                <li>ウェットスーツ・マスク・フィン</li><li>BCD・レギュレーター・タンク</li><li>ダイブコンピューター</li>
              </ul>
              <p className="mt-2 text-xs text-slate-500">※ 慣れてきたら、マスクなど顔に合うものから少しずつ揃えるのがおすすめです。</p>
            </div>
          </div>
        </Section>

        <Section title="しばらく潜っていない方へ">
          <p className="text-sm">ブランクがあっても大丈夫です。期間に合わせた再開方法を紹介しています。</p>
          <Link href="/beginner/blank/" className="btn btn-primary mt-3 text-sm">ブランクダイバーの方へ</Link>
        </Section>

        <ContactBand title="不安なことは、なんでも聞いてください" text="泳ぎに自信がない、年齢が心配…などもお気軽に。" button="相談する" />
      </div>
    </>
  );
}
