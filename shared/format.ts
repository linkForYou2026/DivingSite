// 日時・金額の表示（日本時間で表示し、保存は世界標準時：バックオフィス仕様書 4.5）

export function yen(n: number | null | undefined): string {
  if (n === null || n === undefined) return "";
  return Math.round(n).toLocaleString("ja-JP") + "円";
}

/** 世界標準時の日時 → 「2026/11/23 21:00」（日本時間） */
export function formatJst(iso: string | null | undefined, withTime = true): string {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  if (isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getUTCFullYear()}/${p(d.getUTCMonth() + 1)}/${p(d.getUTCDate())}`;
  return withTime ? `${date} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}` : date;
}

/** 世界標準時 → 入力欄（datetime-local）用の日本時間「2026-11-23T21:00」 */
export function toJstInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16);
}

/** 入力欄の日本時間 → 世界標準時 ISO */
export function fromJstInput(v: string): string {
  if (!v) return "";
  const d = new Date(v + ":00+09:00");
  return isNaN(d.getTime()) ? "" : d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** 「2026-11-01」→「2026年11月時点」 */
export function asOf(date: string | null | undefined): string {
  if (!date) return "";
  const [y, m] = date.split("-");
  return `${y}年${Number(m)}月時点`;
}
