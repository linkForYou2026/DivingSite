// GET /api/auth/callback  Google から戻ってきたときの処理
// 1. state を確認 → 2. Google にコードを渡して本人情報を受け取る → 3. ドメインと admin_users を確認 → 4. ログイン状態を作る
import type { Handler } from "../../_lib/types";
import { allowedDomain } from "../../_lib/auth";
import { getCookie, nowIso, setCookie } from "../../_lib/http";
import { SESSION_COOKIE, SESSION_HOURS, fromB64url, signValue, verifyValue } from "../../_lib/session";
import { audit } from "../../_lib/audit";
import { OAUTH_COOKIE } from "./login";

const back = (origin: string, reason: string) =>
  new Response(null, {
    status: 302,
    headers: { Location: `${origin}/admin/login/?error=${reason}`, "Set-Cookie": setCookie(OAUTH_COOKIE, "", 0, "/api/auth/"), "Cache-Control": "no-store" },
  });

export const onRequestGet: Handler = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const tmp = await verifyValue<{ state: string; nonce: string; next: string; exp: number }>(getCookie(request, OAUTH_COOKIE), env.SESSION_SECRET);
  const code = url.searchParams.get("code");
  if (!tmp || !code || url.searchParams.get("state") !== tmp.state) return back(origin, "expired");

  // Google のサーバーと直接やり取りして、本人情報（ID トークン）を受け取る
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${origin}/api/auth/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return back(origin, "google");
  const tok = (await tokenRes.json()) as { id_token?: string };
  if (!tok.id_token) return back(origin, "google");

  // ID トークンは Google から https で直接受け取ったものなので、中身の項目を確認する（OpenID Connect の仕様）
  let claims: { iss?: string; aud?: string; exp?: number; email?: string; email_verified?: boolean; hd?: string; nonce?: string; name?: string };
  try {
    claims = JSON.parse(new TextDecoder().decode(fromB64url(tok.id_token.split(".")[1])));
  } catch {
    return back(origin, "google");
  }
  const domain = allowedDomain(env);
  const email = (claims.email || "").toLowerCase();
  const ok =
    (claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com") &&
    claims.aud === env.GOOGLE_CLIENT_ID &&
    (claims.exp ?? 0) > Date.now() / 1000 &&
    claims.email_verified === true &&
    claims.nonce === tmp.nonce &&
    claims.hd === domain &&
    email.endsWith("@" + domain);
  if (!ok) return back(origin, "domain");

  const admin = await env.DB.prepare("SELECT id, email FROM admin_users WHERE email = ?1 COLLATE NOCASE AND active = 1").bind(email).first<{ id: number; email: string }>();
  if (!admin) return back(origin, "not_allowed");

  await env.DB.prepare("UPDATE admin_users SET last_login_at = ?1 WHERE id = ?2").bind(nowIso(), admin.id).run();
  await audit(env.DB, admin.email, "login", "admin_users", admin.id);

  const session = await signValue({ email: admin.email, exp: Math.floor(Date.now() / 1000) + SESSION_HOURS * 3600 }, env.SESSION_SECRET);
  const headers = new Headers({ Location: origin + tmp.next, "Cache-Control": "no-store" });
  headers.append("Set-Cookie", setCookie(SESSION_COOKIE, session, SESSION_HOURS * 3600));
  headers.append("Set-Cookie", setCookie(OAUTH_COOKIE, "", 0, "/api/auth/"));
  return new Response(null, { status: 302, headers });
};
