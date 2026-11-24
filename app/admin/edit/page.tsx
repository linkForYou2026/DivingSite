"use client";

// 編集画面（どのテーブルも共通）：/admin/edit/?table=services&id=3（新規は id=new）
// バックオフィス仕様書 9.4：表示先の帯・サイト表示の状態・項目ごとのサイトでの使われ方・プレビュー・保存ボタン2つ
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiGet, apiSend, ApiError } from "@/components/admin/api";
import { useAdmin } from "@/components/admin/AdminContext";
import { FieldInput, toForm, type FormValue, type Opts } from "@/components/admin/fields";
import { AreaPreview, PlanItems } from "@/components/admin/Specials";
import { SiteBand, VisibilityBox } from "@/components/admin/SiteInfo";
import Preview, { PREVIEW_TABLES } from "@/components/admin/Preview";
import { Alert, Card, PageTitle, StatusBadge, btnDanger, btnGhost, btnPrimary } from "@/components/admin/ui";
import { getTable } from "@/shared/admin-schema";
import { ADMIN_ONLY_TEXT, FIELD_SITE } from "@/shared/field-site";
import { formatJst } from "@/shared/format";
import { allPlacementsFor, placementsFor } from "@/shared/site-map";
import type { VisCtx } from "@/shared/visibility";

type GetRes = { row: Record<string, unknown>; m2m?: number[]; options: Opts; vctx: VisCtx };
type Msg = { kind: "ok" | "error" | "info"; text: string; links?: { label: string; href: string; external?: boolean }[] };

