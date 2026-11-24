"use client";

// モデルプラン（F-12）。金額は管理画面で更新するとすぐ反映（/api/prices）
import Link from "next/link";
import { contactHref } from "@/lib/data";
import { usePrices, type ModelPlan } from "@/lib/live";
import { asOf, yen } from "@/shared/format";
import { CostBar, CostList, costSum } from "./CostParts";
import LiveState from "./LiveState";

export default function ModelPlans() {
  const { data, loading, error } = usePrices();
  const plans = data?.modelPlans ?? [];
  if (loading || error || !plans.length) return <LiveState loading={loading} error={error} empty={!plans.length} emptyText="モデルプランは準備中です。" />;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {plans.map((p) => <PlanCard key={p.id} p={p} />)}
    </div>
  );
}

/** モデルプラン1件のカード（管理画面のプレビューでも使う） */
export function PlanCard({ p }: { p: ModelPlan }) {
  const total = costSum(p.costs);
  return (
    <article className="flex flex-col gap-1.5 rounded-2xl border border-sky-100 bg-white p-4">
      <h3 className="font-bold">{p.name}</h3>
      {p.subtitle && <p className="text-xs text-slate-500">{p.subtitle}</p>}
      <p className="text-2xl font-extrabold text-pro">
        {yen(total)}
        <small className="text-xs font-normal text-slate-500"> 前後 / 1人</small>
      </p>
      <p className="text-xs text-slate-500">{p.is_estimate ? `${asOf(p.checked_on)}の目安・税込` : "税込"}</p>
      <CostBar cost={p.costs} />
      <CostList cost={p.costs} />
      {p.memo && <p className="text-xs text-slate-500">※ {p.memo}</p>}
      <Link
        href={contactHref({ purpose: p.inquiry_purpose, detail: `モデルプラン「${p.name}」について相談したい（目安 ${yen(total)}）` })}
        className="btn btn-warm mt-auto text-sm"
      >
        このプランで相談する
      </Link>
    </article>
  );
}
