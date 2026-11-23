"use client";

// 資格ステップアップガイド（仕様書 F-01／付録A）
// データは data/licenses.json。文言を直すときは JSON だけを書き換えます
import Link from "next/link";
import { Fragment, useState } from "react";
import { Agency, LicenseStep, contactHref, licenses } from "@/lib/data";

const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"];
const CAT_LABEL = { leisure: "レジャー", pro: "プロ" } as const;

function cardClass(s: LicenseStep, selected: boolean) {
  const base =
    "flex min-w-0 flex-col gap-0.5 rounded-xl border-2 p-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-md";
  const color = s.optional
    ? "border-dashed border-pro bg-white text-pro"
    : s.category === "leisure"
      ? "border-transparent bg-leisure text-leisure-ink"
      : "border-transparent bg-pro text-white";
  return `${base} ${color} ${selected ? "ring-4 ring-amber-400" : ""}`;
}

function Detail({ agency, step, onSelect }: { agency: Agency; step: LicenseStep; onSelect: (id: string) => void }) {
  const i = agency.steps.findIndex((s) => s.id === step.id);
  const next = step.next ? agency.steps.find((s) => s.id === step.next) : undefined;
  return (
    <section
      id="license-detail"
      aria-live="polite"
      className={`rounded-2xl border-2 bg-white p-4 md:p-5 ${step.category === "pro" ? "border-pro" : "border-leisure"}`}
    >
      <div className="flex flex-wrap gap-1.5">
        <span className={`rounded px-2 text-xs font-bold ${step.category === "pro" ? "bg-pro text-white" : "bg-leisure text-leisure-ink"}`}>
          {CAT_LABEL[step.category]}
        </span>
        {step.optional && <span className="rounded bg-amber-400 px-2 text-xs font-bold text-amber-950">任意のステップ</span>}
      </div>
      <h3 className="mt-1 text-lg font-bold">
        {CIRCLED[i]} {step.nameJa}（{step.abbr}）
      </h3>
      <p className="text-sm text-slate-500">{step.nameEn}</p>
      <h4 className="mt-3 text-sm font-bold text-pro">どんな資格か</h4>
      <p>{step.summary}</p>
      <h4 className="mt-3 text-sm font-bold text-pro">取得するとできること</h4>
      <ul className="list-disc pl-5">
        {step.canDo.map((x) => <li key={x}>{x}</li>)}
      </ul>
      <h4 className="mt-3 text-sm font-bold text-pro">主な取得条件</h4>
      <ul className="list-disc pl-5">
        {step.requirements.map((x) => <li key={x}>{x}</li>)}
      </ul>
      {!next && <p className="mt-3 font-bold text-pro">🎉 ここがこのルートのゴールです</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {next && (
          <button type="button" className="btn btn-primary text-sm" onClick={() => onSelect(next.id)}>
            次のステップ：{CIRCLED[i + 1]} {next.nameJa} →
          </button>
        )}
        <Link
          href={contactHref({ purpose: "講習の申し込み", detail: `${agency.name} ${step.nameJa}（${step.abbr}）の講習を希望` })}
          className="btn btn-warm text-sm"
        >
          この講習を申し込む
        </Link>
      </div>
    </section>
  );
}

export default function LicenseGuide() {
  const [agencyId, setAgencyId] = useState(licenses.defaultAgency);
  const agency = licenses.agencies.find((a) => a.id === agencyId) ?? licenses.agencies[0];
  const [selectedId, setSelectedId] = useState(agency.steps[0].id);
  const selected = agency.steps.find((s) => s.id === selectedId) ?? agency.steps[0];
  const steps = agency.steps;
  const n = steps.length;

  const changeAgency = (id: string) => {
    const a = licenses.agencies.find((x) => x.id === id);
    if (!a) return;
    setAgencyId(id);
    setSelectedId(a.steps[0].id);
  };

  // PC表示の横並びの列（カード・矢印・カード…）
  const cols = steps.map(() => "minmax(0,1fr)").join(" 28px ");
  const lastLeisure = steps.reduce((acc, s, i) => (s.category === "leisure" ? i : acc), -1);
  const firstPro = steps.findIndex((s) => s.category === "pro");
  const skipFrom = agency.skip ? steps.findIndex((s) => s.id === agency.skip!.from) : -1;
  const skipTo = agency.skip ? steps.findIndex((s) => s.id === agency.skip!.to) : -1;

  return (
    <div>
      {/* 団体タブ */}
      <div role="tablist" aria-label="指導団体" className="mb-3 flex flex-wrap gap-2">
        {licenses.agencies.map((a) => (
          <button
            key={a.id}
            role="tab"
            type="button"
            aria-selected={a.id === agency.id}
            onClick={() => changeAgency(a.id)}
            className={`rounded-full border-2 border-pro px-5 py-1 font-bold ${a.id === agency.id ? "bg-pro text-white" : "bg-white text-pro"}`}
          >
            {a.name}
          </button>
        ))}
      </div>
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded-sm bg-leisure" />レジャー（一般ダイバー）</span>
        <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded-sm bg-pro" />プロ（ガイド・指導者）</span>
        <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded-sm border-2 border-dashed border-pro" />任意のステップ</span>
      </div>

      {/* ステップアップ図 */}
      <div
        className="flex flex-col rounded-2xl border border-sky-100 bg-sky-50/60 p-3 md:grid md:gap-y-1.5 md:p-4"
        style={{ gridTemplateColumns: cols, paddingBottom: agency.skip ? 30 : undefined }}
      >
        {lastLeisure >= 0 && (
          <div className="hidden rounded-md bg-sky-100 text-center text-xs font-bold text-leisure-ink md:block" style={{ gridRow: 1, gridColumn: `1 / ${2 * lastLeisure + 2}` }}>
            レジャー
          </div>
        )}
        {firstPro >= 0 && (
          <div className="hidden rounded-md bg-blue-100 text-center text-xs font-bold text-pro md:block" style={{ gridRow: 1, gridColumn: `${2 * firstPro + 1} / -1` }}>
            プロ
          </div>
        )}
        {steps.map((s, i) => {
          const divide = i < n - 1 && s.category === "leisure" && steps[i + 1].category === "pro";
          const isSel = s.id === selected.id;
          return (
            <Fragment key={s.id}>
              <button
                type="button"
                className={cardClass(s, isSel)}
                style={{ gridRow: 2, gridColumn: 2 * i + 1 }}
                aria-expanded={isSel}
                aria-controls="license-detail"
                onClick={() => setSelectedId(s.id)}
              >
                <span className="text-sm font-extrabold">{CIRCLED[i]}</span>
                <span className="text-[15px] font-bold leading-snug md:text-[13px]">{s.short}</span>
                <span className="text-xs opacity-85">{s.abbr}</span>
                <span className="text-[13px] leading-snug md:text-xs">{s.one}</span>
                {s.optional && agency.skip && <span className="text-xs md:hidden">※ このステップを飛ばして次へ進むことも可</span>}
                <span className="mt-auto flex flex-wrap gap-1 pt-1">
                  <span className={`rounded px-1.5 text-[11px] font-bold ${s.category === "pro" && !s.optional ? "bg-white/20 text-white" : "bg-white/80 text-pro"}`}>
                    {CAT_LABEL[s.category]}
                  </span>
                  {s.optional && <span className="rounded bg-amber-400 px-1.5 text-[11px] font-bold text-amber-950">任意</span>}
                </span>
              </button>
              {/* スマホ：選んだカードのすぐ下に詳細 */}
              {isSel && (
                <div className="my-2 md:hidden">
                  <Detail agency={agency} step={s} onSelect={setSelectedId} />
                </div>
              )}
              {i < n - 1 && (
                <div
                  aria-hidden="true"
                  className={`flex items-center justify-center py-1 font-bold text-ocean md:py-0 ${divide ? "md:ml-3 md:border-l-2 md:border-dotted md:border-slate-400" : ""}`}
                  style={{ gridRow: 2, gridColumn: 2 * i + 2 }}
                >
                  {divide ? (
                    <span className="flex w-full flex-col items-center md:hidden">
                      <span className="w-full border-t-2 border-dotted border-pro pt-0.5 text-center text-xs text-pro">ここからプロ</span>↓
                    </span>
                  ) : (
                    <>
                      <span className="hidden md:inline">→</span>
                      <span className="md:hidden">↓</span>
                    </>
                  )}
                </div>
              )}
            </Fragment>
          );
        })}
        {agency.skip && skipFrom >= 0 && skipTo > skipFrom && (
          <div
            className="relative mx-6 hidden h-5 rounded-b-xl border-2 border-t-0 border-dashed border-pro md:block"
            style={{ gridRow: 3, gridColumn: `${2 * skipFrom + 1} / ${2 * skipTo + 2}` }}
          >
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-sky-50 px-1.5 text-xs text-pro">
              {agency.skip.label}
            </span>
          </div>
        )}
      </div>

      {/* PC：図の下に詳細 */}
      <div className="mt-4 hidden md:block">
        <Detail agency={agency} step={selected} onSelect={setSelectedId} />
      </div>

      {agency.notes.length > 0 && (
        <div className="mt-3 rounded-xl bg-sand px-4 py-3 text-sm">
          <strong>{agency.name}の特徴</strong>
          <ul className="list-disc pl-5">
            {agency.notes.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
