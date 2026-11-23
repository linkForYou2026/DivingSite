// POST /api/admin/deploy 「サイトに反映」：Cloudflare Pages のデプロイフックを呼んで、サイトを組み立て直す
import type { Handler } from "../../_lib/types";
import { error, forbidden, json, nowIso } from "../../_lib/http";
import { auditStmt } from "../../_lib/audit";
import { can } from "../../../shared/permissions";

export const onRequestPost: Handler = async ({ env, data }) => {
  const admin = data.admin!;
  if (!can(admin.role, "deploy")) return forbidden();
  if (!env.DEPLOY_HOOK_URL) return error(400, "デプロイフック（DEPLOY_HOOK_URL）が設定されていません");

  // 連打防止：前回から1分以内は受け付けない
  const last = await env.DB.prepare("SELECT value FROM settings WHERE key = 'last_deploy_at'").first<{ value: string }>();
  if (last?.value && Date.now() - new Date(last.value).getTime() < 60_000) return error(429, "少し前に反映を始めたばかりです。1分ほど待ってからもう一度押してください");

  let ok = false;
  try {
    const r = await fetch(env.DEPLOY_HOOK_URL, { method: "POST" });
    ok = r.ok;
  } catch {
    ok = false;
  }
  const now = nowIso();
  const up = (k: string, v: string) =>
    env.DB.prepare('INSERT INTO settings ("key", "value", updated_by) VALUES (?1, ?2, ?3) ON CONFLICT("key") DO UPDATE SET "value" = excluded."value", updated_by = excluded.updated_by').bind(k, v, admin.email);
  await env.DB.batch([
    ...(ok ? [up("last_deploy_at", now)] : []),
    up("last_deploy_result", ok ? "requested" : "failed"),
    up("last_deploy_by", admin.email),
    auditStmt(env.DB, admin.email, "publish", null, null, { deploy: ok ? "requested" : "failed" }),
  ]);
  if (!ok) return error(502, "サイトの組み立てを開始できませんでした。時間をおいてもう一度試してください");
  return json({ ok: true, requested_at: now });
};
