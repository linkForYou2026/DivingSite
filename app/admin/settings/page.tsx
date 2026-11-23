"use client";

// BO-80 サイト設定（owner だけ）
import { useEffect, useState } from "react";
import { apiGet, apiSend, ApiError } from "@/components/admin/api";
import { useAdmin } from "@/components/admin/AdminContext";
import { Alert, Card, PageTitle, btnPrimary, inputCls } from "@/components/admin/ui";
import { SETTING_KEYS } from "@/shared/admin-schema";

export default function Page() {
  const { can } = useAdmin();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!can("settings")) return;
    apiGet<{ values: Record<string, string | null> }>("/api/admin/settings").then((r) => {
      setValues(Object.fromEntries(SETTING_KEYS.map((k) => [k.key, r.values[k.key] ?? ""])));
      setLoaded(true);
    });
  }, [can]);

  if (!can("settings")) return <Alert>サイト設定を変更する権限がありません。</Alert>;
  if (!loaded) return <p className="text-slate-500">読み込んでいます…</p>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setErrs({});
    try {
      const r = await apiSend<{ changed: boolean }>("PUT", "/api/admin/settings", { values });
      setMsg({ kind: "ok", text: r.changed ? "保存しました" : "変更はありませんでした" });
    } catch (e) {
      const ae = e as ApiError;
      setErrs(ae.fieldErrors || {});
      setMsg({ kind: "error", text: ae.message });
    }
  };

  return (
    <>
      <PageTitle>サイト設定</PageTitle>
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      <form onSubmit={save} noValidate>
        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            {SETTING_KEYS.map((k) => (
              <div key={k.key} className={k.type === "textarea" ? "md:col-span-2" : ""}>
                <label htmlFor={"s-" + k.key} className="mb-1 block text-sm font-bold">
                  {k.label} {!k.public && <span className="ml-1 rounded bg-slate-200 px-1.5 text-[11px]">サイトには出ません</span>}
                </label>
                {k.type === "textarea" ? (
                  <textarea id={"s-" + k.key} rows={3} className={inputCls} value={values[k.key]} onChange={(e) => setValues({ ...values, [k.key]: e.target.value })} />
                ) : (
                  <input id={"s-" + k.key} type={k.type === "int" ? "number" : k.type} className={inputCls} value={values[k.key]} onChange={(e) => setValues({ ...values, [k.key]: e.target.value })} />
                )}
                {k.help && <p className="mt-1 text-xs text-slate-500">{k.help}</p>}
                {errs[k.key] && <p className="mt-1 text-sm font-bold text-red-700">{errs[k.key]}</p>}
              </div>
            ))}
          </div>
          <button className={`${btnPrimary} mt-6`}>保存する</button>
        </Card>
      </form>
    </>
  );
}
