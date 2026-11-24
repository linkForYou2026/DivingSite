"use client";

// 入力中の内容を、サイトと同じ部品で表示するプレビュー（バックオフィス仕様書 9.4 U-4）
import { useState } from "react";
import { ServiceCard } from "@/components/ServiceCards";
import { PlanCard } from "@/components/ModelPlans";
import { EventCard } from "@/components/EventList";
import SpotCard from "@/components/SpotCard";
import type { ServiceItem, ModelPlan, EventItem } from "@/lib/live";
import type { SpotView } from "@/lib/content";
import { DIVE_LEVEL, REGION } from "@/shared/enums";
import type { Opts } from "./fields";

type Row = Record<string, unknown>;
const num = (v: unknown) => (v === "" || v === null || v === undefined || isNaN(Number(v)) ? null : Number(v));
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export const PREVIEW_TABLES = ["services", "model_plans", "events", "notices", "spots", "faqs", "testimonials"];

function Body({ table, v, opts, m2m, planAmounts }: { table: string; v: Row; opts: Opts; m2m: number[]; planAmounts: Record<string, string> }) {
  switch (table) {
    case "services": {
      const s: ServiceItem = {
        id: 0, code: str(v.code), kind: str(v.kind), name: str(v.name) || "（メニュー名）", description: str(v.description) || null,
        license_id: null, license_code: null, agency_code: null, price_yen: num(v.price_yen), price_unit: str(v.price_unit),
        price_from: Number(v.price_from) || 0, includes: str(v.includes) || null, excludes: str(v.excludes) || null,
        duration: str(v.duration) || null, is_estimate: Number(v.is_estimate) || 0, checked_on: str(v.checked_on), accepting: Number(v.accepting) === 0 ? 0 : 1,
      };
      return <ServiceCard s={s} />;
    }
    case "model_plans": {
      const p: ModelPlan = {
        id: 0, code: str(v.code), name: str(v.name) || "（プラン名）", subtitle: str(v.subtitle) || null, inquiry_purpose: str(v.inquiry_purpose),
        memo: str(v.memo) || null, is_estimate: Number(v.is_estimate) || 0, checked_on: str(v.checked_on),
        costs: Object.fromEntries(Object.entries(planAmounts).map(([k, x]) => [k, Number(x) || 0])),
      };
      return <PlanCard p={p} />;
    }
    case "events": {
      const spot = opts.spot_id?.find((o) => o.value === Number(v.spot_id));
      const e: EventItem = {
        id: 0, slug: str(v.slug), title: str(v.title) || "（イベント名）", kind: str(v.kind), start_at: str(v.start_at) || new Date().toISOString(), end_at: str(v.end_at),
        place_text: str(v.place_text) || null, level_min: str(v.level_min), price_yen: num(v.price_yen), price_note: str(v.price_note) || null,
        capacity: num(v.capacity), remaining: num(v.capacity), entry_deadline: str(v.entry_deadline) || null, entry_status: str(v.entry_status) || "open",
        description_md: null, spot_name: spot?.label ?? null, spot_slug: null,
      };
      return <EventCard e={e} />;
    }
    case "notices":
      return (
        <ul>
          <li className="flex gap-3 border-b border-dotted border-sky-100 py-2 text-sm">
            <time className="flex-none text-slate-500">{str(v.publish_from).replace(/-/g, ".")}</time>
            <span>
              <span className="mr-1 rounded bg-orange-100 px-1.5 text-xs font-bold text-orange-900">お知らせ</span>
              <span className={v.link_url ? "text-ocean underline" : ""}>{str(v.title) || "（タイトル）"}</span>
              {Boolean(v.body_md) && <span className="block text-xs text-slate-600">{str(v.body_md)}</span>}
            </span>
          </li>
        </ul>
      );
    case "spots": {
      const sp: SpotView = {
        slug: str(v.slug), name: str(v.name) || "（スポット名）", regionLabel: REGION[v.region as keyof typeof REGION] ?? "", area: str(v.area_name),
        purposes: (opts.purposes || []).filter((o) => m2m.includes(o.value)).map((o) => o.label), level: str(v.level_min),
        levelLabel: DIVE_LEVEL[v.level_min as keyof typeof DIVE_LEVEL] ?? "", cost: num(v.cost_yen), costNote: str(v.cost_note),
        months: Array.isArray(v.best_months) ? (v.best_months as number[]) : [], summary: str(v.summary), bodyHtml: "", access: str(v.access),
        isEstimate: Number(v.is_estimate) === 1, checkedOn: str(v.checked_on), color: ["#00acc1", "#0d47a1"], rank: 0,
      };
      return <SpotCard spot={sp} />;
    }
    case "faqs":
      return (
        <details open className="rounded-xl border border-sky-100 bg-white">
          <summary className="list-none px-4 py-3 font-bold"><span className="text-ocean">Q. </span>{str(v.question) || "（質問）"}</summary>
          <div className="border-t border-sky-100 px-4 py-3 text-[15px]">
            <span className="font-bold text-orange-700">A. </span>
            <span className="whitespace-pre-wrap">{str(v.answer_md)}</span>
          </div>
        </details>
      );
    case "testimonials":
      return (
        <figure className="rounded-2xl border border-sky-100 bg-white p-4 text-sm">
          <blockquote>“{str(v.body)}”</blockquote>
          <figcaption className="mt-1.5 text-xs text-slate-500">{str(v.display_name)}</figcaption>
        </figure>
      );
    default:
      return null;
  }
}

export default function Preview(props: { table: string; v: Row; opts: Opts; m2m: number[]; planAmounts: Record<string, string> }) {
  const [sp, setSp] = useState(false);
  if (!PREVIEW_TABLES.includes(props.table)) return null;
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 lg:sticky lg:top-16" aria-label="プレビュー">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-bold text-ocean-deep">プレビュー（サイトと同じ見た目）</h2>
        <div className="ml-auto flex overflow-hidden rounded-md border text-xs" role="group" aria-label="表示の幅">
          <button type="button" aria-pressed={!sp} onClick={() => setSp(false)} className={`px-2 py-1 ${!sp ? "bg-pro text-white" : "bg-white"}`}>PC</button>
          <button type="button" aria-pressed={sp} onClick={() => setSp(true)} className={`px-2 py-1 ${sp ? "bg-pro text-white" : "bg-white"}`}>スマホ</button>
        </div>
      </div>
      {/* プレビューの中のボタンは押せないようにする */}
      <div className={`pointer-events-none mx-auto ${sp ? "max-w-[340px] text-[15px]" : ""}`} inert>
        <Body {...props} />
      </div>
      <p className="mt-2 text-xs text-slate-500">保存前の入力内容で表示しています。</p>
    </section>
  );
}
