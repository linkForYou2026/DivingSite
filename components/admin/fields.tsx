"use client";

// 項目の種類ごとの入力欄と、一覧での表示
import type { Field } from "@/shared/admin-schema";
import { enumLabel, enumOptions } from "@/shared/enums";
import { formatJst, fromJstInput, toJstInput, yen } from "@/shared/format";
import { inputCls } from "./ui";

export type Opts = Record<string, { value: number; label: string }[]>;
export type FormValue = string | number | null | string[] | number[];

/** データベースの値 → 入力欄で扱う値 */
export function toForm(f: Field, v: unknown): FormValue {
  if (v === null || v === undefined) return f.type === "bool" ? Number(f.default ?? 0) : f.type === "list" || f.type === "months" ? [] : "";
  if (f.type === "list" || f.type === "months") {
    try {
      const a = JSON.parse(String(v));
      return Array.isArray(a) ? a : [];
    } catch {
      return [];
    }
  }
  return v as FormValue;
}

/** 一覧での表示 */
export function display(f: Field, v: unknown, opts: Opts): string {
  if (v === null || v === undefined || v === "") return "—";
  switch (f.type) {
    case "enum":
      return enumLabel(f.enum!, String(v));
    case "bool":
      return Number(v) ? "○" : "—";
    case "yen":
      return yen(Number(v));
    case "datetime":
      return formatJst(String(v));
    case "ref":
      return opts[f.name]?.find((o) => o.value === Number(v))?.label ?? `#${v}`;
    case "list":
    case "months":
      try {
        const a = JSON.parse(String(v)) as (string | number)[];
        return f.type === "months" ? (a.length === 12 ? "通年" : a.map((m) => m + "月").join("・")) : a.join("／");
      } catch {
        return String(v);
      }
    default: {
      const s = String(v);
      return s.length > 60 ? s.slice(0, 60) + "…" : s;
    }
  }
}

export function FieldInput({
  f,
  value,
  onChange,
  opts,
  error,
  disabled,
  site,
}: {
  f: Field;
  value: FormValue;
  onChange: (v: FormValue) => void;
  opts: Opts;
  error?: string;
  disabled?: boolean;
  site?: { text: string; adminOnly: boolean } | null; // サイトでの使われ方（バックオフィス仕様書 U-5）
}) {
  const id = "f-" + f.name;
  const ro = disabled || f.readonly;
  const describedBy = [site ? id + "-site" : "", f.help ? id + "-help" : "", error ? id + "-err" : ""].filter(Boolean).join(" ") || undefined;
  const common = { id, disabled: ro, "aria-invalid": !!error, "aria-describedby": describedBy };
  let input: React.ReactNode;

  switch (f.type) {
    case "textarea":
    case "markdown":
      input = <textarea {...common} rows={f.type === "markdown" ? 10 : 4} className={`${inputCls} ${f.type === "markdown" ? "font-mono text-sm" : ""}`} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "int":
    case "real":
      input = <input {...common} type="number" step={f.type === "real" ? "any" : 1} min={f.min} max={f.max} className={`${inputCls} max-w-48`} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "yen":
      input = (
        <span className="flex items-center gap-2">
          <input {...common} type="number" step={1} min={0} inputMode="numeric" className={`${inputCls} max-w-48 text-right`} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
          <span className="text-sm text-slate-600">円（税込）</span>
        </span>
      );
      break;
    case "bool":
      input = (
        <label className="inline-flex items-center gap-2">
          <input {...common} type="checkbox" className="h-5 w-5" checked={Number(value) === 1} onChange={(e) => onChange(e.target.checked ? 1 : 0)} />
          <span className="text-sm">{Number(value) === 1 ? "はい" : "いいえ"}</span>
        </label>
      );
      break;
    case "date":
      input = <input {...common} type="date" className={`${inputCls} max-w-56`} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "datetime":
      input = (
        <span className="flex items-center gap-2">
          <input {...common} type="datetime-local" className={`${inputCls} max-w-64`} value={toJstInput(String(value || ""))} onChange={(e) => onChange(fromJstInput(e.target.value))} />
          <span className="text-xs text-slate-500">日本時間</span>
        </span>
      );
      break;
    case "enum":
      input = (
        <select {...common} className={`${inputCls} max-w-80`} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          {!f.required && <option value="">（なし）</option>}
          {f.required && !value && <option value="">選択してください</option>}
          {enumOptions(f.enum!).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
      break;
    case "ref":
      input = (
        <select {...common} className={`${inputCls} max-w-96`} value={String(value ?? "")} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}>
          <option value="">{f.required ? "選択してください" : "（なし）"}</option>
          {(opts[f.name] || []).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
      break;
    case "list":
      input = (
        <textarea
          {...common}
          rows={4}
          className={inputCls}
          value={Array.isArray(value) ? (value as string[]).join("\n") : String(value ?? "")}
          onChange={(e) => onChange(e.target.value.split("\n"))}
        />
      );
      break;
    case "months": {
      const sel = new Set((Array.isArray(value) ? value : []).map(Number));
      input = (
        <fieldset {...common} className="flex flex-wrap gap-1.5">
          <legend className="sr-only">{f.label}</legend>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <label key={m} className={`cursor-pointer rounded border px-2 py-1 text-sm ${sel.has(m) ? "border-pro bg-pro text-white" : "border-slate-300 bg-white"}`}>
              <input
                type="checkbox"
                className="sr-only"
                checked={sel.has(m)}
                disabled={ro}
                onChange={(e) => {
                  const n = new Set(sel);
                  if (e.target.checked) n.add(m);
                  else n.delete(m);
                  onChange(Array.from(n).sort((a, b) => a - b));
                }}
              />
              {m}月
            </label>
          ))}
          <button type="button" disabled={ro} className="ml-2 text-xs text-ocean underline" onClick={() => onChange(sel.size === 12 ? [] : Array.from({ length: 12 }, (_, i) => i + 1))}>
            {sel.size === 12 ? "すべて外す" : "通年"}
          </button>
        </fieldset>
      );
      break;
    }
    case "json":
      input = <pre className="max-h-80 overflow-auto rounded-lg bg-slate-100 p-3 text-xs">{value ? JSON.stringify(JSON.parse(String(value)), null, 2) : "—"}</pre>;
      break;
    default:
      input = (
        <input
          {...common}
          type={f.type === "email" ? "email" : f.type === "url" ? "url" : "text"}
          className={inputCls}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }

  return (
    <div>
      <label htmlFor={f.type === "months" || f.type === "bool" ? undefined : id} className="mb-1 block text-sm font-bold">
        {f.label}
        {f.required && !ro && <span className="ml-1.5 rounded bg-red-700 px-1.5 text-[11px] text-white">必須</span>}
      </label>
      {input}
      {site && (
        <p id={id + "-site"} className={`mt-1 text-xs ${site.adminOnly ? "text-slate-400" : "font-bold text-ocean"}`}>
          {site.adminOnly ? site.text : `→ サイトでは：${site.text}`}
        </p>
      )}
      {f.help && <p id={id + "-help"} className="mt-1 text-xs text-slate-500">{f.help}</p>}
      {error && <p id={id + "-err"} className="mt-1 text-sm font-bold text-red-700">{error}</p>}
    </div>
  );
}
