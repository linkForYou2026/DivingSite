"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import type { Capability, Role } from "@/shared/permissions";

export type AdminInfo = { id: number; email: string; display_name: string; role: Role };
export const AdminContext = createContext<{ admin: AdminInfo; caps: Capability[] } | null>(null);

/** ログイン中の管理者と、権限の確認（can）。can は画面の表示を切り替えるだけで、最終的な確認は API 側で行う */
export function useAdmin() {
  const v = useContext(AdminContext);
  if (!v) throw new Error("AdminShell の中で使ってください");
  const can = useCallback((c: Capability) => v.caps.includes(c), [v]);
  return useMemo(() => ({ ...v, can }), [v, can]);
}
