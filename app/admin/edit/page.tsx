"use client";

// 編集画面（どのテーブルも共通）：/admin/edit/?table=services&id=3（新規は id=new）
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, apiSend, ApiError } from "@/components/admin/api";
import { useAdmin } from "@/components/admin/AdminContext";
import { FieldInput, toForm, type FormValue, type Opts } from "@/components/admin/fields";
import { AreaPreview, PlanItems } from "@/components/admin/Specials";
import { Alert, Card, PageTitle, StatusBadge, btnDanger, btnGhost, btnPrimary } from "@/components/admin/ui";
import { getTable } from "@/shared/admin-schema";
import { formatJst } from "@/shared/format";

type GetRes = { row: Record<string, unknown>; m2m?: number[]; options: Opts };

function Inner() {
  const sp = useSearchParams();
  const router = useRouter();
  const { can } = useAdmin();
  const t = getTable(sp.get("table") || "");
  const idParam = sp.get("id") || "new";
  const isNew = idParam === "new";
  const id = Number(idParam);

  const [row, setRow] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, FormValue>>({});
  const [m2m, setM2m] = useState<number[]>([]);
  const [opts, setOpts] = useState<Opts>({});
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ kind: "ok" | "error" | "info"; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!t) return;
    setMsg(null);
    if (isNew) {
      const r = await apiGet<{ options: Opts }>(`/api/admin/t/${t.name}?page=1&q=__none__`);
      setOpts(r.options);
      setRow({});
      setForm(Object.fromEntries(t.fields.map((f) => [f.name, toForm(f, f.default ?? null)])));
      setM2m([]);
    } else {
      const r = await apiGet<GetRes>(`/api/admin/t/${t.name}/${id}`);
      setOpts(r.options);
      setRow(r.row);
      setForm(Object.fromEntries(t.fields.map((f) => [f.name, toForm(f, r.row[f.name])])));
      setM2m(r.m2m || []);
    }
    setDirty(false);
    setErrs({});
  }, [t, isNew, id]);

  useEffect(() => {
    load().catch((e) => setMsg({ kind: "error", text: e.message }));
  }, [load]);

  // 保存していない変更があるときに、画面を離れる前に確認する（バックオフィス仕様書 4.2）
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const editable = useMemo(() => (t ? t.fields.filter((f) => !(f.createOnly && !isNew)) : []), [t, isNew]);

  if (!t) return <Alert>このページは見つかりません。</Alert>;
  if (!can(t.cap)) return <Alert>このデータを編集する権限がありません。</Alert>;
  if (!row) return msg ? <Alert>{msg.text}</Alert> : <p className="text-slate-500">読み込んでいます…</p>;

  const set = (name: string, v: FormValue) => {
    setForm((f) => ({ ...f, [name]: v }));
    setDirty(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setErrs({});
    const values: Record<string, unknown> = {};
    for (const f of editable) {
      if (f.readonly || f.type === "json") continue;
      values[f.name] = form[f.name];
    }
    try {
      if (isNew) {
        const r = await apiSend<{ id: number }>("POST", `/api/admin/t/${t.name}`, { values, m2m: t.m2m ? m2m : undefined });
        setDirty(false);
        router.replace(`/admin/edit/?table=${t.name}&id=${r.id}`);
        setMsg({ kind: "ok", text: "作成しました（下書き）。公開するときは「公開状態」を「公開」にして保存してください。" });
      } else {
        const r = await apiSend<{ changed: boolean }>("PUT", `/api/admin/t/${t.name}/${id}`, { values, m2m: t.m2m ? m2m : undefined, updated_at: row.updated_at });
        await load();
        setMsg({ kind: "ok", text: r.changed ? "保存しました。" + (t.reflect === "publish" ? "サイトに出すには、ダッシュボードの「サイトに反映」を押してください。" : "") : "変更はありませんでした。" });
      }
    } catch (e) {
      const ae = e as ApiError;
      setErrs(ae.fieldErrors || {});
      setMsg({ kind: "error", text: ae.message });
    } finally {
      setBusy(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const remove = async () => {
    const what = t.hasStatus ? "非表示にします（あとで「公開状態」を戻せます）" : "削除します（元に戻せません）";
    if (!confirm(`このデータを${what}。よろしいですか？`)) return;
    try {
      await apiSend("DELETE", `/api/admin/t/${t.name}/${id}`);
      setDirty(false);
      router.push(`/admin/t/?table=${t.name}`);
    } catch (e) {
      setMsg({ kind: "error", text: (e as Error).message });
    }
  };

  const title = isNew ? "新しく作る" : String(row[t.title] ?? `#${id}`);
  const readOnly = !!t.readOnly;

  return (
    <>
      <p className="mb-1 text-sm">
        <Link href={`/admin/t/?table=${t.name}`} className="text-ocean underline">← {t.label}の一覧</Link>
      </p>
      <PageTitle>
        {title}
        {!isNew && t.hasStatus && <span className="ml-3 align-middle"><StatusBadge value={String(row.status)} /></span>}
      </PageTitle>
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}

      <div className={t.special === "areaPreview" ? "grid gap-4 lg:grid-cols-[1fr_340px]" : ""}>
        <form onSubmit={save} noValidate>
          <Card>
            <div className="grid gap-4 md:grid-cols-2">
              {editable.map((f) => (
                <div key={f.name} className={["textarea", "markdown", "list", "months", "json"].includes(f.type) ? "md:col-span-2" : ""}>
                  <FieldInput f={f} value={form[f.name] ?? ""} onChange={(v) => set(f.name, v)} opts={opts} error={errs[f.name]} disabled={readOnly} />
                </div>
              ))}
              {t.m2m && (
                <fieldset className="md:col-span-2">
                  <legend className="mb-1 text-sm font-bold">{t.m2m.label}（複数選べます）</legend>
                  <div className="flex flex-wrap gap-2">
                    {(opts[t.m2m.name] || []).map((o) => (
                      <label key={o.value} className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${m2m.includes(o.value) ? "border-pro bg-pro text-white" : "bg-white"}`}>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={m2m.includes(o.value)}
                          onChange={(e) => {
                            setM2m(e.target.checked ? [...m2m, o.value] : m2m.filter((x) => x !== o.value));
                            setDirty(true);
                          }}
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            </div>
            {!readOnly && (
              <div className="mt-6 flex flex-wrap items-center gap-3 border-t pt-4">
                <button className={btnPrimary} disabled={busy}>{busy ? "保存しています…" : isNew ? "作成する" : "保存する"}</button>
                <Link href={`/admin/t/?table=${t.name}`} className={btnGhost}>一覧に戻る</Link>
                {dirty && <span className="text-sm text-amber-700">保存していない変更があります</span>}
                {!isNew && (t.hasStatus ? row.status !== "archived" : t.allowDelete) && (
                  <button type="button" className={`${btnDanger} ml-auto`} onClick={remove}>
                    {t.hasStatus ? "非表示にする" : "削除する"}
                  </button>
                )}
              </div>
            )}
            {!isNew && (
              <p className="mt-3 text-xs text-slate-500">
                最終更新：{formatJst(String(row.updated_at))}（{String(row.updated_by ?? "—")}）
              </p>
            )}
          </Card>
          {t.special === "planItems" && !isNew && <PlanItems planId={id} updatedAt={String(row.updated_at)} onSaved={() => load()} />}
          {t.special === "planItems" && isNew && <p className="mt-3 text-sm text-slate-600">内訳（費目ごとの金額）は、作成したあとに入力できます。</p>}
        </form>
        {t.special === "areaPreview" && <AreaPreview values={form as Record<string, unknown>} />}
      </div>
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
