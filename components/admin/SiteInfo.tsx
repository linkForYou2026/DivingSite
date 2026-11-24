"use client";

// 編集画面の上部に出す「表示先の帯」と「サイト表示の状態」（バックオフィス仕様書 9.4・9.5）
import { getTable } from "@/shared/admin-schema";
import { placementsFor, REFLECT_TEXT } from "@/shared/site-map";
import { visibility, type VisCtx } from "@/shared/visibility";

type Row = Record<string, unknown>;

const TONE = {
  ok: "border-green-300 bg-green-50 text-green-900",
  ng: "border-slate-300 bg-slate-100 text-slate-800",
  wait: "border-amber-300 bg-amber-50 text-amber-900",
  none: "border-slate-200 bg-white text-slate-600",
};
const MARK = { ok: "✓", ng: "✕", wait: "…", none: "—" };

/** 表示先の帯：今の入力内容で、どのページのどの部分に出るか */
export function SiteBand({ table, values }: { table: string; values: Row }) {
  const t = getTable(table);
  if (!t) return null;
  const ps = placementsFor(table, values);
  if (!ps.length) {
    return (
      <div className="mb-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        {t.reflect === "none" ? "このデータはサイトには表示されません（管理用）" : "このデータを表示するページは、まだありません（フェーズ2で作成予定）"}
      </div>
    );
  }
  const links = Array.from(new Map(ps.map((p) => [p.rowPath && values.slug ? p.rowPath(values) : p.path, p])).entries());
  return (
    <div className="mb-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm">
      <p className="font-bold text-ocean-deep">表示されるページ</p>
      <ul className="mt-1 space-y-0.5">
        {ps.map((p, i) => (
          <li key={i}>
            {p.page} ＞ {p.part}
            {p.limit ? <span className="text-slate-500">（先頭{p.limit}件）</span> : null}
          </li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-slate-600">反映：{REFLECT_TEXT[t.reflect]}</span>
        {links.map(([href, p]) => (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="rounded-md border border-sky-300 bg-white px-2 py-0.5 text-ocean hover:bg-sky-100">
            {p.page}をサイトで見る ↗
          </a>
        ))}
      </div>
    </div>
  );
}

/** サイト表示の状態（保存済みの内容で判定） */
export function VisibilityBox({ table, row, ctx }: { table: string; row: Row; ctx: VisCtx | null }) {
  const v = visibility(table, row, ctx);
  if (v.tone === "none") return null;
  return (
    <div className={`mb-3 rounded-xl border px-4 py-3 text-sm ${TONE[v.tone]}`} role="status">
      <p className="font-bold">
        <span aria-hidden="true">{MARK[v.tone]} </span>
        {v.text}
      </p>
      {v.fix && <p className="mt-0.5">直し方：{v.fix}</p>}
      <p className="mt-0.5 text-xs opacity-75">保存済みの内容での判定です</p>
    </div>
  );
}

export function VisibilityCell({ table, row, ctx }: { table: string; row: Row; ctx: VisCtx | null }) {
  const v = visibility(table, row, ctx);
  const color = v.tone === "ok" ? "text-green-800" : v.tone === "wait" ? "text-amber-800" : "text-slate-500";
  return (
    <span className={`text-xs font-bold ${color}`} title={[v.text, v.fix && `直し方：${v.fix}`].filter(Boolean).join("\n")}>
      {v.short}
    </span>
  );
}
