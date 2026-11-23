// data/ フォルダの JSON を読み込んで、型をつけて使えるようにするファイル
import siteJson from "@/data/site.json";
import licensesJson from "@/data/licenses.json";
import spotsJson from "@/data/spots.json";
import costJson from "@/data/cost.json";
import faqJson from "@/data/faq.json";
import worksJson from "@/data/works.json";
import eventsJson from "@/data/events.json";
import coursesJson from "@/data/courses.json";
import voicesJson from "@/data/voices.json";
import mediaJson from "@/data/media.json";
import blogCategoriesJson from "@/data/blog-categories.json";

/* ---------- サイト設定 ---------- */
export type Sns = { id: string; label: string; short: string; color: string; url: string };
export type Site = {
  name: string;
  shortName: string;
  tagline: string;
  catchCopy: string[];
  description: string;
  url: string;
  contact: { email: string; tel: string; hours: string; replyGuide: string };
  contactForm: {
    googleFormUrl: string;
    entryPurpose: string;
    entryKind: string;
    entryDetail: string;
    height: number;
  };
  purposes: string[];
  sns: Sns[];
  operator: { name: string; note: string };
};
export const site = siteJson as Site;

/* ---------- 資格（付録A） ---------- */
export type LicenseStep = {
  id: string;
  short: string;
  nameJa: string;
  nameEn: string;
  abbr: string;
  category: "leisure" | "pro";
  optional: boolean;
  one: string;
  summary: string;
  canDo: string[];
  requirements: string[];
  next: string | null;
};
export type Agency = {
  id: string;
  name: string;
  skip: { from: string; to: string; label: string } | null;
  notes: string[];
  steps: LicenseStep[];
};
export type Licenses = {
  defaultAgency: string;
  meta: { lastChecked: string };
  agencies: Agency[];
  agencyProfiles: { name: string; fullName: string; origin: string; feature: string }[];
  equivalence: { level: string; padi: string; ssi: string; naui: string; cmas: string }[];
  shops: { topCount: number; note: string; list: [string, number][] };
  sources: [string, string][];
};
export const licenses = licensesJson as unknown as Licenses;

/* ---------- スポット（F-04） ---------- */
export type Spot = {
  id: string;
  name: string;
  region: string;
  area: string;
  purposes: string[];
  level: string;
  cost: number;
  months: number[];
  desc: string;
  color: [string, string];
  image: string;
  imageAlt: string;
  popularRank: number | null;
};
export type SpotsData = {
  meta: { lastChecked: string; sample: boolean };
  purposes: string[];
  levels: { id: string; label: string; rank: number }[];
  budgets: { max: number; label: string }[];
  spots: Spot[];
};
export const spotsData = spotsJson as unknown as SpotsData;

/* ---------- 費用（F-12） ---------- */
export type CostKey = "tour" | "rental" | "travel" | "stay" | "other";
export type CostBreakdown = Record<CostKey, number>;
export type CostData = {
  meta: { lastChecked: string; sample: boolean };
  items: { key: CostKey; label: string; color: string }[];
  plans: { name: string; sub: string; purpose: string; cost: CostBreakdown; memo: string }[];
  areas: {
    id: string;
    label: string;
    divePerDay: number;
    rentalPerDay: number;
    travel: number;
    stayPerNight: number;
    otherPerDay: number;
    flight: boolean;
  }[];
  days: { d: number; label: string }[];
  range: number;
};
export const costData = costJson as unknown as CostData;

/* ---------- その他 ---------- */
export type Faq = { category: string; q: string; a: string };
export const faq = faqJson as { categories: string[]; items: Faq[] };

export type Work = { id: string; name: string; description: string; price: string; icon: string };
export const works = worksJson as { items: Work[]; achievements: { title: string; image: string; alt: string }[] };

export type DiveEvent = {
  id: string;
  date: string;
  title: string;
  place: string;
  level: string;
  price: string;
  capacity: string;
};
export const events = eventsJson as { calendarEmbedUrl: string; items: DiveEvent[] };

export const courses = coursesJson as { items: { name: string; days: string; price: string }[] };
export const voices = voicesJson as { items: { text: string; who: string }[] };

export type Media = {
  youtube: { playlistId: string; videoIds: string[] };
  instagram: { posts: string[] };
  tiktok: { posts: string[] };
  facebook: { posts: string[] };
};
export const media = mediaJson as unknown as Media;

export const blogCategories = blogCategoriesJson as { items: { id: string; label: string }[] };

/* ---------- 便利な関数 ---------- */
export function yen(n: number): string {
  return n.toLocaleString("ja-JP") + "円";
}

/** お問い合わせページへのリンク（用件などを選択済みにする） */
export function contactHref(opts: { purpose?: string; kind?: string; detail?: string } = {}): string {
  const p = new URLSearchParams();
  if (opts.purpose) p.set("purpose", opts.purpose);
  if (opts.kind) p.set("kind", opts.kind);
  if (opts.detail) p.set("detail", opts.detail);
  const q = p.toString();
  return "/contact/" + (q ? "?" + q : "");
}

export function monthsText(m: number[]): string {
  if (m.length === 12) return "通年";
  return m.map((x) => x + "月").join("・");
}
