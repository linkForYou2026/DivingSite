// グローバルナビ（仕様書 5.1）。フェーズ2のページができたらここに追加します
export type NavItem = { label: string; href: string; children?: { label: string; href: string }[] };

export const NAV: NavItem[] = [
  {
    label: "はじめての方へ",
    href: "/beginner/",
    children: [
      { label: "はじめての方へ", href: "/beginner/" },
      { label: "費用とモデルプラン", href: "/beginner/cost/" },
      { label: "ブランクダイバーの方へ", href: "/beginner/blank/" },
      { label: "よくある質問", href: "/beginner/faq/" },
    ],
  },
  {
    label: "資格",
    href: "/license/",
    children: [
      { label: "資格ガイド", href: "/license/" },
      { label: "講習案内・申し込み", href: "/license/course/" },
    ],
  },
  { label: "海を探す", href: "/spots/" },
  { label: "イベント", href: "/events/" },
  {
    label: "仕事",
    href: "/work/",
    children: [
      { label: "仕事メニュー・料金", href: "/work/" },
      { label: "ダイビングで稼ぐには", href: "/work/earn/" },
    ],
  },
  {
    label: "動画・ブログ",
    href: "/media/",
    children: [
      { label: "動画・SNS", href: "/media/" },
      { label: "ブログ", href: "/blog/" },
    ],
  },
];

/** sitemap.xml とフッターに使う固定ページ一覧 */
export const STATIC_PAGES: { href: string; label: string }[] = [
  { href: "/", label: "トップ" },
  { href: "/beginner/", label: "はじめての方へ" },
  { href: "/beginner/cost/", label: "費用とモデルプラン" },
  { href: "/beginner/blank/", label: "ブランクダイバーの方へ" },
  { href: "/beginner/faq/", label: "よくある質問" },
  { href: "/license/", label: "資格ガイド" },
  { href: "/license/course/", label: "講習案内・申し込み" },
  { href: "/spots/", label: "海・スポットを探す" },
  { href: "/events/", label: "イベント・ツアー" },
  { href: "/work/", label: "仕事メニュー・料金" },
  { href: "/work/earn/", label: "ダイビングで稼ぐには" },
  { href: "/media/", label: "動画・SNS" },
  { href: "/blog/", label: "ブログ" },
  { href: "/contact/", label: "依頼・お問い合わせ" },
  { href: "/about/", label: "運営者情報" },
  { href: "/privacy/", label: "プライバシーポリシー" },
  { href: "/ads/", label: "広告・アフィリエイトについて" },
  { href: "/site-map/", label: "サイトマップ" },
];
