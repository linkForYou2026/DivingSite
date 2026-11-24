// 「サイト表示の状態」（バックオフィス仕様書 9.5）の判定に必要な情報を集める
// 先頭〇件だけ出る部分の並びは、公開API と同じ条件・同じ順番で求める
import type { D1Database } from "./types";
import type { VisCtx } from "../../shared/visibility";
import { WORK_KINDS } from "../../shared/site-map";

const TOP_SQL: Record<string, { sql: string; withNow?: boolean }> = {
  services: { sql: `SELECT id FROM services WHERE status = 'published' AND kind IN (${WORK_KINDS.map((k) => `'${k}'`).join(",")}) ORDER BY sort_order, id LIMIT 3` },
  spots: { sql: "SELECT id FROM spots WHERE status = 'published' ORDER BY sort_order, id LIMIT 5" },
  events: { sql: "SELECT id FROM events WHERE status = 'published' AND end_at >= ?1 ORDER BY start_at LIMIT 3", withNow: true },
  embeds: { sql: "SELECT id FROM embeds WHERE status = 'published' AND (related_kind IS NULL OR related_kind = 'top') ORDER BY sort_order, id LIMIT 3" },
};

export async function visibilityContext(db: D1Database, table: string): Promise<VisCtx> {
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const today = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
  const last = await db.prepare("SELECT value FROM settings WHERE key = 'last_deploy_at'").first<{ value: string | null }>();
  let topIds: number[] = [];
  const top = TOP_SQL[table];
  if (top) {
    const st = db.prepare(top.sql);
    const r = await (top.withNow ? st.bind(now) : st).all<{ id: number }>();
    topIds = r.results.map((x) => x.id);
  }
  return { now, today, lastDeployAt: last?.value ?? null, topIds };
}
