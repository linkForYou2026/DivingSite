// GET /api/export  サイトの組み立て（npm run build）のときに、「公開操作で反映」のデータをまとめて渡す
// 合言葉（EXPORT_TOKEN）が合うときだけ返す。公開中のデータだけで、個人情報は含めない
import type { Handler } from "../_lib/types";
import { error, json } from "../_lib/http";
import { publicSettings } from "../_lib/public";

const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};

export const onRequestGet: Handler = async ({ env, request }) => {
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!env.EXPORT_TOKEN || !token || !safeEqual(token, env.EXPORT_TOKEN)) return error(401, "合言葉が違います");
  const db = env.DB;
  const all = (sql: string) => db.prepare(sql).all().then((r) => r.results);
  const [agencies, licenses, equivalences, spots, spotPurposes, purposes, creatures, spotCreatures, faqs, testimonials, embeds, communityLinks, gearItems, settings] = await Promise.all([
    all("SELECT * FROM agencies WHERE status = 'published' ORDER BY sort_order, id"),
    all("SELECT * FROM licenses WHERE status = 'published' ORDER BY agency_id, step_order, id"),
    all("SELECT * FROM license_equivalences ORDER BY level_order, agency_id"),
    all("SELECT * FROM spots WHERE status = 'published' ORDER BY sort_order, id"),
    all("SELECT * FROM spot_purposes"),
    all("SELECT * FROM purposes ORDER BY sort_order, id"),
    all("SELECT * FROM creatures WHERE status = 'published' ORDER BY category, sort_order, id"),
    all("SELECT * FROM spot_creatures"),
    all("SELECT * FROM faqs WHERE status = 'published' ORDER BY sort_order, id"),
    all("SELECT id, display_name, body, related_kind, related_id, sort_order FROM testimonials WHERE status = 'published' ORDER BY sort_order, id"),
    all("SELECT * FROM embeds WHERE status = 'published' ORDER BY sort_order, id"),
    all("SELECT * FROM community_links WHERE status = 'published' ORDER BY sort_order, id"),
    all("SELECT * FROM gear_items WHERE status = 'published' ORDER BY category, budget_band, sort_order, id"),
    publicSettings(db),
  ]);
  return json({
    exportedAt: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    agencies, licenses, equivalences, spots, spotPurposes, purposes, creatures, spotCreatures, faqs, testimonials, embeds, communityLinks, gearItems, settings,
  });
};
