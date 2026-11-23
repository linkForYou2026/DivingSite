// GET    /api/admin/t/<テーブル>/<番号>   1件と選択肢
// PUT    /api/admin/t/<テーブル>/<番号>   更新 { values, m2m?, updated_at }
// DELETE /api/admin/t/<テーブル>/<番号>   非表示にする（status がない一部のテーブルは削除）
import type { Handler } from "../../../../_lib/types";
import { error, forbidden, json, notFound, readJson } from "../../../../_lib/http";
import { HttpError, getRow, loadOptions, removeRow, updateRow } from "../../../../_lib/crud";
import { getTable } from "../../../../../shared/admin-schema";
import { can } from "../../../../../shared/permissions";

function resolve(params: Record<string, string>, role: "owner" | "editor") {
  const t = getTable(params.table);
  const id = Number(params.id);
  if (!t || !Number.isInteger(id) || id <= 0) return { res: notFound() };
  if (!can(role, t.cap)) return { res: forbidden() };
  return { t, id };
}

const wrap = async (fn: () => Promise<Response>) => {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof HttpError) return error(e.status, e.message, e.extra);
    throw e;
  }
};

export const onRequestGet: Handler<"table" | "id"> = async ({ env, params, data }) => {
  const r = resolve(params, data.admin!.role);
  if (!r.t) return r.res!;
  const [row, options] = await Promise.all([getRow(env.DB, r.t, r.id), loadOptions(env.DB, r.t)]);
  if (!row) return notFound();
  return json({ ...row, options });
};

export const onRequestPut: Handler<"table" | "id"> = async ({ env, params, request, data }) => {
  const r = resolve(params, data.admin!.role);
  if (!r.t) return r.res!;
  const body = await readJson(request);
  if (!body) return error(400, "送信内容が読み取れません");
  return wrap(async () => json(await updateRow(env.DB, r.t!, data.admin!, r.id, body)));
};

export const onRequestDelete: Handler<"table" | "id"> = async ({ env, params, data }) => {
  const r = resolve(params, data.admin!.role);
  if (!r.t) return r.res!;
  return wrap(async () => json({ result: await removeRow(env.DB, r.t!, data.admin!, r.id) }));
};
