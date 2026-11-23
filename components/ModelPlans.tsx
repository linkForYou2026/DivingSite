// モデルプラン（仕様書 F-12）
import Link from "next/link";
import { contactHref, costData, yen } from "@/lib/data";
import { CostBar, CostList, costSum } from "./CostParts";

export default function ModelPlans() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {costData.plans.map((p) => {
        const total = costSum(p.cost);
        return (
          <article key={p.name} className="flex flex-col gap-1.5 rounded-2xl border border-sky-100 bg-white p-4">
            <h3 className="font-bold">{p.name}</h3>
            <p className="text-xs text-slate-500">{p.sub}</p>
            <p className="text-2xl font-extrabold text-pro">
              {yen(total)}
              <small className="text-xs font-normal text-slate-500"> 前後 / 1人</small>
            </p>
            <CostBar cost={p.cost} />
            <CostList cost={p.cost} />
            {p.memo && <p className="text-xs text-slate-500">※ {p.memo}</p>}
            <Link
              href={contactHref({ purpose: p.purpose, detail: `モデルプラン「${p.name}」について相談したい（目安 ${yen(total)}）` })}
              className="btn btn-warm mt-auto text-sm"
            >
              このプランで相談する
            </Link>
          </article>
        );
      })}
    </div>
  );
}
