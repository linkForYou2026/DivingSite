// 公開API・書き出しAPI で使う読み出し処理（公開中＝status が published のものだけ）
import type { D1Database } from "./types";
import { SETTING_KEYS } from "../../shared/admin-schema";

export async function publicSettings(db: D1Database) {
  const keys = SETTING_KEYS.filter((k) => k.public).map((k) => k.key);
  const r = await db.prepare(`SELECT key, value FROM settings WHERE key IN (${keys.map((_, i) => "?" + (i + 1)).join(",")})`).bind(...keys).all<{ key: string; value: string | null }>();
  return Object.fromEntries(r.results.map((x) => [x.key, x.value]));
}

export async function publicPrices(db: D1Database) {
  const [services, plans, items, areas, notice] = await Promise.all([
    db.prepare(
      `SELECT s.id, s.code, s.kind, s.name, s.description, s.license_id, l.code AS license_code, a.code AS agency_code,
              s.price_yen, s.price_unit, s.price_from, s.includes, s.excludes, s.duration, s.is_estimate, s.checked_on, s.accepting, s.sort_order
       FROM services s LEFT JOIN licenses l ON l.id = s.license_id LEFT JOIN agencies a ON a.id = l.agency_id
       WHERE s.status = 'published' ORDER BY s.sort_order, s.id`,
    ).all(),
    db.prepare("SELECT id, code, name, subtitle, inquiry_purpose, memo, is_estimate, checked_on FROM model_plans WHERE status = 'published' ORDER BY sort_order, id").all<{ id: number }>(),
    db.prepare("SELECT plan_id, item, amount_yen FROM plan_cost_items").all<{ plan_id: number; item: string; amount_yen: number }>(),
    db.prepare(
      "SELECT id, code, name, dive_per_day_yen, rental_per_day_yen, travel_yen, stay_per_night_yen, other_per_day_yen, uses_flight, range_ratio, is_estimate, checked_on FROM area_rates WHERE status = 'published' ORDER BY sort_order, id",
    ).all(),
    db.prepare("SELECT value FROM settings WHERE key = 'price_notice'").first<{ value: string | null }>(),
  ]);
  const modelPlans = plans.results.map((p) => {
    const costs: Record<string, number> = { tour: 0, rental: 0, travel: 0, stay: 0, other: 0 };
    items.results.filter((i) => i.plan_id === p.id).forEach((i) => (costs[i.item] = i.amount_yen));
    return { ...p, costs };
  });
  return { services: services.results, modelPlans, areaRates: areas.results, priceNotice: notice?.value ?? null };
}
