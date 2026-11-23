"use client";

// イベント一覧（仕様書 F-07）。開催日が過ぎたものは表示しません
import Link from "next/link";
import { useEffect, useState } from "react";
import { DiveEvent, contactHref, events } from "@/lib/data";

const W = ["日", "月", "火", "水", "木", "金", "土"];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function EventCard({ e }: { e: DiveEvent }) {
  const [y, m, d] = e.date.split("-").map(Number);
  const w = W[new Date(y, m - 1, d).getDay()];
  return (
    <article className="flex flex-wrap items-center gap-3 rounded-xl border border-sky-100 bg-white p-3">
      <div className="w-16 flex-none rounded-xl bg-pro py-1 text-center leading-tight text-white">
        <small>{m}月</small>
        <b className="block text-2xl">{d}</b>
        <small>({w})</small>
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <h3 className="font-bold">{e.title}</h3>
        <p>{e.place}</p>
        <p>
          <span className="mr-1 rounded bg-sky-100 px-1.5 text-xs font-bold text-leisure-ink">{e.level}</span>
          {e.price}・{e.capacity}
        </p>
      </div>
      <Link href={contactHref({ purpose: "イベント参加", detail: `${m}/${d}「${e.title}」に参加希望` })} className="btn btn-warm w-full text-sm sm:w-auto">
        申し込む
      </Link>
    </article>
  );
}

export default function EventList({ limit }: { limit?: number }) {
  // 書き出した時点の日付で一度表示し、見ている人の今日の日付で絞り直す
  const [today, setToday] = useState("");
  useEffect(() => setToday(todayStr()), []);
  const list = [...events.items]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .filter((e) => !today || e.date >= today)
    .slice(0, limit ?? 99);
  if (!list.length) return <p className="rounded-xl bg-sky-50 p-5 text-center text-slate-600">現在予定しているイベントはありません。決まり次第お知らせします。</p>;
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {list.map((e) => <EventCard key={e.id} e={e} />)}
    </div>
  );
}
