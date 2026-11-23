// GET /api/auth/login  → Google のログイン画面へ移動する（Google Workspace のアカウント限定）
import type { Handler } from "../../_lib/types";
import { allowedDomain } from "../../_lib/auth";
import { error, setCookie } from "../../_lib/http";
import { randomToken, signValue } from "../../_lib/session";

export const OAUTH_COOKIE = "dp_oauth";

export const onRequestGet: Handler = async ({ request, env }) => {
  if (!env.GOOGLE_CLIENT_ID || !env.SESSION_SECRET) return error(500, "ログインの設定（GOOGLE_CLIENT_ID・SESSION_SECRET）が足りません");
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/admin/";
  const state = randomToken();
  const nonce = randomToken();
  // 10分だけ有効な一時クッキー（なりすまし防止の state と nonce を覚えておく）
  const tmp = await signValue({ state, nonce, next: next.startsWith("/admin/") ? next : "/admin/", exp: Math.floor(Date.now() / 1000) + 600 }, env.SESSION_SECRET);

  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${url.origin}/api/auth/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    hd: allowedDomain(env), // Google の画面で Workspace のアカウントだけを出す（最終確認は callback で行う）
    prompt: "select_account",
  }).toString();

  return new Response(null, {
    status: 302,
    headers: { Location: auth.toString(), "Set-Cookie": setCookie(OAUTH_COOKIE, tmp, 600, "/api/auth/"), "Cache-Control": "no-store" },
  });
};
