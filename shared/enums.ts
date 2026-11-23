// 列挙値（docs/データモデル定義書.md 5章）。公開サイト・管理画面・API で共通に使う
// ここは Next.js にも Cloudflare Functions にも依存しない書き方にしている

export type Option = { value: string; label: string };
const opts = (o: Record<string, string>): Option[] => Object.entries(o).map(([value, label]) => ({ value, label }));

export const SERVICE_KIND = {
  course: "講習",
  trial: "体験ダイビング",
  fun_dive: "ファンダイブ・ガイド",
  refresh: "リフレッシュ講習",
  photo: "水中撮影",
  survey: "水中調査・マップ作り",
  media: "取材・出演・SNS発信",
  tour_plan: "ツアー企画",
  other: "その他",
} as const;

export const PRICE_UNIT = { person: "1人", time: "1回", day: "1日", dive: "1本", hour: "1時間", project: "1件" } as const;

export const COST_ITEM = { tour: "講習・ツアー代", rental: "器材レンタル", travel: "交通費", stay: "宿泊", other: "その他" } as const;
export const COST_ITEM_KEYS = ["tour", "rental", "travel", "stay", "other"] as const;
export type CostItemKey = (typeof COST_ITEM_KEYS)[number];

export const INQUIRY_PURPOSE = {
  course: "講習の申し込み",
  refresh: "ブランク相談",
  event: "イベント参加",
  work: "仕事の依頼",
  plan: "費用・プランの相談",
  other: "その他",
} as const;

export const DIVE_LEVEL = { none: "未経験・体験", ow: "OW（初級）", aow: "AOW以上（中級〜）", pro: "プロ" } as const;
export const DIVE_LEVEL_RANK: Record<string, number> = { none: 0, ow: 1, aow: 2, pro: 3 };

export const CREATURE_CATEGORY = {
  fish: "魚",
  turtle: "ウミガメ",
  ray_shark: "エイ・サメ",
  mammal: "哺乳類",
  crustacean: "甲殻類",
  mollusk: "軟体動物",
  coral: "サンゴ・その他",
} as const;

export const POST_CATEGORY = {
  beginner: "初心者向け",
  spot: "スポット紹介",
  creature: "生き物",
  photo: "撮影テクニック",
  gear: "機材レビュー",
  career: "仕事・キャリア",
  event_report: "イベントレポート",
} as const;

export const STATUS = { draft: "下書き", published: "公開", archived: "非表示" } as const;

export const REGION = { domestic: "国内", overseas: "海外" } as const;
export const EVENT_KIND = { tour: "ツアー", course: "講習会", meetup: "交流会", cleanup: "清掃活動", other: "その他" } as const;
export const ENTRY_STATUS = { open: "受付中", closed: "締切", full: "満席" } as const;
export const EVENT_ENTRY_STATUS = { requested: "申込", confirmed: "確定", cancelled: "取消" } as const;
export const HANDLING_STATUS = { new: "未対応", in_progress: "対応中", waiting: "返信待ち", done: "完了", spam: "迷惑" } as const;
export const LICENSE_CATEGORY = { leisure: "レジャー", pro: "プロ" } as const;
export const LIKELIHOOD = { high: "よく会える", mid: "会えることが多い", low: "運がよければ" } as const;
export const GEAR_CATEGORY = { camera: "カメラ", housing: "ハウジング", light: "水中ライト", accessory: "アクセサリー", smartphone: "スマホ用" } as const;
export const BUDGET_BAND = { under_30k: "〜3万円", under_100k: "〜10万円", over_100k: "10万円以上" } as const;
export const TESTIMONIAL_RELATED = { service: "メニュー", event: "イベント", spot: "スポット" } as const;
export const EMBED_PLATFORM = { youtube: "YouTube動画", youtube_playlist: "YouTube再生リスト", instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook" } as const;
export const EMBED_RELATED = { top: "トップ", spot: "スポット", creature: "生き物", event: "イベント", post: "ブログ記事" } as const;
export const COMMUNITY_KIND = {
  line_openchat: "LINEオープンチャット",
  discord: "Discord",
  facebook_group: "Facebookグループ",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  other: "その他",
} as const;
export const ADMIN_ROLE = { owner: "オーナー（すべて）", editor: "編集者" } as const;
export const AUDIT_ACTION = { create: "作成", update: "更新", archive: "非表示", publish: "公開・反映", import: "取り込み", export: "書き出し", login: "ログイン" } as const;
export const FAQ_CATEGORY = { はじめて: "はじめて", 資格: "資格", 費用: "費用", 持ち物: "持ち物", "安全・健康": "安全・健康", イベント: "イベント", 依頼: "依頼" } as const;

export const ENUMS: Record<string, Record<string, string>> = {
  service_kind: SERVICE_KIND,
  price_unit: PRICE_UNIT,
  cost_item: COST_ITEM,
  inquiry_purpose: INQUIRY_PURPOSE,
  dive_level: DIVE_LEVEL,
  creature_category: CREATURE_CATEGORY,
  post_category: POST_CATEGORY,
  status: STATUS,
  region: REGION,
  event_kind: EVENT_KIND,
  entry_status: ENTRY_STATUS,
  event_entry_status: EVENT_ENTRY_STATUS,
  handling_status: HANDLING_STATUS,
  license_category: LICENSE_CATEGORY,
  likelihood: LIKELIHOOD,
  gear_category: GEAR_CATEGORY,
  budget_band: BUDGET_BAND,
  testimonial_related: TESTIMONIAL_RELATED,
  embed_platform: EMBED_PLATFORM,
  embed_related: EMBED_RELATED,
  community_kind: COMMUNITY_KIND,
  admin_role: ADMIN_ROLE,
  audit_action: AUDIT_ACTION,
  faq_category: FAQ_CATEGORY,
};

export function enumOptions(name: string): Option[] {
  return opts(ENUMS[name] ?? {});
}

export function enumLabel(name: string, value: string | null | undefined): string {
  if (value == null) return "";
  return ENUMS[name]?.[value] ?? value;
}

/** 用件の表示名（日本語）からコードへ。URL で表示名が渡されたときのため */
export function purposeCode(v: string | null | undefined): string {
  if (!v) return "";
  if (v in INQUIRY_PURPOSE) return v;
  const hit = Object.entries(INQUIRY_PURPOSE).find(([, label]) => label === v);
  return hit ? hit[0] : "";
}
