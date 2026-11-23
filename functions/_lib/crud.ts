// 管理API の共通処理（一覧・取得・作成・更新・非表示化）
// どのテーブルも shared/admin-schema.ts の定義に従って動く
import type { TableDef } from "../../shared/admin-schema";
import { getTable } from "../../shared/admin-schema";
import { checkRow, todayJst } from "../../shared/validate";
import type { Admin, D1Database } from "./types";
import { auditStmt, diffOf } from "./audit";
import { nowIsoMs as nowIso } from "./http";

export const PAGE_SIZE = 50;

export type Options = Record<string, { value: number; label: string }[]>;

/** 選択肢（別テーブルの行）をまとめて取得する */
export async function loadOptions(db: D1Database, t: TableDef): Promise<Options> {
  const out: Options = {};
  for (const f of t.fields) {
    if (f.type !== "ref" || !f.ref) continue;
    const rt = getTable(f.ref.table);
    if (!rt) continue;
    const label = f.ref.label;
    const extra = f.ref.table === "licenses" ? ", (SELECT name FROM agencies a WHERE a.id = r.agency_id) AS agency" : "";
    const rows = await db.prepare(`SELECT id, ${label} AS label${extra} FROM ${rt.name} r ORDER BY ${rt.orderBy}`).all<{ id: number; label: string; agency?: string }>();
    out[f.name] = rows.results.map((r) => ({ value: r.id, label: r.agency ? `${r.agency}：${r.label}` : String(r.label) }));
  }
  if (t.m2m) {
    const rows = await db.prepare(`SELECT id, ${t.m2m.refLabel} AS label FROM ${t.m2m.refTable} ORDER BY sort_order, id`).all<{ id: number; label: string }>();
    out[t.m2m.name] = rows.results.map((r) => ({ value: r.id, label: r.label }));
  }
  return out;
}

export async function listRows(db: D1Database, t: TableDef, q: URLSearchParams) {
  const where: string[] = [];
  const binds: unknown[] = [];
  const status = q.get("status") || "";
  if (t.hasStatus) {
    if (status && status !== "all") {
      where.push(`status = ?${binds.length + 1}`);
      binds.push(status);
    } else if (!status) {
      where.push("status <> 'archived'"); // 何も選ばなければ「非表示」は出さない
    }
  }
  const kw = (q.get("q") || "").trim();
  if (kw && t.search.length) {
    where.push("(" + t.search.map((c) => `${c} LIKE ?${binds.length + 1}`).join(" OR ") + ")");
    binds.push(`%${kw}%`);
  }
  // 一覧の絞り込み（例：?f_agency_id=1）
  for (const f of t.fields) {
    const v = q.get("f_" + f.name);
    if (v) {
      where.push(`${f.name} = ?${binds.length + 1}`);
      binds.push(f.type === "int" || f.type === "ref" ? Number(v) : v);
    }
  }
  const w = where.length ? "WHERE " + where.join(" AND ") : "";
  const page = Math.max(1, Number(q.get("page") || 1));
  const total = (await db.prepare(`SELECT COUNT(*) AS n FROM ${t.name} ${w}`).bind(...binds).first<{ n: number }>())?.n ?? 0;
  const rows = await db
    .prepare(`SELECT * FROM ${t.name} ${w} ORDER BY ${t.orderBy} LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`)
    .bind(...binds)
    .all();
  return { rows: rows.results, total, page, pageSize: PAGE_SIZE };
}

export async function getRow(db: D1Database, t: TableDef, id: number) {
  const row = await db.prepare(`SELECT * FROM ${t.name} WHERE id = ?1`).bind(id).first<Record<string, unknown>>();
  if (!row) return null;
  let m2m: number[] | undefined;
  if (t.m2m) {
    const r = await db.prepare(`SELECT ${t.m2m.otherFk} AS v FROM ${t.m2m.table} WHERE ${t.m2m.fk} = ?1`).bind(id).all<{ v: number }>();
    m2m = r.results.map((x) => x.v);
  }
  return { row, m2m };
}

