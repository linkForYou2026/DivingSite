"use client";

// お知らせ（管理画面の「お知らせ」。表示期間中のものだけ）
import Link from "next/link";
import { useNotices } from "@/lib/live";

export default function NoticeList() {
  const { data } = useNotices();
  if (!data?.length) return null;
  return (
    <ul>
      {data.map((n) => (
        <li key={n.id} className="flex gap-3 border-b border-dotted border-sky-100 py-2 text-sm">
          <time className="flex-none text-slate-500" dateTime={n.publish_from}>{n.publish_from.replace(/-/g, ".")}</time>
          <span>
            <span className="mr-1 rounded bg-orange-100 px-1.5 text-xs font-bold text-orange-900">お知らせ</span>
            {n.link_url ? <Link href={n.link_url} className="text-ocean underline">{n.title}</Link> : n.title}
            {n.body_md && <span className="block text-xs text-slate-600">{n.body_md}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
