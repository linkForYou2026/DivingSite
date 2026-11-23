// 操作履歴（audit_logs）に記録する（バックオフィス仕様書 4.4）
import type { D1Database, D1PreparedStatement } from "./types";

type Action = "create" | "update" | "archive" | "publish" | "import" | "export" | "login";

export function auditStmt(
  db: D1Database,
  actor: string,
  action: Action,
  table: string | null,
  id: number | null,
  diff?: unknown,
): D1PreparedStatement {
  return db
    .prepare("INSERT INTO audit_logs (actor_email, action, target_table, target_id, diff_json, updated_by) VALUES (?1, ?2, ?3, ?4, ?5, ?1)")
    .bind(actor, action, table, id, diff === undefined ? null : JSON.stringify(diff));
}

export async function audit(db: D1Database, actor: string, action: Action, table: string | null, id: number | null, diff?: unknown) {
  await auditStmt(db, actor, action, table, id, diff).run();
}

/** 変更前と変更後で値が変わった項目だけを取り出す（料金の変更前後を履歴で見られるように） */
export function diffOf(before: Record<string, unknown> | null, after: Record<string, unknown>): Record<string, { before: unknown; after: unknown }> {
  const out: Record<string, { before: unknown; after: unknown }> = {};
  for (const k of Object.keys(after)) {
    const b = before ? before[k] ?? null : null;
    const a = after[k] ?? null;
    if (String(b) !== String(a)) out[k] = { before: b, after: a };
  }
  return out;
}
