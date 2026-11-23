// GET /api/admin/plans/<番号>/items   モデルプランの内訳（費目ごとの金額）
// PUT /api/admin/plans/<番号>/items   { amounts: { tour: 0, rental: 0, travel: 0, stay: 0, other: 0 }, updated_at }
import type { Handler } from "../../../../_lib/types";
import { error, forbidden, json, notFound, nowIsoMs as nowIso, readJson } from "../../../../_lib/http";
import { auditStmt } from "../../../../_lib/audit";
import { can } from "../../../../../shared/permissions";
import { COST_ITEM_KEYS } from "../../../../../shared/enums";
import { todayJst } from "../../../../../shared/validate";

async function load(db: import("../../../../_lib/types").D1Database, id: number) {
  const r = await db.prepare("SELECT item, amount_yen FROM plan_cost_items WHERE plan_id = ?1").bind(id).all<{ item: string; amount_yen: number }>();
  const amounts: Record<string, number> = Object.fromEntries(COST_ITEM_KEYS.map((k) => [k, 0]));
  r.results.forEach((x) => (amounts[x.item] = x.amount_yen));
  return amounts;
}

export const onRequestGet: Handler<"id"> = async ({ env, params, data }) => {
  if (!can(data.admin!.role, "prices")) return forbidden();
  return json({ amounts: await load(env.DB, Number(params.id)) });
};

export const onRequestPut: Handler<"id"> = async ({ env, params, request, data }) => {
  const admin = data.admin!;
  if (!can(admin.role, "prices")) return forbidden();
  const id = Number(params.id);
  const plan = await env.DB.prepare("SELECT id, updated_at FROM model_plans WHERE id = ?1").bind(id).first<{ id: number; updated_at: string }>();
  if (!plan) return notFound();
  const body = await readJson<{ amounts?: Record<string, unknown>; updated_at?: string }>(request);
  if (!body?.amounts) return error(400, "送信内容が読み取れません");
  if (body.updated_at !== plan.updated_at) return error(409, "他の人が先に更新しました。画面を開き直して、最新の内容を確認してください");

  const next: Record<string, number> = {};
  const fieldErrors: Record<string, string> = {};
  for (const k of COST_ITEM_KEYS) {
    const raw = body.amounts[k];
    const n = raw === "" || raw === null || raw === undefined ? 0 : Number(String(raw).replace(/[,，\s円]/g, ""));
    if (!Number.isInteger(n) || n < 0) fieldErrors[k] = "0以上の整数（円）で入力してください";
    else next[k] = n;
  }
  if (Object.keys(fieldErrors).length) return error(400, "入力内容を確認してください", { fieldErrors });

  const before = await load(env.DB, id);
  const diff = Object.fromEntries(COST_ITEM_KEYS.filter((k) => before[k] !== next[k]).map((k) => [k, { before: before[k], after: next[k] }]));
  if (!Object.keys(diff).length) return json({ changed: false, updated_at: plan.updated_at });

  const now = nowIso();
  await env.DB.batch([
    ...COST_ITEM_KEYS.map((k) =>
      env.DB.prepare(
        "INSERT INTO plan_cost_items (plan_id, item, amount_yen, updated_by) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(plan_id, item) DO UPDATE SET amount_yen = excluded.amount_yen, updated_by = excluded.updated_by, updated_at = ?5",
      ).bind(id, k, next[k], admin.email, now),
    ),
    // 金額を変えたので、プランの確認日を今日にする
    env.DB.prepare("UPDATE model_plans SET checked_on = ?1, updated_by = ?2, updated_at = ?3 WHERE id = ?4").bind(todayJst(), admin.email, now, id),
    auditStmt(env.DB, admin.email, "update", "plan_cost_items", id, diff),
  ]);
  return json({ changed: true, updated_at: now });
};
