// 応答の作り方をそろえるための関数

export function json(body: unknown, init: ResponseInit & { cache?: number } = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  if (!headers.has("Cache-Control")) {
    headers.set("Cache-Control", init.cache ? `public, max-age=${init.cache}` : "no-store");
  }
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers });
}

export function error(status: number, message: string, extra: Record<string, unknown> = {}): Response {
  return json({ error: message, ...extra }, { status });
}

export const unauthorized = () => error(401, "ログインしてください");
export const forbidden = () => error(403, "この操作をする権限がありません");
export const notFound = () => error(404, "見つかりません");

/** JSON の本文を読む（大きすぎるものは断る） */
export async function readJson<T = Record<string, unknown>>(req: Request, maxBytes = 200_000): Promise<T | null> {
  const len = Number(req.headers.get("Content-Length") || 0);
  if (len > maxBytes) return null;
  const text = await req.text();
  if (text.length > maxBytes) return null;
  try {
    const v = JSON.parse(text);
    return v && typeof v === "object" ? (v as T) : null;
  } catch {
    return null;
  }
}

export function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** 更新日時（同時編集の判定に使うため、1000分の1秒まで持つ） */
export function nowIsoMs(): string {
  return new Date().toISOString();
}

export function getCookie(req: Request, name: string): string | null {
  const c = req.headers.get("Cookie") || "";
  for (const part of c.split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1));
  }
  return null;
}

export function setCookie(name: string, value: string, maxAgeSec: number, path = "/"): string {
  return `${name}=${encodeURIComponent(value)}; Path=${path}; Max-Age=${maxAgeSec}; HttpOnly; Secure; SameSite=Lax`;
}
