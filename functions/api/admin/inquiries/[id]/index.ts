// GET /api/admin/inquiries/<番号>   詳細と対応履歴
// PUT /api/admin/inquiries/<番号>   対応状況・担当者の変更 { handling_status?, assignee? }
import type { Handler } from "../../../../_lib/types";
import { error, forbidden, json, notFound, nowIso, readJson } from "../../../../_lib/http";
import { auditStmt } from "../../../../_lib/audit";
import { can } from "../../../../../shared/permissions";
import { HANDLING_STATUS } from "../../../../../shared/enums";

export const onRequestGet: Handler<"id"> = async ({ env, params, data }) => {
  if (!can(data.admin!.role, "inquiries")) return forbidden();
  const id = Number(params.id);
  const row = await env.DB.prepare(
    `SELECT i.*, e.title AS event_title, e.start_at AS event_start_at, s.name AS service_name
     FROM inquiries i LEFT JOIN events e ON e.id = i.event_id LEFT JOIN services s ON s.id = i.service_id WHERE i.id = ?1`,
  )
    .bind(id)
    .first();
  if (!row) return notFound();
  const [logs, entries, admins] = await Promise.all([
    env.DB.prepare("SELECT id, action, body, created_at, updated_by FROM inquiry_logs WHERE inquiry_id = ?1 ORDER BY created_at, id").bind(id).all(),
    env.DB.prepare("SELECT id, event_id, people, entry_status, memo, updated_at FROM event_entries WHERE inquiry_id = ?1").bind(id).all(),
    env.DB.prepare("SELECT email, display_name FROM admin_users WHERE active = 1 AND role = 'owner' ORDER BY id").all(),
  ]);
  return json({ row, logs: logs.results, entries: entries.results, assignees: admins.results });
};

export const onRequestPut: Handler<"id"> = async ({ env, params, request, data }) => {
  const admin = data.admin!;
  if (!can(admin.role, "inquiries")) return forbidden();
  const id = Number(params.id);
  const body = await readJson<{ handling_status?: string; assignee?: string | null }>(request);
  if (!body) return error(400, "送信内容が読み取れません");
  const cur = await env.DB.prepare("SELECT handling_status, assignee FROM inquiries WHERE id = ?1").bind(id).first<{ handling_status: string; assignee: string | null }>();
  if (!cur) return notFound();

  const stmts = [];
  const now = nowIso();
  if (body.handling_status !== undefined && body.handling_status !== cur.handling_status) {
    if (!(body.handling_status in HANDLING_STATUS)) return error(400, "対応状況の値が正しくありません");
    const label = (s: string) => HANDLING_STATUS[s as keyof typeof HANDLING_STATUS] ?? s;
    stmts.push(env.DB.prepare("UPDATE inquiries SET handling_status = ?1, updated_by = ?2, updated_at = ?3 WHERE id = ?4").bind(body.handling_status, admin.email, now, id));
    stmts.push(
      env.DB.prepare("INSERT INTO inquiry_logs (inquiry_id, action, body, updated_by) VALUES (?1, 'status_change', ?2, ?3)").bind(
        id,
        `${label(cur.handling_status)} → ${label(body.handling_status)}`,
        admin.email,
      ),
    );
  }
  if (body.assignee !== undefined && (body.assignee || null) !== cur.assignee) {
    const a = body.assignee || null;
    if (a) {
      const ok = await env.DB.prepare("SELECT 1 FROM admin_users WHERE email = ?1 COLLATE NOCASE AND active = 1").bind(a).first();
      if (!ok) return error(400, "担当者が見つかりません");
    }
    stmts.push(env.DB.prepare("UPDATE inquiries SET assignee = ?1, updated_by = ?2, updated_at = ?3 WHERE id = ?4").bind(a, admin.email, now, id));
  }
  if (!stmts.length) return json({ changed: false });
  stmts.push(auditStmt(env.DB, admin.email, "update", "inquiries", id, { handling_status: { before: cur.handling_status, after: body.handling_status ?? cur.handling_status }, assignee: { before: cur.assignee, after: body.assignee ?? cur.assignee } }));
  await env.DB.batch(stmts);
  return json({ changed: true });
};
