"use client";

// 一覧画面（どのテーブルも共通）：/admin/t/?table=services
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiGet } from "@/components/admin/api";
import { useAdmin } from "@/components/admin/AdminContext";
import { display, type Opts } from "@/components/admin/fields";
import { Alert, PageTitle, StatusBadge, btnGhost, btnPrimary, inputCls } from "@/components/admin/ui";
import { getTable } from "@/shared/admin-schema";

type ListRes = { rows: Record<string, unknown>[]; total: number; page: number; pageSize: number; options: Opts };

const REFLECT_NOTE = {
  instant: "保存するとすぐサイトに出ます（最大1分ほど遅れることがあります）。",
  publish: "保存後、ダッシュボードの「サイトに反映」を押すとサイトに出ます。",
  none: "",
};

function Inner() {
  const sp = useSearchParams();
  const router = useRouter();
  const { can } = useAdmin();
  const tableName = sp.get("table") || "";
  const t = getTable(tableName);
  const q = sp.get("q") || "";
  const status = sp.get("status") || "";
  const page = Number(sp.get("page") || 1);
  const [data, setData] = useState<ListRes | null>(null);
  const [err, setErr] = useState("");
  const [kw, setKw] = useState(q);

  useEffect(() => setKw(q), [q]);
  useEffect(() => {
    if (!t) return;
    setData(null);
    setErr("");
    const p = new URLSearchParams({ q, status, page: String(page) });
    apiGet<ListRes>(`/api/admin/t/${t.name}?${p}`).then(setData).catch((e) => setErr(e.message));
  }, [t, q, status, page]);

  if (!t) return <Alert>このページは見つかりません。</Alert>;
  if (!can(t.cap)) return <Alert>このデータを見る権限がありません。</Alert>;

  const go = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ table: t.name, q, status, page: "1", ...patch });
    [...p.keys()].forEach((k) => !p.get(k) && p.delete(k));
    router.push(`/admin/t/?${p}`);
  };
  const cols = t.fields.filter((f) => f.list);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <PageTitle
        actions={
          !t.readOnly &&
          t.allowCreate !== false && (
            <Link href={`/admin/edit/?table=${t.name}&id=new`} className={btnPrimary}>
              ＋ 新しく作る
            </Link>
          )
        }
      >
        {t.label}
      </PageTitle>
      {REFLECT_NOTE[t.reflect] && <p className="mb-3 text-sm text-slate-600">{REFLECT_NOTE[t.reflect]}</p>}

      <form
        className="mb-3 flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          go({ q: kw });
        }}
      >
        <label htmlFor="kw" className="sr-only">検索</label>
        <input id="kw" type="search" placeholder="名前などで検索" className={`${inputCls} max-w-64`} value={kw} onChange={(e) => setKw(e.target.value)} />
        <button className={btnGhost}>検索</button>
        {t.hasStatus && (
          <>
            <label htmlFor="st" className="ml-2 text-sm">公開状態</label>
            <select id="st" className={`${inputCls} w-auto`} value={status} onChange={(e) => go({ status: e.target.value })}>
              <option value="">下書き・公開</option>
              <option value="draft">下書きだけ</option>
              <option value="published">公開だけ</option>
              <option value="archived">非表示だけ</option>
              <option value="all">すべて</option>
            </select>
          </>
        )}
      </form>

      {err && <Alert>{err}</Alert>}
      {!data && !err && <p className="text-slate-500">読み込んでいます…</p>}
      {data && (
        <>
          <p className="mb-2 text-sm text-slate-600">{data.total}件</p>
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  {cols.map((c) => <th key={c.name} className="whitespace-nowrap px-3 py-2">{c.label}</th>)}
                  <th className="px-3 py-2"><span className="sr-only">操作</span></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.rows.map((r) => (
                  <tr key={String(r.id)} className="hover:bg-sky-50">
                    {cols.map((c) => (
                      <td key={c.name} className={`px-3 py-2 ${c.type === "yen" ? "text-right" : ""}`}>
                        {c.name === "status" ? <StatusBadge value={String(r.status)} /> : display(c, r[c.name], data.options)}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right">
                      <Link href={`/admin/edit/?table=${t.name}&id=${r.id}`} className="whitespace-nowrap text-ocean underline">
                        {t.readOnly ? "詳細" : "編集"}
                      </Link>
                    </td>
                  </tr>
                ))}
                {!data.rows.length && (
                  <tr><td colSpan={cols.length + 1} className="px-3 py-6 text-center text-slate-500">データがありません</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <nav aria-label="ページ送り" className="mt-3 flex items-center gap-2 text-sm">
              <button className={btnGhost} disabled={page <= 1} onClick={() => go({ page: String(page - 1) })}>前へ</button>
              <span>{page} / {pages}</span>
              <button className={btnGhost} disabled={page >= pages} onClick={() => go({ page: String(page + 1) })}>次へ</button>
            </nav>
          )}
        </>
      )}
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
