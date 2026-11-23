// 入力チェック（バックオフィス仕様書 4.2：画面でもAPIでも同じチェックをする）
import { ENUMS } from "./enums";
import type { Field, TableDef } from "./admin-schema";

export type FieldErrors = Record<string, string>;
type Val = string | number | null;

const RE_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const RE_SLUG = /^[a-z0-9][a-z0-9-]*$/;
const RE_CODE = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;
const RE_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDate(s: string): boolean {
  if (!RE_DATE.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** 日時を「2026-11-23T12:00:00Z」（世界標準時）の形にそろえる。読めないときは null */
export function normalizeIso(s: string): string | null {
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function isSafeUrl(s: string): boolean {
  if (s.startsWith("/") && !s.startsWith("//")) return true; // サイト内のリンク
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function toNumber(v: unknown): number | null | "NaN" {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[,，\s円]/g, ""));
  return Number.isFinite(n) ? n : "NaN";
}

/** 1項目のチェックと変換。戻り値の value はデータベースにそのまま入れられる形 */
export function checkField(f: Field, raw: unknown): { value: Val; error?: string } {
  const empty = raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "") || (Array.isArray(raw) && raw.length === 0);
  if (empty) {
    if (f.type === "bool") return { value: f.default === 1 ? 1 : 0 };
    return f.required ? { value: null, error: "入力してください" } : { value: null };
  }
  switch (f.type) {
    case "text":
    case "textarea":
    case "markdown": {
      const s = String(raw).trim();
      if (s.length > 20000) return { value: null, error: "長すぎます" };
      return { value: s };
    }
    case "email": {
      const s = String(raw).trim().toLowerCase();
      return RE_EMAIL.test(s) ? { value: s } : { value: null, error: "メールアドレスの形ではありません" };
    }
    case "url": {
      const s = String(raw).trim();
      return isSafeUrl(s) ? { value: s } : { value: null, error: "https:// から始まるURL、または / から始まるサイト内のパスを入力してください" };
    }
    case "slug": {
      const s = String(raw).trim();
      return RE_SLUG.test(s) ? { value: s } : { value: null, error: "英小文字・数字・ハイフンだけで入力してください" };
    }
    case "code": {
      const s = String(raw).trim();
      return RE_CODE.test(s) ? { value: s } : { value: null, error: "英数字・ハイフン・アンダースコアだけで入力してください" };
    }
    case "int":
    case "yen":
    case "ref": {
      const n = toNumber(raw);
      if (n === "NaN" || n === null || !Number.isInteger(n)) return { value: null, error: f.type === "yen" ? "金額は整数（円）で入力してください" : "整数で入力してください" };
      if (f.type === "yen" && n < 0) return { value: null, error: "0以上で入力してください" };
      if (f.min !== undefined && n < f.min) return { value: null, error: `${f.min}以上で入力してください` };
      if (f.max !== undefined && n > f.max) return { value: null, error: `${f.max}以下で入力してください` };
      return { value: n };
    }
    case "real": {
      const n = toNumber(raw);
      if (n === "NaN" || n === null) return { value: null, error: "数値で入力してください" };
      if (f.min !== undefined && n < f.min) return { value: null, error: `${f.min}以上で入力してください` };
      if (f.max !== undefined && n > f.max) return { value: null, error: `${f.max}以下で入力してください` };
      return { value: n };
    }
    case "bool":
      return { value: raw === true || raw === 1 || raw === "1" || raw === "true" ? 1 : 0 };
    case "date": {
      const s = String(raw).trim();
      return isValidDate(s) ? { value: s } : { value: null, error: "日付（例 2026-12-01）で入力してください" };
    }
    case "datetime": {
      const iso = normalizeIso(String(raw));
      return iso ? { value: iso } : { value: null, error: "日時が読み取れません" };
    }
    case "enum": {
      const s = String(raw);
      const ok = f.enum && ENUMS[f.enum] && s in ENUMS[f.enum];
      return ok ? { value: s } : { value: null, error: "選択肢から選んでください" };
    }
    case "list": {
      const arr = Array.isArray(raw) ? raw : String(raw).split(/\r?\n/);
      const items = arr.map((x) => String(x).trim()).filter(Boolean);
      if (!items.length) return f.required ? { value: null, error: "入力してください" } : { value: null };
      return { value: JSON.stringify(items) };
    }
    case "months": {
      const arr = Array.isArray(raw) ? raw : String(raw).split(/[,、\s]+/);
      const nums = Array.from(new Set(arr.map((x) => Number(x)))).filter((n) => Number.isInteger(n) && n >= 1 && n <= 12);
      if (nums.length !== arr.filter((x) => String(x).trim() !== "").length) return { value: null, error: "1〜12 の月を選んでください" };
      return { value: nums.length ? JSON.stringify(nums.sort((a, b) => a - b)) : null };
    }
    case "json":
      return { value: null };
  }
}

/** テーブルの1行分をチェックする。mode=create では createOnly の項目も受け付ける */
export function checkRow(
  t: TableDef,
  input: Record<string, unknown>,
  mode: "create" | "update",
): { values: Record<string, Val>; errors: FieldErrors } {
  const values: Record<string, Val> = {};
  const errors: FieldErrors = {};
  for (const f of t.fields) {
    if (f.readonly) continue;
    if (f.createOnly && mode === "update") continue;
    if (mode === "update" && !(f.name in input)) continue; // 送られてこなかった項目は変更しない
    const raw = mode === "create" && !(f.name in input) ? f.default ?? null : input[f.name];
    const r = checkField(f, raw);
    if (r.error) errors[f.name] = r.error;
    else values[f.name] = r.value;
  }
  return { values, errors };
}

/** 今日の日付（日本時間）YYYY-MM-DD */
export function todayJst(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}
