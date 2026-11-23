// 「公開操作で反映」のデータ（資格・スポット・FAQ・参加者の声・動画など）を、サイトの組み立て時に読み込む
// （データモデル定義書 1.2・6.2）
//
// 組み立て（npm run build）のときに、公開中のサイトの /api/export からデータベースの内容を受け取り、
// ページの文章として書き出す。検索エンジンに読まれるようにするため。
//
// 必要な環境変数（Cloudflare Pages の「変数とシークレット」に設定）
//   EXPORT_TOKEN        書き出しAPIの合言葉（Functions 側と同じ値）
//   CONTENT_API_ORIGIN  データを取りに行くサイトのアドレス（省略時 https://diving-site.pages.dev）
//
// 受け取れなかったとき（初回・パソコンでの確認など）は、資格ガイドと FAQ だけ data/ の JSON を使い、
// それ以外は「準備中」と表示する。
import licensesJson from "@/data/licenses.json";
import faqJson from "@/data/faq.json";
import siteJson from "@/data/site.json";
import { DIVE_LEVEL, FAQ_CATEGORY, REGION } from "@/shared/enums";
import { markdownToHtml } from "./blog";

/* ---------- 書き出しAPIの形 ---------- */
type Row = Record<string, unknown>;
type ExportData = {
  agencies: Row[];
  licenses: Row[];
  equivalences: Row[];
  spots: Row[];
  spotPurposes: { spot_id: number; purpose_id: number }[];
  purposes: Row[];
  creatures: Row[];
  spotCreatures: Row[];
  faqs: Row[];
  testimonials: Row[];
  embeds: Row[];
  communityLinks: Row[];
  gearItems: Row[];
  settings: Record<string, string | null>;
};

let cache: Promise<ExportData | null> | null = null;
// 組み立てのたびに最新を取りに行くための目印（静的書き出しでは cache: "no-store" が使えないため）
const BUILD_STAMP = Date.now().toString(36);

