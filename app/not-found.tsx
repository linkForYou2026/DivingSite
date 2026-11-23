import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold text-pro">ページが見つかりません</h1>
      <p className="mt-4 text-slate-600">お探しのページは移動したか、まだ準備中です。</p>
      <Link href="/" className="mt-8 rounded-full bg-pro px-6 py-2 text-white">
        トップへ戻る
      </Link>
    </main>
  );
}
