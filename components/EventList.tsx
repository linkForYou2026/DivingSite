"use client";

// イベント一覧（F-07）。管理画面で保存するとすぐ反映（/api/events）。空き人数も表示
import Link from "next/link";
import { contactHref } from "@/lib/data";
import { useEvents, type EventItem } from "@/lib/live";
import { DIVE_LEVEL, ENTRY_STATUS } from "@/shared/enums";
import { yen } from "@/shared/format";
import LiveState from "./LiveState";

const W = ["日", "月", "火", "水", "木", "金", "土"];

function jst(iso: string) {
  const d = new Date(new Date(iso).getTime() + 9 * 3600_000);
  return { m: d.getUTCMonth() + 1, d: d.getUTCDate(), w: W[d.getUTCDay()], hm: `${d.getUTCHours()}:${String(d.getUTCMinutes()).padStart(2, "0")}` };
}

/** イベント1件のカード（管理画面のプレビューでも使う） */
export function EventCard({ e }: { e: EventItem }) {
  const s = jst(e.start_at);
  const open = e.entry_status === "open";
  return (
    <article className="flex flex-wrap items-center gap-3 rounded-xl border border-sky-100 bg-white p-3">
      <div className="w-16 flex-none rounded-xl bg-pro py-1 text-center leading-tight text-white">
        <small>{s.m}月</small>
        <b className="block text-2xl">{s.d}</b>
        <small>({s.w})</small>
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <h3 className="font-bold">{e.title}</h3>
        <p>{s.hm}〜{e.spot_name ? `・${e.spot_name}` : ""}{e.place_text ? `・${e.place_text}` : ""}</p>
        <p>
          <span className="mr-1 rounded bg-sky-100 px-1.5 text-xs font-bold text-leisure-ink">{DIVE_LEVEL[e.level_min as keyof typeof DIVE_LEVEL]}</span>
          {e.price_yen !== null ? `${yen(e.price_yen)}（税込）` : "参加費は要相談"}
          {e.capacity ? `・定員${e.capacity}名` : ""}
          {e.remaining !== null && open ? `・残り${e.remaining}名` : ""}
        </p>
      </div>
      {open ? (
        <Link href={contactHref({ purpose: "event", detail: `${s.m}/${s.d}「${e.title}」に参加希望`, event: e.id })} className="btn btn-warm w-full text-sm sm:w-auto">
          申し込む
        </Link>
      ) : (
        <span className="w-full rounded bg-slate-100 px-3 py-2 text-center text-sm font-bold text-slate-600 sm:w-auto">{ENTRY_STATUS[e.entry_status as keyof typeof ENTRY_STATUS]}</span>
      )}
    </article>
  );
}

export default function EventList({ limit }: { limit?: number }) {
  const { data, loading, error } = useEvents();
  const list = (data ?? []).slice(0, limit ?? 99);
  if (loading || error || !list.length) return <LiveState loading={loading} error={error} empty={!list.length} emptyText="現在予定しているイベントはありません。決まり次第お知らせします。" />;
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {list.map((e) => <EventCard key={e.id} e={e} />)}
    </div>
  );
}
