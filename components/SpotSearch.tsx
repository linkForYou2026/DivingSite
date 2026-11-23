"use client";

// 目的別スポット検索（仕様書 F-04）。データは data/spots.json
import { useEffect, useMemo, useState } from "react";
import { spotsData } from "@/lib/data";
import SpotCard from "./SpotCard";

type State = { purposes: string[]; levels: string[]; region: string; area: string; budget: number; month: number };
const EMPTY: State = { purposes: [], levels: [], region: "", area: "", budget: 0, month: 0 };

function Chip({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`rounded-full border-[1.5px] border-ocean px-3 py-0.5 text-sm ${on ? "bg-ocean text-white" : "bg-white text-ocean"}`}
    >
      {label}
    </button>
  );
}

const selectCls = "max-w-full rounded-lg border-[1.5px] border-sky-100 bg-white px-2 py-1.5 text-sm";

export default function SpotSearch() {
  const [st, setSt] = useState<State>(EMPTY);
  const { spots, purposes, levels, budgets } = spotsData;

  // URL の ?purpose=沈船 を読み取って最初から選んでおく（トップの「目的から探す」から来たとき）
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("purpose");
    if (p && purposes.includes(p)) setSt((s) => ({ ...s, purposes: [p] }));
  }, [purposes]);

  const rank = (id: string) => levels.find((l) => l.id === id)?.rank ?? 0;
  const areas = useMemo(
    () => Array.from(new Set(spots.filter((s) => !st.region || s.region === st.region).map((s) => s.area))),
    [spots, st.region],
  );
  const toggle = (key: "purposes" | "levels", v: string) =>
    setSt((s) => ({ ...s, [key]: s[key].includes(v) ? s[key].filter((x) => x !== v) : [...s[key], v] }));

  const list = spots
    .filter((s) => {
      if (st.purposes.length && !st.purposes.some((p) => s.purposes.includes(p))) return false;
      if (st.region && s.region !== st.region) return false;
      if (st.area && s.area !== st.area) return false;
      // レベル：選んだレベルのうち最も高いもので潜れるスポット
      if (st.levels.length && rank(s.level) > Math.max(...st.levels.map(rank))) return false;
      if (st.budget && s.cost > st.budget) return false;
      if (st.month && !s.months.includes(st.month)) return false;
      return true;
    })
    .sort((a, b) => a.cost - b.cost);

  return (
    <div>
      <div role="search" className="grid gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
        <div className="grid gap-1 md:grid-cols-[110px_1fr] md:items-center md:gap-3">
          <span className="text-sm font-bold text-pro">目的</span>
          <div className="flex flex-wrap gap-1.5">
            {purposes.map((p) => <Chip key={p} label={p} on={st.purposes.includes(p)} onClick={() => toggle("purposes", p)} />)}
          </div>
        </div>
        <div className="grid gap-1 md:grid-cols-[110px_1fr] md:items-center md:gap-3">
          <span className="text-sm font-bold text-pro">エリア</span>
          <div className="flex flex-wrap gap-2">
            <select aria-label="国内・海外" className={selectCls} value={st.region} onChange={(e) => setSt({ ...st, region: e.target.value, area: "" })}>
              <option value="">国内・海外すべて</option>
              <option value="国内">国内</option>
              <option value="海外">海外</option>
            </select>
            <select aria-label="地域" className={selectCls} value={st.area} onChange={(e) => setSt({ ...st, area: e.target.value })}>
              <option value="">地域：すべて</option>
              {areas.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <div className="grid gap-1 md:grid-cols-[110px_1fr] md:items-center md:gap-3">
          <span className="text-sm font-bold text-pro">レベル</span>
          <div className="flex flex-wrap gap-1.5">
            {levels.map((l) => <Chip key={l.id} label={l.label} on={st.levels.includes(l.id)} onClick={() => toggle("levels", l.id)} />)}
          </div>
        </div>
        <div className="grid gap-1 md:grid-cols-[110px_1fr] md:items-center md:gap-3">
          <span className="text-sm font-bold text-pro">費用・季節</span>
          <div className="flex flex-wrap gap-2">
            <select aria-label="費用の上限" className={selectCls} value={st.budget} onChange={(e) => setSt({ ...st, budget: Number(e.target.value) })}>
              {budgets.map((b) => <option key={b.max} value={b.max}>{b.label}</option>)}
            </select>
            <select aria-label="行きたい月" className={selectCls} value={st.month} onChange={(e) => setSt({ ...st, month: Number(e.target.value) })}>
              <option value={0}>行きたい月：指定なし</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}月に行きたい</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p aria-live="polite">該当 <strong className="text-lg text-pro">{list.length}</strong> 件</p>
          <button type="button" className="text-ocean underline" onClick={() => setSt(EMPTY)}>条件をリセット</button>
        </div>
      </div>

      {list.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => <SpotCard key={s.id} spot={s} />)}
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-sky-50 p-6 text-center text-slate-600">条件に合うスポットが見つかりませんでした。条件を減らしてみてください。</p>
      )}
    </div>
  );
}
