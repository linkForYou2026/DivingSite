"use client";

// 講習の一覧（講習案内・申し込み）
import Link from "next/link";
import { contactHref } from "@/lib/data";
import LiveState from "./LiveState";
import { COURSE_KINDS, priceText, useServices } from "./ServiceCards";
import { asOf } from "@/shared/format";

export default function CourseTable() {
  const { items, loading, error } = useServices(COURSE_KINDS);
  if (loading || error || !items.length) return <LiveState loading={loading} error={error} empty={!items.length} emptyText="講習の案内は準備中です。" />;
  return (
    <div className="overflow-x-auto rounded-xl border border-sky-100">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr>{["講習", "日数の目安", "料金（税込）", ""].map((h) => <th key={h} className="bg-pro px-3 py-2 text-left text-white">{h}</th>)}</tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <td className="border-b border-sky-100 px-3 py-2 font-bold">
                {c.name}
                {c.includes && <span className="block text-xs font-normal text-slate-500">含まれるもの：{c.includes}</span>}
                {c.excludes && <span className="block text-xs font-normal text-slate-500">含まれないもの：{c.excludes}</span>}
              </td>
              <td className="border-b border-sky-100 px-3 py-2">{c.duration || "—"}</td>
              <td className="border-b border-sky-100 px-3 py-2">
                {priceText(c)}
                {c.is_estimate === 1 && <span className="block text-xs text-slate-500">{asOf(c.checked_on)}の目安</span>}
              </td>
              <td className="border-b border-sky-100 px-3 py-2 text-right">
                {c.accepting ? (
                  <Link href={contactHref({ purpose: c.kind === "refresh" ? "refresh" : "course", detail: `${c.name}を希望`, service: c.id })} className="btn btn-warm py-1 text-sm">申し込む</Link>
                ) : (
                  <span className="text-xs text-slate-500">受付停止中</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
