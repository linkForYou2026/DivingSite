"use client";

// 「即時」のデータ（料金・イベント・お知らせ・受付時間など）を、ページを開いたときに API から読み込む
// （データモデル定義書 1.2・6.1）。同じページ内で何度呼んでも、通信は1回だけ
import { useEffect, useState } from "react";
import type { AreaRate } from "@/shared/price";

export type ServiceItem = {
  id: number;
  code: string;
  kind: string;
  name: string;
  description: string | null;
  license_id: number | null;
  license_code: string | null;
  agency_code: string | null;
  price_yen: number | null;
  price_unit: string;
  price_from: number;
  includes: string | null;
  excludes: string | null;
  duration: string | null;
  is_estimate: number;
  checked_on: string;
  accepting: number;
};
export type ModelPlan = {
  id: number;
  code: string;
  name: string;
  subtitle: string | null;
  inquiry_purpose: string;
  memo: string | null;
  is_estimate: number;
  checked_on: string;
  costs: Record<string, number>;
};
export type Prices = { services: ServiceItem[]; modelPlans: ModelPlan[]; areaRates: AreaRate[]; priceNotice: string | null };
export type EventItem = {
  id: number;
  slug: string;
  title: string;
  kind: string;
  start_at: string;
  end_at: string;
  place_text: string | null;
  level_min: string;
  price_yen: number | null;
  price_note: string | null;
  capacity: number | null;
  remaining: number | null;
  entry_deadline: string | null;
  entry_status: string;
  description_md: string | null;
  spot_name: string | null;
  spot_slug: string | null;
};
export type Notice = { id: number; title: string; body_md: string | null; link_url: string | null; publish_from: string };
export type PublicSettings = Record<string, string | null>;

const cache = new Map<string, Promise<unknown>>();
function get<T>(path: string): Promise<T> {
  if (!cache.has(path)) {
    cache.set(
      path,
      fetch(path, { headers: { Accept: "application/json" } }).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      }),
    );
  }
  return cache.get(path) as Promise<T>;
}

export type Live<T> = { data: T | null; error: boolean; loading: boolean };

function useLive<T, R>(path: string, pick: (r: R) => T): Live<T> {
  const [s, setS] = useState<Live<T>>({ data: null, error: false, loading: true });
  useEffect(() => {
    let alive = true;
    get<R>(path)
      .then((r) => alive && setS({ data: pick(r), error: false, loading: false }))
      .catch(() => alive && setS({ data: null, error: true, loading: false }));
    return () => {
      alive = false;
    };
    // pick は毎回同じ処理なので依存に入れない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
  return s;
}

export const usePrices = () => useLive<Prices, Prices>("/api/prices", (r) => r);
export const useEvents = () => useLive<EventItem[], { events: EventItem[] }>("/api/events", (r) => r.events);
export const useNotices = () => useLive<Notice[], { notices: Notice[] }>("/api/notices", (r) => r.notices);
export const usePublicSettings = () => useLive<PublicSettings, { settings: PublicSettings }>("/api/settings/public", (r) => r.settings);
