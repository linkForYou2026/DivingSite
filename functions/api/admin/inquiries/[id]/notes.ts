// POST /api/admin/inquiries/<番号>/notes  対応メモを残す { body, action?: "note" | "replied" }
import type { Handler } from "../../../../_lib/types";
import { error, forbidden, json, notFound, readJson } from "../../../../_lib/http";
import { can } from "../../../../../shared/permissions";

export const onRequestPost: Handler<"id"> = async ({ env, params, request, data }) => {
  const admin = data.admin!;
  if (!can(admin.role, "inquiries")) return forbidden();
  const id = Number(params.id);
  const body = await readJson<{ body?: string; action?: string }>(request);
  const text = (body?.body || "").trim();
  const action = body?.action === "replied" ? "replied" : "note";
  if (action === "note" && !text) return error(400, "メモを入力してください");
  if (text.length > 5000) return error(400, "メモが長すぎます");
  const exists = await env.DB.prepare("SELECT 1 FROM inquiries WHERE id = ?1").bind(id).first();
  if (!exists) return notFound();
  await env.DB.prepare("INSERT INTO inquiry_logs (inquiry_id, action, body, updated_by) VALUES (?1, ?2, ?3, ?4)").bind(id, action, text || null, admin.email).run();
  return json({ ok: true }, { status: 201 });
};
