"use client";

// BO-02 やりたいこと別ガイド（バックオフィス仕様書 9.9）
import Link from "next/link";
import { useState } from "react";
import { useAdmin } from "@/components/admin/AdminContext";
import { Card, PageTitle } from "@/components/admin/ui";
import { getTable } from "@/shared/admin-schema";
import { GUIDES } from "@/shared/site-map";

export default function Page() {
  const { can } = useAdmin();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <>
      <PageTitle>やりたいこと別ガイド</PageTitle>
      <p className="mb-4 text-sm text-slate-600">やりたいことを選ぶと、開く画面・入力すること・確認するページを順番に案内します。</p>
      <div className="space-y-2">
        {GUIDES.map((g, i) => {
          const t = g.table ? getTable(g.table) : null;
          const allowed = t ? can(t.cap) : can("settings");
          const href = t ? `/admin/t/?table=${t.name}` : "/admin/settings/";
          return (
            <Card key={g.want} className="p-0">
              <button type="button" className="flex w-full items-center gap-2 px-4 py-3 text-left font-bold text-ocean-deep" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                <span aria-hidden="true">{open === i ? "▾" : "▸"}</span>
                {g.want}
                {!allowed && <span className="ml-auto text-xs font-normal text-slate-500">オーナーの権限が必要です</span>}
              </button>
              {open === i && (
                <div className="border-t px-4 py-3 text-sm">
                  <p>
                    開く画面：
                    {allowed ? <Link href={href} className="font-bold text-ocean underline">{g.open}</Link> : <strong>{g.open}</strong>}
                  </p>
                  <ol className="mt-2 list-decimal space-y-1 pl-5">
                    {g.steps.map((s) => <li key={s}>{s}</li>)}
                  </ol>
                  <p className="mt-2">
                    確認するページ：
                    {g.check.map((c) => (
                      <a key={c.label} href={c.path} target="_blank" rel="noopener noreferrer" className="mr-3 text-ocean underline">{c.label} ↗</a>
                    ))}
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
