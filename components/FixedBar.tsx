// スマホのときだけ画面下に固定表示するボタン（仕様書 5.3）
import Link from "next/link";

export default function FixedBar() {
  return (
    <nav aria-label="よく使うボタン" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 shadow-[0_-4px_14px_rgba(0,0,0,0.15)] md:hidden">
      <Link href="/contact/" className="btn-warm py-3 text-center">✉ お問い合わせ</Link>
      <Link href="/events/" className="bg-pro py-3 text-center font-bold text-white">📅 イベント</Link>
    </nav>
  );
}
