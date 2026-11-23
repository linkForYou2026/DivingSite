// 費用とモデルプラン（仕様書 F-12）
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import ModelPlans from "@/components/ModelPlans";
import CostSimulator from "@/components/CostSimulator";
import ContactBand from "@/components/ContactBand";
import PriceNotice from "@/components/PriceNotice";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta(
  "費用とモデルプラン",
  "体験ダイビング、資格取得、国内ツアー、ブランクからの再開にかかる費用の目安を内訳つきで紹介。かんたん費用シミュレーターもあります。",
  "/beginner/cost/",
);

export default function Page() {
  return (
    <>
      <PageHeader
        title="費用とモデルプラン"
        lead="「全部でいくらかかるの？」が分かるよう、内訳つきでまとめました。"
        crumbs={[{ label: "はじめての方へ", href: "/beginner/" }]}
      />
      <div className="mx-auto max-w-6xl px-4">
        <Section title="モデルプラン">
          <ModelPlans />
        </Section>
        <Section title="かんたん費用シミュレーター" lead="行き先・日数・器材レンタルを選ぶと、合計の目安が分かります。">
          <CostSimulator />
        </Section>
        <PriceNotice className="mt-6" />
        <ContactBand />
      </div>
    </>
  );
}
