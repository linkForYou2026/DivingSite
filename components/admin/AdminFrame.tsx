"use client";

import { usePathname } from "next/navigation";
import AdminShell from "./AdminShell";

/** ログイン画面だけは外枠（メニュー）なしで出す */
export default function AdminFrame({ children }: { children: React.ReactNode }) {
  const p = usePathname() || "";
  if (p.startsWith("/admin/login")) return <>{children}</>;
  return <AdminShell>{children}</AdminShell>;
}
