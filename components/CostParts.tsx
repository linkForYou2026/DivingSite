// 費用の内訳バーと内訳リスト（モデルプランとシミュレーターで共通）
import { CostBreakdown, costData, yen } from "@/lib/data";

export function costSum(c: CostBreakdown): number {
  return costData.items.reduce((t, i) => t + (c[i.key] || 0), 0);
}

export function CostBar({ cost }: { cost: CostBreakdown }) {
  const total = costSum(cost) || 1;
  return (
    <div className="flex h-3 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
      {costData.items.map((i) =>
        cost[i.key] ? <span key={i.key} style={{ width: `${(cost[i.key] / total) * 100}%`, background: i.color }} /> : null,
      )}
    </div>
  );
}

export function CostList({ cost, mult = 1 }: { cost: CostBreakdown; mult?: number }) {
  return (
    <ul className="text-[13px]">
      {costData.items.map((i) => (
        <li key={i.key} className="flex items-center gap-2 border-b border-dotted border-sky-100 py-0.5">
          <span className="h-2.5 w-2.5 flex-none rounded-sm" style={{ background: i.color }} aria-hidden="true" />
          <span className="flex-1">{i.label}</span>
          <span>{cost[i.key] ? yen(cost[i.key] * mult) : "－"}</span>
        </li>
      ))}
    </ul>
  );
}