function Inner() {
  const sp = useSearchParams();
  const router = useRouter();
  const { can } = useAdmin();
  const t = getTable(sp.get("table") || "");
  const idParam = sp.get("id") || "new";
  const isNew = idParam === "new";
  const id = Number(idParam);

  const [row, setRow] = useState<Record<string, unknown> | null>(null);
  const [vctx, setVctx] = useState<VisCtx | null>(null);
  const [form, setForm] = useState<Record<string, FormValue>>({});
  const [m2m, setM2m] = useState<number[]>([]);
  const [opts, setOpts] = useState<Opts>({});
  const [planAmounts, setPlanAmounts] = useState<Record<string, string>>({});
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<Msg | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const keepMsg = useRef(false); // 新規作成の直後は、画面が切り替わっても保存の知らせを残す

  const load = useCallback(async () => {
    if (!t) return;
    if (isNew) {
      const r = await apiGet<{ options: Opts; vctx: VisCtx }>(`/api/admin/t/${t.name}?page=1&q=__none__`);
      setOpts(r.options);
      setVctx(r.vctx);
      setRow({});
      setForm(Object.fromEntries(t.fields.map((f) => [f.name, toForm(f, f.default ?? null)])));
      setM2m([]);
    } else {
      const r = await apiGet<GetRes>(`/api/admin/t/${t.name}/${id}`);
      setOpts(r.options);
      setVctx(r.vctx);
      setRow(r.row);
      setForm(Object.fromEntries(t.fields.map((f) => [f.name, toForm(f, r.row[f.name])])));
      setM2m(r.m2m || []);
    }
    setDirty(false);
    setErrs({});
  }, [t, isNew, id]);

  useEffect(() => {
    if (!keepMsg.current) setMsg(null);
    keepMsg.current = false;
    load().catch((e) => setMsg({ kind: "error", text: e.message }));
  }, [load]);

  // 保存していない変更があるときに、画面を離れる前に確認する
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  // 公開状態は「下書きで保存」「公開して保存」のボタンで決めるので、入力欄には出さない
  const editable = useMemo(
    () => (t ? t.fields.filter((f) => !(f.createOnly && !isNew) && !(t.hasStatus && f.name === "status")) : []),
    [t, isNew],
  );

  if (!t) return <Alert>このページは見つかりません。</Alert>;
  if (!can(t.cap)) return <Alert>このデータを編集する権限がありません。</Alert>;
  if (!row) return msg ? <Alert>{msg.text}</Alert> : <p className="text-slate-500">読み込んでいます…</p>;

  const set = (name: string, v: FormValue) => {
    setForm((f) => ({ ...f, [name]: v }));
    setDirty(true);
  };
  const hasPlacements = allPlacementsFor(t.name).length > 0;
  const siteText = (name: string) => {
    if (!hasPlacements) return null;
    const text = FIELD_SITE[t.name]?.[name];
    return text ? { text, adminOnly: false } : { text: ADMIN_ONLY_TEXT, adminOnly: true };
  };

  /** 保存後の知らせ（バックオフィス仕様書 9.4「保存後の知らせ」） */
  const afterSaveMsg = (status: string | undefined, changed: boolean): Msg => {
    if (!changed) return { kind: "info", text: "変更はありませんでした。" };
    const ps = placementsFor(t.name, form as Record<string, unknown>);
    const pages = Array.from(new Set(ps.map((p) => p.page)));
    const firstPath = ps[0]?.rowPath && form.slug ? ps[0].rowPath(form as Record<string, unknown>) : ps[0]?.path;
    if (!ps.length) return { kind: "ok", text: "保存しました。" };
    if (t.hasStatus && status !== "published") return { kind: "ok", text: "下書きで保存しました（サイトには出ません）。公開するときは「公開して保存」を押してください。" };
    if (t.reflect === "publish") {
      return {
        kind: "ok",
        text: `保存しました。「サイトに反映」を押すと『${pages.join("』『")}』に表示されます。`,
        links: can("deploy") ? [{ label: "今すぐ反映（ダッシュボード）", href: "/admin/" }] : [],
      };
    }
    return {
      kind: "ok",
      text: `保存しました。約1分後に『${pages.join("』『")}』に表示されます。`,
      links: firstPath ? [{ label: "サイトで確認 ↗", href: firstPath, external: true }] : [],
    };
  };

  const save = async (status?: "draft" | "published") => {
    setBusy(true);
    setMsg(null);
    setErrs({});
    const values: Record<string, unknown> = {};
    for (const f of editable) {
      if (f.readonly || f.type === "json") continue;
      values[f.name] = form[f.name];
    }
    if (t.hasStatus && status) values.status = status;
    try {
      if (isNew) {
        const r = await apiSend<{ id: number }>("POST", `/api/admin/t/${t.name}`, { values, m2m: t.m2m ? m2m : undefined });
        setDirty(false);
        keepMsg.current = true;
        router.replace(`/admin/edit/?table=${t.name}&id=${r.id}`);
        setMsg(afterSaveMsg(status, true));
      } else {
        const r = await apiSend<{ changed: boolean }>("PUT", `/api/admin/t/${t.name}/${id}`, { values, m2m: t.m2m ? m2m : undefined, updated_at: row.updated_at });
        await load();
        setMsg(afterSaveMsg(t.hasStatus ? status : undefined, r.changed));
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
    const what = t.hasStatus ? "非表示にします（サイトから消えます。あとで「公開して保存」で戻せます）" : "削除します（元に戻せません）";
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
  const curStatus = isNew ? "draft" : String(row.status ?? "");
  const hasPreview = PREVIEW_TABLES.includes(t.name) || t.special === "areaPreview";
  const formValues = { ...(row as Record<string, unknown>), ...(form as Record<string, unknown>) };

  return (
    <>
      <p className="mb-1 text-sm">
        <Link href={`/admin/t/?table=${t.name}`} className="text-ocean underline">← {t.label}の一覧</Link>
      </p>
      <PageTitle>
        <span className="text-base font-normal text-slate-500">{t.label} ＞ </span>
        {title}
      </PageTitle>
      {msg && (
        <Alert kind={msg.kind}>
          {msg.text}
          {msg.links?.map((l) =>
            l.external ? (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="ml-2 font-bold underline">{l.label}</a>
            ) : (
              <Link key={l.href} href={l.href} className="ml-2 font-bold underline">{l.label}</Link>
            ),
          )}
        </Alert>
      )}
      {t.note && <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">{t.note}</p>}
      <SiteBand table={t.name} values={formValues} />
      {!isNew && <VisibilityBox table={t.name} row={row} ctx={vctx} />}

      <div className={hasPreview ? "grid gap-4 lg:grid-cols-[1fr_360px]" : ""}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save(t.hasStatus ? (curStatus === "published" ? "published" : "draft") : undefined);
          }}
          noValidate
        >
          <Card>
            <div className="grid gap-4 md:grid-cols-2">
              {editable.map((f) => (
                <div key={f.name} className={["textarea", "markdown", "list", "months", "json"].includes(f.type) ? "md:col-span-2" : ""}>
                  <FieldInput f={f} value={form[f.name] ?? ""} onChange={(v) => set(f.name, v)} opts={opts} error={errs[f.name]} disabled={readOnly} site={siteText(f.name)} />
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
                  {FIELD_SITE[t.name]?.[t.m2m.name] && <p className="mt-1 text-xs font-bold text-ocean">→ サイトでは：{FIELD_SITE[t.name][t.m2m.name]}</p>}
                </fieldset>
              )}
            </div>

            {!readOnly && (
              <div className="mt-6 flex flex-wrap items-center gap-3 border-t pt-4">
                {t.hasStatus ? (
                  <>
                    <span className="text-sm">今の公開状態：<StatusBadge value={curStatus} /></span>
                    <button type="button" className={btnGhost} disabled={busy} onClick={() => save("draft")}>
                      {curStatus === "published" ? "下書きに戻して保存" : "下書きで保存"}
                    </button>
                    <button type="button" className={btnPrimary} disabled={busy} onClick={() => save("published")}>
                      {busy ? "保存しています…" : "公開して保存"}
                    </button>
                  </>
                ) : (
                  <button className={btnPrimary} disabled={busy}>{busy ? "保存しています…" : isNew ? "作成する" : "保存する"}</button>
                )}
                <Link href={`/admin/t/?table=${t.name}`} className={btnGhost}>一覧に戻る</Link>
                {dirty && <span className="text-sm text-amber-700">保存していない変更があります</span>}
                {!isNew && (t.hasStatus ? curStatus !== "archived" : t.allowDelete) && (
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
          {t.special === "planItems" && !isNew && (
            <PlanItems planId={id} updatedAt={String(row.updated_at)} onSaved={() => load()} amounts={planAmounts} setAmounts={setPlanAmounts} />
          )}
          {t.special === "planItems" && isNew && <p className="mt-3 text-sm text-slate-600">内訳（費目ごとの金額）は、作成したあとに入力できます。</p>}
        </form>
        {hasPreview && (
          <div className="space-y-4">
            {t.special === "areaPreview" ? (
              <AreaPreview values={form as Record<string, unknown>} />
            ) : (
              <Preview table={t.name} v={form as Record<string, unknown>} opts={opts} m2m={m2m} planAmounts={planAmounts} />
            )}
          </div>
        )}
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
