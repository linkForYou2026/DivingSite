// サイト全体の固定の設定と、便利な関数
// 料金・イベント・スポットなどのデータはデータベースから読み込む
//   ・即時（料金・イベント・お知らせ・受付時間）    → lib/live.ts（ページを開いたときに API から）
//   ・公開操作で反映（資格・スポット・FAQ など）  → lib/content.ts（サイトの組み立て時に）
import siteJson from "@/data/site.json";
import blogCategoriesJson from "@/data/blog-categories.json";
import { purposeCode } from "@/shared/enums";

export type Site = {
  name: string;
  shortName: string;
  tagline: string;
  catchCopy: string[];
  description: string;
  url: string;
};
/** サイト名などの初期値（データベースの設定が読めないときに使う） */
export const site = siteJson as unknown as Site;

export const blogCategories = blogCategoriesJson as { items: { id: string; label: string }[] };

export { yen } from "@/shared/format";

/** お問い合わせページへのリンク。用件（コード）・内容・イベント・メニューを選んだ状態で開く */
export function contactHref(opts: { purpose?: string; detail?: string; kind?: string; event?: number; service?: number } = {}): string {
  const p = new URLSearchParams();
  const code = purposeCode(opts.purpose);
  if (code) p.set("purpose", code);
  if (opts.detail) p.set("detail", opts.detail);
  if (opts.kind) p.set("kind", opts.kind);
  if (opts.event) p.set("event", String(opts.event));
  if (opts.service) p.set("service", String(opts.service));
  const q = p.toString();
  return "/contact/" + (q ? "?" + q : "");
}

export function monthsText(m: number[]): string {
  if (!m.length) return "—";
  if (m.length === 12) return "通年";
  return m.map((x) => x + "月").join("・");
}