async function fetchExport(): Promise<ExportData | null> {
  const token = process.env.EXPORT_TOKEN;
  const origin = (process.env.CONTENT_API_ORIGIN || "https://diving-site.pages.dev").replace(/\/$/, "");
  if (!token) {
    console.warn("[content] EXPORT_TOKEN がないため、データベースの内容を読み込みません（data/ の JSON を使います）");
    return null;
  }
  try {
    const res = await fetch(`${origin}/api/export?b=${BUILD_STAMP}`, { headers: { Authorization: `Bearer ${token}` }, cache: "force-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as ExportData;
    console.log(`[content] ${origin} からデータを読み込みました（スポット ${data.spots.length}件、資格 ${data.licenses.length}件）`);
    return data;
  } catch (e) {
    if (process.env.REQUIRE_CONTENT === "1") throw new Error(`[content] データを読み込めませんでした: ${(e as Error).message}`);
    console.warn(`[content] データを読み込めませんでした（${(e as Error).message}）。data/ の JSON を使います`);
    return null;
  }
}

function load(): Promise<ExportData | null> {
  if (!cache) cache = fetchExport();
  return cache;
}

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const arr = <T = string>(v: unknown): T[] => {
  if (Array.isArray(v)) return v as T[];
  try {
    const a = JSON.parse(String(v ?? "[]"));
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
};

/* ---------- サイト設定（サイト名・キャッチコピー） ---------- */
export type SiteText = { name: string; catchCopy: string[] };
export async function getSiteText(): Promise<SiteText> {
  const d = await load();
  const name = d?.settings.site_name || siteJson.name;
  const cc = d?.settings.catch_copy;
  return { name, catchCopy: cc ? cc.split(/\r?\n|\\n/) : siteJson.catchCopy };
}

/* ---------- 資格（F-01） ---------- */
export type LicenseStepView = {
  id: string;
  nameJa: string;
  nameEn: string;
  abbr: string;
  category: "leisure" | "pro";
  optional: boolean;
  summary: string;
  canDo: string[];
  requirements: string[];
  note: string;
  next: string | null;
};
export type AgencyView = { id: string; name: string; steps: LicenseStepView[]; notes: string[] };
export type LicensesView = {
  defaultAgency: string;
  lastChecked: string;
  agencies: AgencyView[];
  profiles: { name: string; fullName: string; origin: string; feature: string; url: string }[];
  equivalence: { headers: string[]; rows: { level: string; cells: string[] }[] };
  shops: { name: string; count: number; source: string }[];
  sources: [string, string][];
  fromDb: boolean;
};

export async function getLicenses(): Promise<LicensesView> {
  const d = await load();
  if (!d || !d.licenses.length) {
    const L = licensesJson as unknown as {
      defaultAgency: string;
      meta: { lastChecked: string };
      agencies: { id: string; name: string; notes: string[]; steps: { id: string; nameJa: string; nameEn: string; abbr: string; category: "leisure" | "pro"; optional: boolean; summary: string; canDo: string[]; requirements: string[]; next: string | null }[] }[];
      agencyProfiles: { name: string; fullName: string; origin: string; feature: string }[];
      equivalence: { level: string; padi: string; ssi: string; naui: string; cmas: string }[];
      shops: { list: [string, number][]; note: string };
      sources: [string, string][];
    };
    return {
      defaultAgency: L.defaultAgency,
      lastChecked: L.meta.lastChecked,
      agencies: L.agencies.map((a) => ({ id: a.id, name: a.name, notes: a.notes, steps: a.steps.map((s) => ({ ...s, note: "" })) })),
      profiles: L.agencyProfiles.map((p) => ({ ...p, url: "" })),
      equivalence: { headers: ["PADI", "SSI", "NAUI", "CMAS"], rows: L.equivalence.map((r) => ({ level: r.level, cells: [r.padi, r.ssi, r.naui, r.cmas] })) },
      shops: L.shops.list.map(([name, count]) => ({ name, count, source: L.shops.note })),
      sources: L.sources,
      fromDb: false,
    };
  }
  const agencyById = new Map(d.agencies.map((a) => [Number(a.id), a]));
  const licById = new Map(d.licenses.map((l) => [Number(l.id), l]));
  const tabs = d.agencies.filter((a) => Number(a.show_tab) === 1);
  const agencies: AgencyView[] = tabs
    .map((a) => {
      const steps = d.licenses
        .filter((l) => Number(l.agency_id) === Number(a.id))
        .map<LicenseStepView>((l) => ({
          id: str(l.code),
          nameJa: str(l.name_ja),
          nameEn: str(l.name_en),
          abbr: str(l.abbr),
          category: l.category === "pro" ? "pro" : "leisure",
          optional: Number(l.is_optional) === 1,
          summary: str(l.summary),
          canDo: arr(l.can_do),
          requirements: arr(l.requirements),
          note: str(l.note),
          next: l.next_license_id ? str(licById.get(Number(l.next_license_id))?.code) || null : null,
        }));
      return { id: str(a.code), name: str(a.name), steps, notes: steps.map((s) => s.note).filter(Boolean) };
    })
    .filter((a) => a.steps.length > 0);

  // 対応表：レベルごとに1行、団体ごとに1列
  const eqAgencies = Array.from(new Set(d.equivalences.map((e) => Number(e.agency_id)))).sort(
    (x, y) => Number(agencyById.get(x)?.sort_order ?? 0) - Number(agencyById.get(y)?.sort_order ?? 0),
  );
  const levels = new Map<number, { level: string; cells: string[] }>();
  for (const e of d.equivalences) {
    const lo = Number(e.level_order);
    if (!levels.has(lo)) levels.set(lo, { level: str(e.level_name), cells: eqAgencies.map(() => "－") });
    const lic = e.license_id ? licById.get(Number(e.license_id)) : undefined;
    levels.get(lo)!.cells[eqAgencies.indexOf(Number(e.agency_id))] = str(e.label) || str(lic?.name_ja) || "－";
  }

  const checked = d.licenses.map((l) => str(l.checked_on)).sort().pop() || "";
  return {
    defaultAgency: str(tabs[0]?.code) || "padi",
    lastChecked: checked,
    agencies,
    profiles: d.agencies.map((a) => ({ name: str(a.name), fullName: str(a.full_name), origin: str(a.origin), feature: str(a.feature), url: str(a.official_url) })),
    equivalence: { headers: eqAgencies.map((id) => str(agencyById.get(id)?.name)), rows: Array.from(levels.entries()).sort((a, b) => a[0] - b[0]).map(([, v]) => v) },
    shops: d.agencies
      .filter((a) => a.jp_shop_count !== null && a.jp_shop_count !== undefined)
      .map((a) => ({ name: str(a.name), count: Number(a.jp_shop_count), source: str(a.jp_shop_count_source) }))
      .sort((x, y) => y.count - x.count),
    sources: (licensesJson as unknown as { sources: [string, string][] }).sources,
    fromDb: true,
  };
}

/* ---------- スポット（F-04） ---------- */
export type SpotView = {
  slug: string;
  name: string;
  regionLabel: string;
  area: string;
  purposes: string[];
  level: string; // dive_level のコード
  levelLabel: string;
  cost: number | null;
  costNote: string;
  months: number[];
  summary: string;
  bodyHtml: string;
  access: string;
  isEstimate: boolean;
  checkedOn: string;
  color: [string, string];
  rank: number;
};
const COLORS: [string, string][] = [
  ["#00acc1", "#0d47a1"],
  ["#26c6da", "#01579b"],
  ["#4dd0e1", "#006064"],
  ["#1e88e5", "#0d1b4a"],
  ["#66bb6a", "#00695c"],
  ["#29b6f6", "#002f6c"],
  ["#5c6bc0", "#1a237e"],
  ["#26a69a", "#004d40"],
];

export async function getSpots(): Promise<{ spots: SpotView[]; purposes: { name: string; icon: string }[] }> {
  const d = await load();
  if (!d) return { spots: [], purposes: [] };
  const purposeById = new Map(d.purposes.map((p) => [Number(p.id), p]));
  const spots = d.spots.map<SpotView>((s, i) => {
    const level = str(s.level_min);
    return {
      slug: str(s.slug),
      name: str(s.name),
      regionLabel: REGION[s.region as keyof typeof REGION] ?? str(s.region),
      area: str(s.area_name),
      purposes: d.spotPurposes
        .filter((x) => x.spot_id === Number(s.id))
        .map((x) => purposeById.get(x.purpose_id))
        .sort((a, b) => Number(a?.sort_order ?? 0) - Number(b?.sort_order ?? 0))
        .map((p) => str(p?.name)),
      level,
      levelLabel: DIVE_LEVEL[level as keyof typeof DIVE_LEVEL] ?? level,
      cost: s.cost_yen === null || s.cost_yen === undefined ? null : Number(s.cost_yen),
      costNote: str(s.cost_note),
      months: arr<number>(s.best_months),
      summary: str(s.summary),
      bodyHtml: s.body_md ? markdownToHtml(str(s.body_md)) : "",
      access: str(s.access),
      isEstimate: Number(s.is_estimate) === 1,
      checkedOn: str(s.checked_on),
      color: COLORS[i % COLORS.length],
      rank: i + 1,
    };
  });
  return { spots, purposes: d.purposes.map((p) => ({ name: str(p.name), icon: str(p.icon) })) };
}

/* ---------- よくある質問（F-13） ---------- */
export type FaqView = { category: string; q: string; aHtml: string; aText: string };
export async function getFaqs(): Promise<{ categories: string[]; items: FaqView[] }> {
  const d = await load();
  const order = Object.keys(FAQ_CATEGORY);
  const src = d
    ? d.faqs.map((f) => ({ category: str(f.category), q: str(f.question), a: str(f.answer_md) }))
    : (faqJson as { items: { category: string; q: string; a: string }[] }).items;
  const items = src.map((f) => ({ category: f.category, q: f.q, aHtml: markdownToHtml(f.a), aText: f.a.replace(/[*#>\[\]()`_-]/g, "").trim() }));
  const cats = order.filter((c) => items.some((i) => i.category === c));
  items.forEach((i) => !cats.includes(i.category) && cats.push(i.category));
  return { categories: cats, items };
}

/* ---------- 参加者の声・動画・コミュニティ ---------- */
export async function getTestimonials(): Promise<{ text: string; who: string }[]> {
  const d = await load();
  return d ? d.testimonials.map((t) => ({ text: str(t.body), who: str(t.display_name) })) : [];
}

export type EmbedView = { platform: string; url: string; title: string; relatedKind: string };
export async function getEmbeds(): Promise<EmbedView[]> {
  const d = await load();
  return d ? d.embeds.map((e) => ({ platform: str(e.platform), url: str(e.url), title: str(e.title), relatedKind: str(e.related_kind) })) : [];
}
