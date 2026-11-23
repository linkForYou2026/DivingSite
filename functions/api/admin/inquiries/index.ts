// GET /api/admin/inquiries  問い合わせ一覧（owner だけ）
// ?status=new などで絞り込み。何も指定しなければ「完了・迷惑」以外を、未対応を上にして出す
import type { Handler } from "../../../_lib/types";
import { forbidden, json } from "../../../_lib/http";
import { purgeExpiredInquiries } from "../../../_lib/retention";
import { can } from "../../../../shared/permissions";

export const onRequestGet: Handler = async ({ env, request, data }) => {
  if (!can(data.admin!.role, "inquiries")) return forbidden();
  await purgeExpiredInquiries(env.DB);
  const q = new URL(request.url).searchParams;
  const where: string[] = [];
  const binds: unknown[] = [];
  const add = (sql: string, v: unknown) => {
    binds.push(v);
    where.push(sql.replace("?", "?" + binds.length));
  };
  const status = q.get("status");
  if (status === "all") {
    /* すべて */
  } else if (status) add("i.handling_status = ?", status);
  else where.push("i.handling_status NOT IN ('done','spam')");
  if (q.get("purpose")) add("i.purpose = ?", q.get("purpose"));
  const kw = (q.get("q") || "").trim();
  if (kw) {
    binds.push(`%${kw}%`);
    const n = binds.length;
    where.push(`(i.name LIKE ?${n} OR i.email LIKE ?${n} OR i.message LIKE ?${n})`);
  }
  const page = Math.max(1, Number(q.get("page") || 1));
  const w = where.length ? "WHERE " + where.join(" AND ") : "";
  const total = (await env.DB.prepare(`SELECT COUNT(*) AS n FROM inquiries i ${w}`).bind(...binds).first<{ n: number }>())?.n ?? 0;
  const rows = await env.DB.prepare(
    `SELECT i.id, i.created_at, i.purpose, i.name, i.email, i.handling_status, i.assignee, i.deleted_at, e.title AS event_title, s.name AS service_name
     FROM inquiries i LEFT JOIN events e ON e.id = i.event_id LEFT JOIN services s ON s.id = i.service_id
     ${w}
     ORDER BY CASE i.handling_status WHEN 'new' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'waiting' THEN 2 ELSE 3 END, i.created_at DESC
     LIMIT 50 OFFSET ${(page - 1) * 50}`,
  )
    .bind(...binds)
    .all();
  const counts = await env.DB.prepare("SELECT handling_status AS s, COUNT(*) AS n FROM inquiries GROUP BY handling_status").all<{ s: string; n: number }>();
  return json({ rows: rows.results, total, page, pageSize: 50, counts: Object.fromEntries(counts.results.map((c) => [c.s, c.n])) });
};