function m2mStatements(db: D1Database, t: TableDef, id: number, ids: unknown) {
  const m = t.m2m;
  if (!m || !Array.isArray(ids)) return [];
  const clean = Array.from(new Set(ids.map(Number).filter((n) => Number.isInteger(n) && n > 0)));
  return [
    db.prepare(`DELETE FROM ${m.table} WHERE ${m.fk} = ?1`).bind(id),
    ...clean.map((v) => db.prepare(`INSERT INTO ${m.table} (${m.fk}, ${m.otherFk}) VALUES (?1, ?2)`).bind(id, v)),
  ];
}

/** データベースの制約違反を、画面に出せる日本語にする */
export function dbErrorMessage(e: unknown): string {
  const m = String((e as Error)?.message || e);
  if (/UNIQUE/i.test(m)) return "同じコード・URL名などのデータがすでにあります";
  if (/FOREIGN KEY/i.test(m)) return "選んだ関連先が見つからないか、他のデータから使われています";
  if (/CHECK/i.test(m)) return "入力内容が決まりに合っていません（日付の前後関係などを確認してください）";
  return "保存できませんでした";
}

export class HttpError extends Error {
  constructor(public status: number, message: string, public extra: Record<string, unknown> = {}) {
    super(message);
  }
}

export async function createRow(db: D1Database, t: TableDef, admin: Admin, body: Record<string, unknown>) {
  if (t.readOnly || t.allowCreate === false) throw new HttpError(405, "このデータは画面から追加できません");
  const input = { ...((body.values as Record<string, unknown>) || {}) };
  // 確認日が空なら今日にする
  if (t.fields.some((f) => f.name === "checked_on") && !input.checked_on) input.checked_on = todayJst();
  const { values, errors } = checkRow(t, input, "create");
  if (Object.keys(errors).length) throw new HttpError(400, "入力内容を確認してください", { fieldErrors: errors });
  if (t.name === "admin_users") checkAdminEmail(values.email as string);
  values.updated_by = admin.email;
  const cols = Object.keys(values);
  const sql = `INSERT INTO ${t.name} (${cols.join(", ")}) VALUES (${cols.map((_, i) => "?" + (i + 1)).join(", ")})`;
  let id: number;
  try {
    const r = await db.prepare(sql).bind(...cols.map((c) => values[c])).run();
    id = Number(r.meta.last_row_id);
  } catch (e) {
    throw new HttpError(409, dbErrorMessage(e));
  }
  await db.batch([...m2mStatements(db, t, id, body.m2m), auditStmt(db, admin.email, "create", t.name, id, values)]);
  return id;
}

