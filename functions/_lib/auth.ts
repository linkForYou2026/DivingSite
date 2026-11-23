// ログインしている管理者を調べる
import type { Admin, Ctx, Env } from "./types";
import { getCookie } from "./http";
import { SESSION_COOKIE, verifyValue } from "./session";

export function allowedDomain(env: Env): string {
  return (env.ALLOWED_EMAIL_DOMAIN || "link-since2026.jp").toLowerCase();
}

/** クッキーの署名を確かめ、admin_users で「有効」な管理者かを毎回確認する */
export async function currentAdmin(ctx: Ctx): Promise<Admin | null> {
  const s = await verifyValue<{ email: string; exp: number }>(getCookie(ctx.request, SESSION_COOKIE), ctx.env.SESSION_SECRET);
  if (!s) return null;
  const row = await ctx.env.DB.prepare(
    "SELECT id, email, display_name, role FROM admin_users WHERE email = ?1 COLLATE NOCASE AND active = 1",
  )
    .bind(s.email)
    .first<Admin>();
  return row ?? null;
}
