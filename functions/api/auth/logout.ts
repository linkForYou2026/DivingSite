// POST /api/auth/logout  ログアウト（ログイン状態のクッキーを消す）
import type { Handler } from "../../_lib/types";
import { error, json, setCookie } from "../../_lib/http";
import { SESSION_COOKIE } from "../../_lib/session";

export const onRequestPost: Handler = async ({ request }) => {
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) return error(403, "不正な送信元です");
  return json({ ok: true }, { headers: { "Set-Cookie": setCookie(SESSION_COOKIE, "", 0) } });
};
