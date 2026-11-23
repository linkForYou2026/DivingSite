// フッター（仕様書 5.2）
import Link from "next/link";
import { site } from "@/lib/data";
import SnsIcons from "./SnsIcons";

const COLS: { title: string; links: [string, string][] }[] = [
  {
    title: "知る・学ぶ",
    links: [
      ["はじめての方へ", "/beginner/"],
      ["費用とモデルプラン", "/beginner/cost/"],
      ["ブランクダイバーの方へ", "/beginner/blank/"],
      ["資格ガイド", "/license/"],
      ["よくある質問", "/beginner/faq/"],
    ],
  },
  {
    title: "潜る・撮る",
    links: [
      ["海・スポットを探す", "/spots/"],
      ["イベント・ツアー", "/events/"],
      ["講習案内・申し込み", "/license/course/"],
      ["動画・SNS", "/media/"],
      ["ブログ", "/blog/"],
    ],
  },
  {
    title: "頼む・働く",
    links: [
      ["仕事メニュー・料金", "/work/"],
      ["ダイビングで稼ぐには", "/work/earn/"],
      ["依頼・お問い合わせ", "/contact/"],
    ],
  },
];

export default function Footer() {
  const c = site.contact;
  return (
    <footer className="mt-16 bg-ocean-deep text-sm text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <p className="text-lg font-extrabold text-white">{site.name}</p>
          <p className="mt-1">{site.tagline}</p>
          <p className="mt-3 leading-relaxed">
            {c.email ? <>メール：{c.email}<br /></> : null}
            {c.tel ? <>電話：{c.tel}<br /></> : null}
            {c.hours ? <>{c.hours}<br /></> : null}
            <Link href="/contact/" className="text-sky-200 underline">お問い合わせフォーム</Link>
          </p>
          <SnsIcons className="mt-4" />
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <p className="mb-2 font-bold text-white">{col.title}</p>
            <ul className="space-y-1.5">
              {col.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sky-100 hover:underline">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-4 gap-y-1 px-4 py-4 text-xs text-slate-400">
          <Link href="/about/" className="hover:underline">運営者情報</Link>
          <Link href="/privacy/" className="hover:underline">プライバシーポリシー</Link>
          <Link href="/ads/" className="hover:underline">広告・アフィリエイトについて</Link>
          <Link href="/site-map/" className="hover:underline">サイトマップ</Link>
          <span className="w-full md:ml-auto md:w-auto">© 2026 {site.name}</span>
        </div>
      </div>
    </footer>
  );
}
