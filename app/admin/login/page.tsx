"use client";

// BO-00 ログイン（Google Workspace のアカウント）
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

const MESSAGES: Record<string, string> = {
  expired: "ログインの手続きが時間切れになりました。もう一度お試しください。",
  google: "Google との連携でエラーが起きました。もう一度お試しください。",
  domain: "@link-since2026.jp のアカウントでログインしてください。",
  not_allowed: "このアカウントは管理者として登録されていないか、無効になっています。オーナーに追加を依頼してください。",
};

function Inner() {
  const sp = useSearchParams();
  const err = sp.get("error");
  const next = sp.get("next") || "/admin/";
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-bold text-ocean-deep">管理画面にログイン</h1>
        <p className="mt-2 text-sm text-slate-600">Google Workspace（@link-since2026.jp）のアカウントでログインします。</p>
        {err && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-left text-sm text-red-800">
            {MESSAGES[err] ?? "ログインできませんでした。"}
          </p>
        )}
        <a href={`/api/auth/login?next=${encodeURIComponent(next.startsWith("/admin/") ? next : "/admin/")}`} className="mt-6 block rounded-lg bg-pro px-4 py-3 font-bold text-white hover:bg-ocean-deep">
          Google でログイン
        </a>
        <p className="mt-4 text-xs text-slate-500">ログイン状態は12時間で切れます。</p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
