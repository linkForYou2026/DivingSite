// GET /api/admin/dashboard  ダッシュボード（BO-01）
import type { Handler } from "../../_lib/types";
import { json } from "../../_lib/http";
import { purgeExpiredInquiries } from "../../_lib/retention";
import { can } from "../../../shared/permissions";
import { PUBLISH_TABLES, getTable } from "../../../shared/admin-schema";

const PRICE_TABLES = ["services", "model_plans", "area_rates", "spots", "gear_items"];

export const onRequestGet: Handler = async ({ env, data }) => {
  const admin = data.admin!;
  const db = env.DB;
  const out: Record<string, unknown> = {};

  if (can(admin.role, "inquiries")) {
    await purgeExpiredInquiries(db);
    const n = await db.prepare("SELECT COUNT(*) AS n FROM inquiries WHERE handling_status = 'new'").first<{ n: number }>();
    const latest = await db.prepare("SELECT id, created_at, purpose, name FROM inquiries WHERE handling_status = 'new' ORDER BY created_at DESC LIMIT 5").all();
    out.inquiries = { newCount: n?.n ?? 0, latest: latest.results };
  }

  // 今後30日のイベントと申し込み数
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const in30 = new Date(Date.now() + 30 * 86400_000).toISOString().replace(/\.\d{3}Z$/, "Z");
  const ev = await db
    .prepare(
      `SELECT e.id, e.title, e.start_at, e.capacity, e.entry_status, e.status,
        COALESCE((SELECT SUM(people) FROM event_entries x WHERE x.event_id = e.id AND x.entry_status IN ('requested','confirmed')), 0) AS entries
       FROM events e WHERE e.status <> 'archived' AND e.end_at >= ?1 AND e.start_at <= ?2 ORDER BY e.start_at`,
    )
    .bind(now, in30)
    .all();
  out.events = ev.results;

  // 確認日が古い金額（見直しの促し）
  const days = Number((await db.prepare("SELECT value FROM settings WHERE key = 'price_check_days'").first<{ value: string }>())?.value) || 180;
  const cutoff = new Date(Date.now() + 9 * 3600_000 - days * 86400_000).toISOString().slice(0, 10);
  const stale: unknown[] = [];
  for (const name of PRICE_TABLES) {
    const t = getTable(name)!;
    const r = await db.prepare(`SELECT id, ${t.title} AS title, checked_on FROM ${name} WHERE status <> 'archived' AND checked_on <= ?1 ORDER BY checked_on LIMIT 20`).bind(cutoff).all();
    r.results.forEach((x) => stale.push({ table: name, tableLabel: t.label, ...x }));
  }
  out.stalePrices = { days, items: stale };

  // 「サイトに反映」が必要な変更の件数
  const s = await db.prepare("SELECT key, value FROM settings WHERE key IN ('last_deploy_at','last_deploy_result','last_deploy_by')").all<{ key: string; value: string }>();
  const deploy = Object.fromEntries(s.results.map((x) => [x.key, x.value]));
  const since = deploy.last_deploy_at || "1970-01-01T00:00:00Z";
  const pending: { table: string; label: string; count: number }[] = [];
  for (const name of PUBLISH_TABLES) {
    const c = await db.prepare(`SELECT COUNT(*) AS n FROM ${name} WHERE updated_at > ?1`).bind(since).first<{ n: number }>();
    if (c?.n) pending.push({ table: name, label: getTable(name)!.label, count: c.n });
  }
  const settingChanged = await db.prepare("SELECT COUNT(*) AS n FROM settings WHERE key IN ('site_name','catch_copy') AND updated_at > ?1").bind(since).first<{ n: number }>();
  if (settingChanged?.n) pending.push({ table: "settings", label: "サイト名・キャッチコピー", count: settingChanged.n });
  out.deploy = { ...deploy, pending, hookConfigured: !!env.DEPLOY_HOOK_URL, canDeploy: can(admin.role, "deploy") };

  return json(out);
};
