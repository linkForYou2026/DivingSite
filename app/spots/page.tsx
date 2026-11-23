// 海・スポットを探す（仕様書 6.5／F-04）
import PageHeader from "@/components/PageHeader";
import SpotSearch from "@/components/SpotSearch";
import ContactBand from "@/components/ContactBand";
import PriceNotice from "@/components/PriceNotice";
import { getSpots } from "@/lib/content";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta(
  "海・スポットを探す",
  "サンゴ礁、沈船、地形・洞窟、大物、マクロ、透明度。目的・エリア・レベル・費用・季節から、行ってみたいダイビングスポットを探せます。",
  "/spots/",
);

export default async function Page() {
  const { spots, purposes } = await getSpots();
  return (
    <>
      <PageHeader title="海・スポットを探す" lead="見たいもの・行きたいエリア・費用から、ぴったりの海を探せます。" />
      <div className="mx-auto max-w-6xl px-4 pt-8">
        {spots.length ? (
          <>
            <SpotSearch spots={spots} purposes={purposes.map((p) => p.name)} />
            <p className="mt-6 text-xs text-slate-600">費用は1人あたりの目安（ダイビング代・宿泊・交通費などを含む概算）で、時期や出発地により変わります。</p>
            <PriceNotice className="mt-2" />
          </>
        ) : (
          <p className="rounded-xl bg-sky-50 p-6 text-center text-slate-600">スポット情報は準備中です。</p>
        )}
        <ContactBand title="行き先に迷ったら" text="見たい生き物や予算を教えていただければ、おすすめの海をご提案します。" button="相談する" purpose="other" />
      </div>
    </>
  );
}
