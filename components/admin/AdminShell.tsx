"use client";

// 管理画面の外枠：ログイン確認・左のメニュー（権限で出し分け）・上部のバー
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { TABLES } from "@/shared/admin-schema";
import type { Capability } from "@/shared/permissions";
import { ROLE_LABEL } from "@/shared/permissions";
import { AdminContext, type AdminInfo } from "./AdminContext";
import { apiGet, apiSend } from "./api";

type MenuItem = { label: string; href: string; cap?: Capability; match: (p: string, t: string | null) => boolean };

const GROUPS = ["料金", "イベント", "海・生き物", "資格", "コンテンツ", "運用"] as const;

function buildMenu(): { group: string; items: MenuItem[] }[] {
  const top: MenuItem[] = [
    { label: "ダッシュボード", href: "/admin/", match: (p) => p === "/admin/" || p === "/admin" },
    { label: "問い合わせ", href: "/admin/inquiries/", cap: "inquiries", match: (p) => p.startsWith("/admin/inquiries") },
  ];
  const groups = GROUPS.map((g) => ({
    group: g,
    items: TABLES.filter((t) => t.group === g).map<MenuItem>((t) => ({
      label: t.label,
      href: `/admin/t/?table=${t.name}`,
      cap: t.cap,
      match: (p, tb) => (p.startsWith("/admin/t") || p.startsWith("/admin/edit")) && tb === t.name,
    })),
  }));
  groups.find((g) => g.group === "運用")!.items.unshift({ label: "サイト設定", href: "/admin/settings/", cap: "settings", match: (p) => p.startsWith("/admin/settings") });
  return [{ group: "", items: top }, ...groups];
}
const MENU = buildMenu();

function Menu({ caps, onNavigate }: { caps: Capability[]; onNavigate: () => void }) {
  const pathname = usePathname() || "";
  const table = useSearchParams().get("table");
  return (
    <nav aria-label="管理メニュー" className="space-y-4 text-sm">
      {MENU.map((g) => {
        const items = g.items.filter((i) => !i.cap || caps.includes(i.cap));
        if (!items.length) return null;
        return (
          <div key={g.group || "top"}>
            {g.group && <p className="mb-1 px-2 text-xs font-bold text-slate-400">{g.group}</p>}
            <ul>
              {items.map((i) => {
                const active = i.match(pathname, table);
                return (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`block rounded-md px-2 py-1.5 ${active ? "bg-pro font-bold text-white" : "text-slate-200 hover:bg-white/10"}`}
                    >
                      {i.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ admin: AdminInfo; caps: Capability[] } | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    apiGet<{ admin: AdminInfo; caps: Capability[] }>("/api/admin/me")
      .then(setState)
      .catch((e) => setError(e.status === 401 ? "" : e.message || "読み込めませんでした"));
  }, []);

  const logout = async () => {
    await apiSend("POST", "/api/auth/logout").catch(() => null);
    window.location.href = "/admin/login/";
  };

  if (error) return <p className="m-8 rounded-lg bg-red-50 p-4 text-red-800">管理画面を開けませんでした：{error}</p>;
  if (!state) return <p className="m-8 text-slate-500">読み込んでいます…</p>;

  return (
    <AdminContext.Provider value={state}>
      <div className="min-h-screen bg-slate-50 text-slate-800 md:grid md:grid-cols-[240px_1fr]">
        <aside className={`${open ? "block" : "hidden"} bg-ocean-deep p-4 text-white md:block md:min-h-screen`}>
          <p className="mb-4 hidden font-extrabold md:block">管理画面</p>
          <Suspense fallback={null}>
            <Menu caps={state.caps} onNavigate={() => setOpen(false)} />
          </Suspense>
          <p className="mt-6 text-xs">
            <Link href="/" target="_blank" className="text-sky-200 underline">サイトを見る（新しいタブ）</Link>
          </p>
        </aside>
        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-white px-4 py-2">
            <button type="button" className="rounded border px-2 py-1 text-sm md:hidden" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
              ☰ メニュー
            </button>
            <span className="text-sm font-bold md:hidden">管理画面</span>
            <span className="ml-auto text-sm text-slate-600">
              {state.admin.display_name}（{ROLE_LABEL[state.admin.role]}）
            </span>
            <button type="button" onClick={logout} className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100">
              ログアウト
            </button>
          </header>
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
