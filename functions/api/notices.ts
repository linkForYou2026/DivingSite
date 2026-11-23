// GET /api/notices  表示期間中のお知らせ。即時反映（60秒キャッシュ）
import type { Handler } from "../_lib/types";
import { json } from "../_lib/http";

export const onRequestGet: Handler = async ({ env }) => {
  const today = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
  const r = await env.DB.prepare(
    "SELECT id, title, body_md, link_url, publish_from FROM notices WHERE status = 'published' AND publish_from <= ?1 AND (publish_until IS NULL OR publish_until >= ?1) ORDER BY publish_from DESC, id DESC LIMIT 20",
  )
    .bind(today)
    .all();
  return json({ notices: r.results }, { cache: 60 });
};
