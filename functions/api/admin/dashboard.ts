// GET /api/admin/dashboard  ダッシュボード（BO-01）
import type { Handler } from "../../_lib/types";
import { json } from "../../_lib/http";
import { purgeExpiredInquiries } from "../../_lib/retention";
import { can } from "../../../shared/permissions";
import { PUBLISH_TABLES, TABLES, getTable } from "../../../shared/admin-schema";
import { COURSE_KINDS, SITE_MAP, WORK_KINDS } from "../../../shared/site-map";

const inList = (a: string[]) => a.map((k) => `'${k}'`).join(",");
/** 空の部分の判定（バックオフィス仕様書 9.8）。公開サイトで表示される条件と同じ */
const EMPTY_SQL: Record<string, string> = {
  purposes: "SELECT COUNT(*) AS n FROM purposes",
  spots: "SELECT COUNT(*) AS n FROM spots WHERE status = 'published'",
  events: "SELECT COUNT(*) AS n FROM events WHERE status = 'published' AND end_at >= ?1",
  embeds_top: "SELECT COUNT(*) AS n FROM embeds WHERE status = 'published' AND (related_kind IS NULL OR related_kind = 'top')",
  notices: "SELECT COUNT(*) AS n FROM notices WHERE status = 'published' AND publish_from <= ?2 AND (publish_until IS NULL OR publish_until >= ?2)",
  testimonials: "SELECT COUNT(*) AS n FROM testimonials WHERE status = 'published'",
  services_work: `SELECT COUNT(*) AS n FROM services WHERE status = 'published' AND kind IN (${inList(WORK_KINDS)})`,
  services_course: `SELECT COUNT(*) AS n FROM services WHERE status = 'published' AND kind IN (${inList(COURSE_KINDS)})`,
  licenses: "SELECT COUNT(*) AS n FROM licenses WHERE status = 'published'",
  model_plans: "SELECT COUNT(*) AS n FROM model_plans WHERE status = 'published'",
  area_rates: "SELECT COUNT(*) AS n FROM area_rates WHERE status = 'published'",
  faqs: "SELECT COUNT(*) AS n FROM faqs WHERE status = 'published'",
};

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

  // サイトで「準備中」になっている部分と、初期データで下書きのままのもの（9.8）
  const nowIso = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const todayJst = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
  const empty: { page: string; part: string; table: string; editLabel: string; path: string }[] = [];
  for (const p of SITE_MAP) {
    if (!p.emptyCheck || !p.table) continue;
    const sql = EMPTY_SQL[p.emptyCheck];
    const st = db.prepare(sql);
    const c = await (sql.includes("?2") ? st.bind(nowIso, todayJst) : sql.includes("?1") ? st.bind(nowIso) : st).first<{ n: number }>();
    if (!c?.n) empty.push({ page: p.page, part: p.part, table: p.table, editLabel: p.editLabel, path: p.path });
  }
  const drafts: { table: string; label: string; count: number }[] = [];
  for (const t of TABLES.filter((x) => x.hasStatus)) {
    const c = await db.prepare(`SELECT COUNT(*) AS n FROM ${t.name} WHERE status = 'draft' AND updated_by = 'seed'`).first<{ n: number }>();
    if (c?.n) drafts.push({ table: t.name, label: t.label, count: c.n });
  }
  out.emptyParts = empty;
  out.seedDrafts = drafts;

  return json(out);
};
