// GET /api/admin/settings   サイト設定（owner だけ）
// PUT /api/admin/settings   { values: { site_name: "...", ... } }
import type { Handler } from "../../_lib/types";
import { error, forbidden, json, nowIso, readJson } from "../../_lib/http";
import { auditStmt } from "../../_lib/audit";
import { can } from "../../../shared/permissions";
import { SETTING_KEYS } from "../../../shared/admin-schema";
import { checkField } from "../../../shared/validate";

export const onRequestGet: Handler = async ({ env, data }) => {
  if (!can(data.admin!.role, "settings")) return forbidden();
  const r = await env.DB.prepare("SELECT key, value, updated_at, updated_by FROM settings").all<{ key: string; value: string | null }>();
  return json({ keys: SETTING_KEYS, values: Object.fromEntries(r.results.map((x) => [x.key, x.value])) });
};

export const onRequestPut: Handler = async ({ env, request, data }) => {
  const admin = data.admin!;
  if (!can(admin.role, "settings")) return forbidden();
  const body = await readJson<{ values?: Record<string, unknown> }>(request);
  if (!body?.values) return error(400, "送信内容が読み取れません");
  const cur = await env.DB.prepare("SELECT key, value FROM settings").all<{ key: string; value: string | null }>();
  const before = Object.fromEntries(cur.results.map((x) => [x.key, x.value]));

  const fieldErrors: Record<string, string> = {};
  const changes: Record<string, { before: unknown; after: string | null }> = {};
  for (const def of SETTING_KEYS) {
    if (!(def.key in body.values)) continue;
    const r = checkField({ name: def.key, label: def.label, type: def.type === "int" ? "int" : def.type, min: def.type === "int" ? 0 : undefined }, body.values[def.key]);
    if (r.error) {
      fieldErrors[def.key] = r.error;
      continue;
    }
    const v = r.value === null ? null : String(r.value);
    if ((before[def.key] ?? null) !== v) changes[def.key] = { before: before[def.key] ?? null, after: v };
  }
  if (Object.keys(fieldErrors).length) return error(400, "入力内容を確認してください", { fieldErrors });
  if (!Object.keys(changes).length) return json({ changed: false });
  const now = nowIso();
  await env.DB.batch([
    ...Object.entries(changes).map(([k, c]) =>
      env.DB.prepare('INSERT INTO settings ("key", "value", updated_by) VALUES (?1, ?2, ?3) ON CONFLICT("key") DO UPDATE SET "value" = excluded."value", updated_by = excluded.updated_by, updated_at = ?4').bind(k, c.after, admin.email, now),
    ),
    auditStmt(env.DB, admin.email, "update", "settings", null, changes),
  ]);
  return json({ changed: true });
};
