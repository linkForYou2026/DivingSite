// /api/admin/ 配下すべての入り口：ログインと、別サイトからの書き込みを防ぐ確認
import type { Handler } from "../../_lib/types";
import { currentAdmin } from "../../_lib/auth";
import { error, unauthorized } from "../../_lib/http";

export const onRequest: Handler = async (ctx) => {
  const { request } = ctx;
  if (!ctx.env.DB || !ctx.env.SESSION_SECRET) return error(500, "サーバーの設定（DB・SESSION_SECRET）が足りません");

  // 書き込み系は、同じサイトの画面から送られたものだけ受け付ける（CSRF対策）
  if (request.method !== "GET" && request.method !== "HEAD") {
    const origin = request.headers.get("Origin");
    if (!origin || origin !== new URL(request.url).origin) return error(403, "不正な送信元です");
  }

  const admin = await currentAdmin(ctx);
  if (!admin) return unauthorized();
  ctx.data.admin = admin;

  const res = await ctx.next();
  const out = new Response(res.body, res);
  out.headers.set("Cache-Control", "no-store");
  out.headers.set("X-Robots-Tag", "noindex, nofollow");
  return out;
};
