// 費用シミュレーターの計算（公開サイトと管理画面の試算プレビューで共通）
import type { CostItemKey } from "./enums";

export type AreaRate = {
  id: number;
  code: string;
  name: string;
  dive_per_day_yen: number;
  rental_per_day_yen: number;
  travel_yen: number;
  stay_per_night_yen: number;
  other_per_day_yen: number;
  uses_flight: number;
  range_ratio: number;
  is_estimate: number;
  checked_on: string;
};

export type Breakdown = Record<CostItemKey, number>;

export const DAY_OPTIONS = [
  { d: 1, label: "日帰り" },
  { d: 2, label: "1泊2日" },
  { d: 3, label: "2泊3日" },
  { d: 4, label: "3泊4日" },
];

export function simulate(a: AreaRate, days: number, rental: boolean, people = 1) {
  // 飛行機で行く場所は、帰る日（飛行機に乗る日）は潜らない計算にする
  const diveDays = a.uses_flight ? Math.max(days - 1, 1) : days;
  const breakdown: Breakdown = {
    tour: a.dive_per_day_yen * diveDays,
    rental: rental ? a.rental_per_day_yen * diveDays : 0,
    travel: a.travel_yen,
    stay: a.stay_per_night_yen * Math.max(days - 1, 0),
    other: a.other_per_day_yen * days,
  };
  const perPerson = Object.values(breakdown).reduce((s, n) => s + n, 0);
  const total = perPerson * people;
  const r1000 = (n: number) => Math.round(n / 1000) * 1000;
  return {
    diveDays,
    breakdown,
    total: r1000(total),
    low: r1000(total * (1 - a.range_ratio)),
    high: r1000(total * (1 + a.range_ratio)),
  };
}
