// 問い合わせの個人情報を、保存期間を過ぎたら消去する（データモデル定義書 9章）
// Pages には定期実行がないため、管理画面を開いたときに実行する（1日1回相当で十分なため）
import type { D1Database } from "./types";
import { nowIso } from "./http";

export async function purgeExpiredInquiries(db: D1Database): Promise<number> {
  const row = await db.prepare("SELECT value FROM settings WHERE key = 'inquiry_retention_days'").first<{ value: string | null }>();
  const days = Number(row?.value);
  if (!row?.value || !Number.isInteger(days) || days <= 0) return 0;
  const cutoff = new Date(Date.now() - days * 86400_000).toISOString().replace(/\.\d{3}Z$/, "Z");
  const r = await db
    .prepare("UPDATE inquiries SET name = NULL, email = NULL, phone = NULL, deleted_at = ?1 WHERE deleted_at IS NULL AND created_at < ?2")
    .bind(nowIso(), cutoff)
    .run();
  return Number(r.meta.changes || 0);
}
