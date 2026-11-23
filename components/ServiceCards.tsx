"use client";

// 自社メニュー（F-02 仕事メニュー・講習の料金）。管理画面の「自社メニュー・料金」（/api/prices）
import Link from "next/link";
import { contactHref } from "@/lib/data";
import { usePrices, type ServiceItem } from "@/lib/live";
import { PRICE_UNIT, SERVICE_KIND } from "@/shared/enums";
import { yen } from "@/shared/format";
import LiveState from "./LiveState";

export function priceText(s: ServiceItem): string {
  if (s.price_yen === null) return "要相談";
  const unit = PRICE_UNIT[s.price_unit as keyof typeof PRICE_UNIT];
  return `${yen(s.price_yen)}${s.price_from ? "〜" : ""}${unit ? ` / ${unit}` : ""}`;
}

const ICON: Record<string, string> = { photo: "📸", fun_dive: "🧭", course: "🤿", trial: "🤿", refresh: "🔁", survey: "🗺️", media: "🎬", tour_plan: "🚤", other: "🌊" };

/** 仕事メニュー（講習以外） */
export const WORK_KINDS = ["fun_dive", "photo", "survey", "media", "tour_plan", "other"];
/** 講習 */
export const COURSE_KINDS = ["trial", "course", "refresh"];

export function useServices(kinds: string[]) {
  const live = usePrices();
  const items = (live.data?.services ?? []).filter((s) => kinds.includes(s.kind));
  return { ...live, items };
}

export default function ServiceCards({ kinds = WORK_KINDS, limit, withButton = true }: { kinds?: string[]; limit?: number; withButton?: boolean }) {
  const { items, loading, error } = useServices(kinds);
  const list = items.slice(0, limit ?? 99);
  if (loading || error || !list.length) return <LiveState loading={loading} error={error} empty={!list.length} emptyText="メニューは準備中です。" />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((s) => (
        <article key={s.id} className="flex flex-col gap-1.5 rounded-2xl border border-sky-100 bg-white p-4">
          <span className="text-3xl" aria-hidden="true">{ICON[s.kind] ?? "🌊"}</span>
          <p className="text-xs font-bold text-ocean">{SERVICE_KIND[s.kind as keyof typeof SERVICE_KIND]}</p>
          <h3 className="font-bold">{s.name}</h3>
          {s.description && <p className="text-sm text-slate-600">{s.description}</p>}
          {s.duration && <p className="text-xs text-slate-500">所要：{s.duration}</p>}
          <p className="mt-auto text-lg font-extrabold text-pro">{priceText(s)}<small className="ml-1 text-xs font-normal text-slate-500">{s.price_yen !== null ? "税込" : ""}</small></p>
          {s.includes && <p className="text-xs text-slate-500">含まれるもの：{s.includes}</p>}
          {!s.accepting ? (
            <p className="rounded bg-slate-100 py-1.5 text-center text-sm font-bold text-slate-600">受付停止中</p>
          ) : (
            withButton && (
              <Link href={contactHref({ purpose: COURSE_KINDS.includes(s.kind) ? (s.kind === "refresh" ? "refresh" : "course") : "work", kind: s.name, service: s.id })} className="btn btn-warm text-sm">
                {COURSE_KINDS.includes(s.kind) ? "申し込む・相談する" : "この内容で依頼する"}
              </Link>
            )
          )}
        </article>
      ))}
    </div>
  );
}
