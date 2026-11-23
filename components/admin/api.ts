// 管理画面から API を呼ぶための関数
// ログインが切れていたら（401）、ログイン画面へ移動する

export class ApiError extends Error {
  constructor(public status: number, message: string, public fieldErrors: Record<string, string> = {}) {
    super(message);
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    const next = window.location.pathname + window.location.search;
    window.location.href = "/admin/login/?next=" + encodeURIComponent(next);
    throw new ApiError(401, "ログインしてください");
  }
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!res.ok) {
    const b = (body || {}) as { error?: string; fieldErrors?: Record<string, string> };
    throw new ApiError(res.status, b.error || `エラーが起きました（${res.status}）`, b.fieldErrors || {});
  }
  return body as T;
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  return handle<T>(await fetch(path, { credentials: "same-origin", headers: { Accept: "application/json" } }));
}

export async function apiSend<T = unknown>(method: "POST" | "PUT" | "DELETE", path: string, body?: unknown): Promise<T> {
  return handle<T>(
    await fetch(path, {
      method,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}
