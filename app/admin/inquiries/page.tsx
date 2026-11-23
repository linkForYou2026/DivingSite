"use client";

// BO-10 問い合わせ一覧（owner だけ）
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiGet } from "@/components/admin/api";
import { useAdmin } from "@/components/admin/AdminContext";
import { Alert, Card, PageTitle, btnGhost, inputCls } from "@/components/admin/ui";
import { HANDLING_STATUS, enumLabel, enumOptions } from "@/shared/enums";
import { formatJst } from "@/shared/format";

type Row = { id: number; created_at: string; purpose: string; name: string | null; email: string | null; handling_status: string; assignee: string | null; event_title: string | null; service_name: string | null };
type Res = { rows: Row[]; total: number; page: number; pageSize: number; counts: Record<string, number> };

const STATUS_COLOR: Record<string, string> = { new: "bg-red-100 text-red-900", in_progress: "bg-amber-100 text-amber-900", waiting: "bg-sky-100 text-sky-900", done: "bg-green-100 text-green-900", spam: "bg-slate-200 text-slate-700" };

function Inner() {
  const { can } = useAdmin();
  const sp = useSearchParams();
  const router = useRouter();
  const status = sp.get("status") || "";
  const purpose = sp.get("purpose") || "";
  const q = sp.get("q") || "";
  const page = Number(sp.get("page") || 1);
  const [d, setD] = useState<Res | null>(null);
  const [err, setErr] = useState("");
  const [kw, setKw] = useState(q);
  const [csv, setCsv] = useState({ from: "", to: "", purpose: "" });

  useEffect(() => {
    if (!can("inquiries")) return;
    setD(null);
    apiGet<Res>(`/api/admin/inquiries?${new URLSearchParams({ status, purpose, q, page: String(page) })}`).then(setD).catch((e) => setErr(e.message));
  }, [status, purpose, q, page, can]);

  if (!can("inquiries")) return <Alert>問い合わせを見る権限がありません。</Alert>;
  const go = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ status, purpose, q, page: "1", ...patch });
    [...p.keys()].forEach((k) => !p.get(k) && p.delete(k));
    router.push(`/admin/inquiries/?${p}`);
  };
  const pages = d ? Math.max(1, Math.ceil(d.total / d.pageSize)) : 1;

  return (
    <>
      <PageTitle>問い合わせ</PageTitle>
      {err && <Alert>{err}</Alert>}
      <div className="mb-3 flex flex-wrap gap-2 text-sm">
        <button className={`rounded-full border px-3 py-1 ${!status ? "border-pro bg-pro text-white" : "bg-white"}`} onClick={() => go({ status: "" })}>対応が必要なもの</button>
        {Object.entries(HANDLING_STATUS).map(([k, label]) => (
          <button key={k} className={`rounded-full border px-3 py-1 ${status === k ? "border-pro bg-pro text-white" : "bg-white"}`} onClick={() => go({ status: k })}>
            {label}（{d?.counts[k] ?? 0}）
          </button>
        ))}
        <button className={`rounded-full border px-3 py-1 ${status === "all" ? "border-pro bg-pro text-white" : "bg-white"}`} onClick={() => go({ status: "all" })}>すべて</button>
      </div>
      <form className="mb-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); go({ q: kw }); }}>
        <label htmlFor="kw" className="sr-only">検索</label>
        <input id="kw" type="search" className={`${inputCls} max-w-64`} placeholder="名前・メール・内容で検索" value={kw} onChange={(e) => setKw(e.target.value)} />
        <label htmlFor="pp" className="sr-only">用件</label>
        <select id="pp" className={`${inputCls} w-auto`} value={purpose} onChange={(e) => go({ purpose: e.target.value })}>
          <option value="">用件：すべて</option>
          {enumOptions("inquiry_purpose").map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button className={btnGhost}>検索</button>
      </form>

      {!d && !err && <p className="text-slate-500">読み込んでいます…</p>}
      {d && (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-100 text-left">
              <tr><th className="px-3 py-2">受付日時</th><th className="px-3 py-2">用件</th><th className="px-3 py-2">お名前</th><th className="px-3 py-2">対応状況</th><th className="px-3 py-2">担当</th></tr>
            </thead>
            <tbody className="divide-y">
              {d.rows.map((r) => (
                <tr key={r.id} className="hover:bg-sky-50">
                  <td className="px-3 py-2 whitespace-nowrap"><Link href={`/admin/inquiries/view/?id=${r.id}`} className="text-ocean underline">{formatJst(r.created_at)}</Link></td>
                  <td className="px-3 py-2">{enumLabel("inquiry_purpose", r.purpose)}{r.event_title && <span className="block text-xs text-slate-500">{r.event_title}</span>}{r.service_name && <span className="block text-xs text-slate-500">{r.service_name}</span>}</td>
                  <td className="px-3 py-2">{r.name ?? <span className="text-slate-400">（消去済み）</span>}</td>
                  <td className="px-3 py-2"><span className={`rounded px-2 py-0.5 text-xs font-bold ${STATUS_COLOR[r.handling_status]}`}>{enumLabel("handling_status", r.handling_status)}</span></td>
                  <td className="px-3 py-2 text-xs">{r.assignee ?? "—"}</td>
                </tr>
              ))}
              {!d.rows.length && <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500">問い合わせはありません</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <nav aria-label="ページ送り" className="mt-3 flex items-center gap-2 text-sm">
          <button className={btnGhost} disabled={page <= 1} onClick={() => go({ page: String(page - 1) })}>前へ</button>
          <span>{page} / {pages}</span>
          <button className={btnGhost} disabled={page >= pages} onClick={() => go({ page: String(page + 1) })}>次へ</button>
        </nav>
      )}

      <Card title="CSV で書き出す" className="mt-6">
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label>開始日<input type="date" className={inputCls} value={csv.from} onChange={(e) => setCsv({ ...csv, from: e.target.value })} /></label>
          <label>終了日<input type="date" className={inputCls} value={csv.to} onChange={(e) => setCsv({ ...csv, to: e.target.value })} /></label>
          <label>用件
            <select className={inputCls} value={csv.purpose} onChange={(e) => setCsv({ ...csv, purpose: e.target.value })}>
              <option value="">すべて</option>
              {enumOptions("inquiry_purpose").map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <a className={btnGhost} href={`/api/admin/inquiries/csv?${new URLSearchParams(csv)}`}>書き出す</a>
        </div>
        <p className="mt-2 text-xs text-slate-500">個人情報を含みます。書き出したことは操作履歴に残ります。</p>
      </Card>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
