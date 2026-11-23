"use client";

// かんたん費用シミュレーター（仕様書 F-12）。単価は data/cost.json
import Link from "next/link";
import { useState } from "react";
import { CostBreakdown, contactHref, costData, yen } from "@/lib/data";
import { CostBar, CostList, costSum } from "./CostParts";

const r1000 = (n: number) => Math.round(n / 1000) * 1000;

function Seg<T extends string | number>({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: { v: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="mb-4">
      <legend className="mb-1 text-sm font-bold text-pro">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <button
            key={String(it.v)}
            type="button"
            aria-pressed={value === it.v}
            onClick={() => onChange(it.v)}
            className={`rounded-lg border-[1.5px] border-ocean px-3 py-1 text-sm ${value === it.v ? "bg-ocean text-white" : "bg-white text-ocean"}`}
          >
            {it.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function CostSimulator() {
  const { areas, days, range } = costData;
  const [areaId, setAreaId] = useState(areas[0].id);
  const [d, setD] = useState(2);
  const [rental, setRental] = useState(true);
  const [people, setPeople] = useState(1);

  const a = areas.find((x) => x.id === areaId) ?? areas[0];
  const nights = d - 1;
  // 飛行機で行く場所は、帰る日（飛行機に乗る日）は潜らない計算にする
  const diveDays = a.flight ? Math.max(d - 1, 1) : d;
  const c: CostBreakdown = {
    tour: a.divePerDay * diveDays,
    rental: rental ? a.rentalPerDay * diveDays : 0,
    travel: a.travel,
    stay: a.stayPerNight * nights,
    other: a.otherPerDay * d,
  };
  const total = costSum(c) * people;
  const dayLabel = days.find((x) => x.d === d)?.label ?? "";
  const summary = `${a.label}・${dayLabel}・器材レンタル${rental ? "あり" : "なし"}・${people}人（目安 ${yen(r1000(total))}）`;

  return (
    <div className="grid gap-4 rounded-2xl border border-sky-100 bg-sky-50/60 p-4 md:grid-cols-[1fr_1.1fr] md:p-5">
      <div>
        <Seg label="行き先" items={areas.map((x) => ({ v: x.id, label: x.label }))} value={areaId} onChange={setAreaId} />
        <Seg label="日数" items={days.map((x) => ({ v: x.d, label: x.label }))} value={d} onChange={setD} />
        <div className="mb-4">
          <p className="mb-1 text-sm font-bold text-pro">器材</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-5 w-5" checked={rental} onChange={(e) => setRental(e.target.checked)} />
            器材をレンタルする
          </label>
        </div>
        <label className="block text-sm font-bold text-pro" htmlFor="sim-people">人数</label>
        <select
          id="sim-people"
          className="mt-1 rounded-lg border-[1.5px] border-sky-100 bg-white px-2 py-1.5"
          value={people}
          onChange={(e) => setPeople(Number(e.target.value))}
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}人</option>)}
        </select>
      </div>

      <div className="rounded-xl border-2 border-leisure bg-white p-4" aria-live="polite">
        <p className="text-sm text-slate-500">合計の目安（{people}人分）</p>
        <p className="text-3xl font-extrabold text-pro">{yen(r1000(total))}</p>
        <p className="text-sm text-slate-500">
          だいたい {yen(r1000(total * (1 - range)))} 〜 {yen(r1000(total * (1 + range)))}
        </p>
        <div className="my-3"><CostBar cost={c} /></div>
        <CostList cost={c} mult={people} />
        <p className="mt-1 flex justify-between text-[13px]">
          <span>ダイビングする日数</span>
          <span>{diveDays}日（約{diveDays * 2}本）</span>
        </p>
        {a.flight && (
          <p className="mt-2 rounded-lg bg-sand px-3 py-1.5 text-xs text-amber-900">
            潜った後すぐに飛行機に乗るのは危険なため、帰る日は潜らない計算にしています。
            {d === 1 && <><br />飛行機で行く場所は、日帰りより1泊以上がおすすめです。</>}
          </p>
        )}
        <Link href={contactHref({ purpose: "その他", detail: `費用シミュレーターの内容で相談したい：${summary}` })} className="btn btn-warm mt-4 block text-sm">
          この内容で相談する
        </Link>
      </div>
    </div>
  );
}
