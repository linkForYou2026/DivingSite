"use client";

// かんたん費用シミュレーター（F-12）。単価は管理画面の「エリア単価」（/api/prices）
import Link from "next/link";
import { useEffect, useState } from "react";
import { contactHref } from "@/lib/data";
import { usePrices } from "@/lib/live";
import { asOf, yen } from "@/shared/format";
import { DAY_OPTIONS, simulate } from "@/shared/price";
import { CostBar, CostList } from "./CostParts";
import LiveState from "./LiveState";

function Seg<T extends string | number>({ label, items, value, onChange }: { label: string; items: { v: T; label: string }[]; value: T; onChange: (v: T) => void }) {
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
  const { data, loading, error } = usePrices();
  const areas = data?.areaRates ?? [];
  const [areaId, setAreaId] = useState(0);
  const [d, setD] = useState(2);
  const [rental, setRental] = useState(true);
  const [people, setPeople] = useState(1);
  useEffect(() => {
    if (areas.length && !areas.some((a) => a.id === areaId)) setAreaId(areas[0].id);
  }, [areas, areaId]);

  if (loading || error || !areas.length) return <LiveState loading={loading} error={error} empty={!areas.length} emptyText="費用シミュレーターは準備中です。" />;
  const a = areas.find((x) => x.id === areaId) ?? areas[0];
  const r = simulate(a, d, rental, people);
  const dayLabel = DAY_OPTIONS.find((x) => x.d === d)?.label ?? "";
  const summary = `${a.name}・${dayLabel}・器材レンタル${rental ? "あり" : "なし"}・${people}人（目安 ${yen(r.total)}）`;

  return (
    <div className="grid gap-4 rounded-2xl border border-sky-100 bg-sky-50/60 p-4 md:grid-cols-[1fr_1.1fr] md:p-5">
      <div>
        <Seg label="行き先" items={areas.map((x) => ({ v: x.id, label: x.name }))} value={a.id} onChange={setAreaId} />
        <Seg label="日数" items={DAY_OPTIONS.map((x) => ({ v: x.d, label: x.label }))} value={d} onChange={setD} />
        <div className="mb-4">
          <p className="mb-1 text-sm font-bold text-pro">器材</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-5 w-5" checked={rental} onChange={(e) => setRental(e.target.checked)} />
            器材をレンタルする
          </label>
        </div>
        <label className="block text-sm font-bold text-pro" htmlFor="sim-people">人数</label>
        <select id="sim-people" className="mt-1 rounded-lg border-[1.5px] border-sky-100 bg-white px-2 py-1.5" value={people} onChange={(e) => setPeople(Number(e.target.value))}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}人</option>)}
        </select>
      </div>

      <div className="rounded-xl border-2 border-leisure bg-white p-4" aria-live="polite">
        <p className="text-sm text-slate-500">合計の目安（{people}人分・税込）</p>
        <p className="text-3xl font-extrabold text-pro">{yen(r.total)}</p>
        <p className="text-sm text-slate-500">だいたい {yen(r.low)} 〜 {yen(r.high)}</p>
        <div className="my-3"><CostBar cost={r.breakdown} /></div>
        <CostList cost={r.breakdown} mult={people} />
        <p className="mt-1 flex justify-between text-[13px]">
          <span>ダイビングする日数</span>
          <span>{r.diveDays}日（約{r.diveDays * 2}本）</span>
        </p>
        {a.uses_flight === 1 && (
          <p className="mt-2 rounded-lg bg-sand px-3 py-1.5 text-xs text-amber-900">
            潜った後すぐに飛行機に乗るのは危険なため、帰る日は潜らない計算にしています。
            {d === 1 && <><br />飛行機で行く場所は、日帰りより1泊以上がおすすめです。</>}
          </p>
        )}
        <p className="mt-2 text-xs text-slate-500">{asOf(a.checked_on)}の単価で計算しています。</p>
        <Link href={contactHref({ purpose: "plan", detail: `費用シミュレーターの内容で相談したい：${summary}` })} className="btn btn-warm mt-4 block text-sm">
          この内容で相談する
        </Link>
      </div>
    </div>
  );
}
