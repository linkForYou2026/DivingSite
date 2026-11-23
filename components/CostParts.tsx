// 費用の内訳バーと内訳リスト（モデルプランとシミュレーターで共通）
import { COST_ITEM, COST_ITEM_KEYS } from "@/shared/enums";
import { yen } from "@/shared/format";

export const COST_COLORS: Record<string, string> = { tour: "#0D47A1", rental: "#1E88E5", travel: "#4FC3F7", stay: "#26A69A", other: "#B0BEC5" };

export function costSum(c: Record<string, number>): number {
  return COST_ITEM_KEYS.reduce((t, k) => t + (c[k] || 0), 0);
}

export function CostBar({ cost }: { cost: Record<string, number> }) {
  const total = costSum(cost) || 1;
  return (
    <div className="flex h-3 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
      {COST_ITEM_KEYS.map((k) => (cost[k] ? <span key={k} style={{ width: `${(cost[k] / total) * 100}%`, background: COST_COLORS[k] }} /> : null))}
    </div>
  );
}

export function CostList({ cost, mult = 1 }: { cost: Record<string, number>; mult?: number }) {
  return (
    <ul className="text-[13px]">
      {COST_ITEM_KEYS.map((k) => (
        <li key={k} className="flex items-center gap-2 border-b border-dotted border-sky-100 py-0.5">
          <span className="h-2.5 w-2.5 flex-none rounded-sm" style={{ background: COST_COLORS[k] }} aria-hidden="true" />
          <span className="flex-1">{COST_ITEM[k]}</span>
          <span>{cost[k] ? yen(cost[k] * mult) : "－"}</span>
        </li>
      ))}
    </ul>
  );
}
