// Cloudflare Pages Functions で使う型（@cloudflare/workers-types を入れずに済むよう、使う分だけ定義）

export interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta: { changes?: number; last_row_id?: number; [k: string]: unknown };
}
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(col?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}
export interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}

/** Cloudflare の管理画面で設定する値（Pages → 設定 → 変数とシークレット／バインディング） */
export interface Env {
  DB: D1Database; // D1 のバインディング名は「DB」
  GOOGLE_CLIENT_ID: string; // Google ログインのクライアントID
  GOOGLE_CLIENT_SECRET: string; // 同シークレット（暗号化して保存）
  SESSION_SECRET: string; // ログイン状態の署名に使う長いランダムな文字列（暗号化して保存）
  ALLOWED_EMAIL_DOMAIN?: string; // 既定 link-since2026.jp
  EXPORT_TOKEN?: string; // サイトの組み立て時にデータを書き出すための合言葉（暗号化して保存）
  DEPLOY_HOOK_URL?: string; // 「サイトに反映」で呼ぶデプロイフックのURL（暗号化して保存）
  TURNSTILE_SECRET?: string; // 迷惑投稿対策（任意）
}

export interface Admin {
  id: number;
  email: string;
  display_name: string;
  role: "owner" | "editor";
}

export interface Ctx<P extends string = string> {
  request: Request;
  env: Env;
  params: Record<P, string>;
  data: { admin?: Admin } & Record<string, unknown>;
  next: () => Promise<Response>;
  waitUntil: (p: Promise<unknown>) => void;
}

export type Handler<P extends string = string> = (ctx: Ctx<P>) => Promise<Response> | Response;
