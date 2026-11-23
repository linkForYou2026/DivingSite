// GET /api/events?from=&to=  公開中のイベントと空き人数。即時反映（60秒キャッシュ）
import type { Handler } from "../_lib/types";
import { json } from "../_lib/http";
import { normalizeIso } from "../../shared/validate";

export const onRequestGet: Handler = async ({ env, request }) => {
  const q = new URL(request.url).searchParams;
  const from = normalizeIso(q.get("from") || "") || new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const to = normalizeIso(q.get("to") || "") || "9999-12-31T00:00:00Z";
  const r = await env.DB.prepare(
    `SELECT e.id, e.slug, e.title, e.kind, e.start_at, e.end_at, e.place_text, e.level_min, e.price_yen, e.price_note,
            e.capacity, e.entry_deadline, e.entry_status, e.description_md, s.name AS spot_name, s.slug AS spot_slug,
            COALESCE((SELECT SUM(people) FROM event_entries x WHERE x.event_id = e.id AND x.entry_status IN ('requested','confirmed')), 0) AS entries
     FROM events e LEFT JOIN spots s ON s.id = e.spot_id
     WHERE e.status = 'published' AND e.end_at >= ?1 AND e.start_at <= ?2
     ORDER BY e.start_at LIMIT 100`,
  )
    .bind(from, to)
    .all<Record<string, unknown> & { capacity: number | null; entries: number; entry_status: string }>();
  const today = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
  const events = r.results.map(({ entries, ...e }) => {
    const remaining = e.capacity ? Math.max(e.capacity - entries, 0) : null;
    let status = e.entry_status;
    if (status === "open" && remaining === 0) status = "full"; // 定員に達したら自動で満席
    if (status === "open" && e.entry_deadline && String(e.entry_deadline) < today) status = "closed";
    return { ...e, remaining, entry_status: status };
  });
  return json({ events }, { cache: 60 });
};
