import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold text-pro">ページが見つかりません</h1>
      <p className="mt-4 text-slate-600">お探しのページは移動したか、まだ準備中です。</p>
      <Link href="/" className="btn btn-primary mt-8 rounded-full px-6">
        トップへ戻る
      </Link>
    </div>
  );
}
