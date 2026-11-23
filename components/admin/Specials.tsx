"use client";

// 編集画面に追加で出す部品
// - PlanItems：モデルプランの内訳（費目ごとの金額を入れると合計を自動表示）BO-21
// - AreaPreview：エリア単価を変えると、日帰り〜3泊4日の試算をその場で表示 BO-22
import { useEffect, useState } from "react";
import { COST_ITEM, COST_ITEM_KEYS } from "@/shared/enums";
import { yen } from "@/shared/format";
import { DAY_OPTIONS, simulate, type AreaRate } from "@/shared/price";
import { apiGet, apiSend, ApiError } from "./api";
import { Alert, Card, btnPrimary, inputCls } from "./ui";

export function PlanItems({ planId, updatedAt, onSaved }: { planId: number; updatedAt: string; onSaved: () => void }) {
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiGet<{ amounts: Record<string, number> }>(`/api/admin/plans/${planId}/items`).then((r) =>
      setAmounts(Object.fromEntries(Object.entries(r.amounts).map(([k, v]) => [k, String(v)]))),
    );
  }, [planId]);

  const total = COST_ITEM_KEYS.reduce((s, k) => s + (Number(amounts[k]) || 0), 0);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    setErrs({});
    try {
      const r = await apiSend<{ changed: boolean }>("PUT", `/api/admin/plans/${planId}/items`, { amounts, updated_at: updatedAt });
      setMsg({ kind: "ok", text: r.changed ? "内訳を保存しました（確認日を今日にしました）" : "変更はありませんでした" });
      if (r.changed) onSaved();
    } catch (e) {
      const ae = e as ApiError;
      setErrs(ae.fieldErrors || {});
      setMsg({ kind: "error", text: ae.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="内訳（費目ごとの金額・税込）" className="mt-4">
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COST_ITEM_KEYS.map((k) => (
          <div key={k}>
            <label htmlFor={"ci-" + k} className="mb-1 block text-sm font-bold">{COST_ITEM[k]}</label>
            <span className="flex items-center gap-2">
              <input id={"ci-" + k} type="number" min={0} step={1} className={`${inputCls} text-right`} value={amounts[k] ?? ""} onChange={(e) => setAmounts({ ...amounts, [k]: e.target.value })} aria-invalid={!!errs[k]} />
              <span className="text-sm">円</span>
            </span>
            {errs[k] && <p className="mt-1 text-sm font-bold text-red-700">{errs[k]}</p>}
          </div>
        ))}
      </div>
      <p className="mt-3 text-lg">
        合計：<strong className="text-pro">{yen(total)}</strong>
        <span className="ml-1 text-xs text-slate-500">（1人あたり。合計は保存せず、内訳から毎回計算します）</span>
      </p>
      <button type="button" className={`${btnPrimary} mt-3`} onClick={save} disabled={busy}>
        内訳を保存
      </button>
      <p className="mt-2 text-xs text-slate-500">※ 上のプラン情報と内訳は別々に保存します。</p>
    </Card>
  );
}

export function AreaPreview({ values }: { values: Record<string, unknown> }) {
  const n = (k: string) => Number(values[k]) || 0;
  const a: AreaRate = {
    id: 0,
    code: "",
    name: String(values.name || ""),
    dive_per_day_yen: n("dive_per_day_yen"),
    rental_per_day_yen: n("rental_per_day_yen"),
    travel_yen: n("travel_yen"),
    stay_per_night_yen: n("stay_per_night_yen"),
    other_per_day_yen: n("other_per_day_yen"),
    uses_flight: n("uses_flight"),
    range_ratio: Number(values.range_ratio) || 0,
    is_estimate: 1,
    checked_on: "",
  };
  return (
    <Card title="試算プレビュー（サイトでの見え方）" className="lg:sticky lg:top-16">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500"><th className="py-1">日数</th><th className="text-right">器材あり</th><th className="text-right">器材なし</th></tr>
        </thead>
        <tbody className="divide-y">
          {DAY_OPTIONS.map((d) => {
            const w = simulate(a, d.d, true);
            const wo = simulate(a, d.d, false);
            return (
              <tr key={d.d}>
                <td className="py-1.5">{d.label}<br /><span className="text-xs text-slate-500">潜る日 {w.diveDays}日</span></td>
                <td className="text-right font-bold">{yen(w.total)}<br /><span className="text-xs font-normal text-slate-500">{yen(w.low)}〜{yen(w.high)}</span></td>
                <td className="text-right">{yen(wo.total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-500">1人あたり・1,000円単位で四捨五入。保存前の入力内容で計算しています。</p>
    </Card>
  );
}