export async function updateRow(db: D1Database, t: TableDef, admin: Admin, id: number, body: Record<string, unknown>) {
  if (t.readOnly) throw new HttpError(405, "このデータは変更できません");
  const cur = await getRow(db, t, id);
  if (!cur) throw new HttpError(404, "見つかりません");
  const before = cur.row;
  // 同時編集の確認（バックオフィス仕様書 4.2）：開いたときの updated_at と違えば上書きしない
  if (body.updated_at !== before.updated_at) {
    throw new HttpError(409, "他の人が先に更新しました。画面を開き直して、最新の内容を確認してください");
  }
  const input = (body.values as Record<string, unknown>) || {};
  const { values, errors } = checkRow(t, input, "update");
  if (Object.keys(errors).length) throw new HttpError(400, "入力内容を確認してください", { fieldErrors: errors });

  // 金額を変えたら確認日を今日にする（手で確認日も変えたときはそちらを優先）
  const priceChanged = (t.priceFields || []).some((k) => k in values && String(values[k]) !== String(before[k]));
  const checkedTouched = "checked_on" in values && values.checked_on !== before.checked_on;
  if (priceChanged && !checkedTouched) values.checked_on = todayJst();

  if (t.name === "admin_users") await guardLastOwner(db, id, before, values);

  const diff = diffOf(before, values);
  const m2mBefore = cur.m2m;
  const m2mChanged = t.m2m && Array.isArray(body.m2m) && JSON.stringify([...(body.m2m as number[])].map(Number).sort()) !== JSON.stringify([...(m2mBefore || [])].sort());
  if (!Object.keys(diff).length && !m2mChanged) return { changed: false, updated_at: before.updated_at };

  const now = nowIso();
  const setCols = Object.keys(diff);
  const binds = [...setCols.map((c) => values[c]), admin.email, now, id, before.updated_at];
  const n = setCols.length;
  const sql = `UPDATE ${t.name} SET ${[...setCols.map((c, i) => `${c} = ?${i + 1}`), `updated_by = ?${n + 1}`, `updated_at = ?${n + 2}`].join(", ")} WHERE id = ?${n + 3} AND updated_at = ?${n + 4}`;
  try {
    const r = await db.prepare(sql).bind(...binds).run();
    if (!r.meta.changes) throw new HttpError(409, "他の人が先に更新しました。画面を開き直して、最新の内容を確認してください");
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(409, dbErrorMessage(e));
  }
  const action = diff.status?.after === "archived" ? "archive" : diff.status?.after === "published" ? "publish" : "update";
  const auditDiff = m2mChanged ? { ...diff, [t.m2m!.name]: { before: m2mBefore, after: body.m2m } } : diff;
  await db.batch([...(m2mChanged ? m2mStatements(db, t, id, body.m2m) : []), auditStmt(db, admin.email, action, t.name, id, auditDiff)]);
  return { changed: true, updated_at: now };
}

/** 非表示にする（status があるテーブル）／削除する（allowDelete のテーブルだけ） */
export async function removeRow(db: D1Database, t: TableDef, admin: Admin, id: number) {
  if (t.readOnly) throw new HttpError(405, "このデータは変更できません");
  const cur = await getRow(db, t, id);
  if (!cur) throw new HttpError(404, "見つかりません");
  if (t.hasStatus) {
    await db.batch([
      db.prepare(`UPDATE ${t.name} SET status = 'archived', updated_by = ?1, updated_at = ?2 WHERE id = ?3`).bind(admin.email, nowIso(), id),
      auditStmt(db, admin.email, "archive", t.name, id, { status: { before: cur.row.status, after: "archived" } }),
    ]);
    return "archived";
  }
  if (!t.allowDelete) throw new HttpError(405, "このデータは削除できません。項目を変更してください");
  try {
    await db.batch([
      db.prepare(`DELETE FROM ${t.name} WHERE id = ?1`).bind(id),
      auditStmt(db, admin.email, "archive", t.name, id, { deleted: cur.row }),
    ]);
  } catch (e) {
    throw new HttpError(409, dbErrorMessage(e));
  }
  return "deleted";
}

function checkAdminEmail(email: string) {
  if (!email || !/@link-since2026\.jp$/i.test(email)) throw new HttpError(400, "入力内容を確認してください", { fieldErrors: { email: "@link-since2026.jp のアカウントだけ登録できます" } });
}

/** 最後の owner を無効化・降格しない（バックオフィス仕様書 5章 BO-81） */
async function guardLastOwner(db: D1Database, id: number, before: Record<string, unknown>, values: Record<string, unknown>) {
  const losingOwner = before.role === "owner" && before.active === 1 && ((values.role !== undefined && values.role !== "owner") || values.active === 0);
  if (!losingOwner) return;
  const n = (await db.prepare("SELECT COUNT(*) AS n FROM admin_users WHERE role = 'owner' AND active = 1 AND id <> ?1").bind(id).first<{ n: number }>())?.n ?? 0;
  if (n === 0) throw new HttpError(400, "最後のオーナーは無効化・権限変更できません。先に別のオーナーを追加してください");
}
