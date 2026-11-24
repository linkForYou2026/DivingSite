// GET  /api/admin/t/<テーブル>   一覧（?q=検索 &status= &page= &f_<項目>=）
// POST /api/admin/t/<テーブル>   作成  { values: {...}, m2m?: [id,...] }
import type { Handler } from "../../../../_lib/types";
import { error, forbidden, json, notFound, readJson } from "../../../../_lib/http";
import { HttpError, createRow, listRows, loadOptions } from "../../../../_lib/crud";
import { visibilityContext } from "../../../../_lib/visctx";
import { getTable } from "../../../../../shared/admin-schema";
import { can } from "../../../../../shared/permissions";

export const onRequestGet: Handler<"table"> = async ({ env, params, request, data }) => {
  const t = getTable(params.table);
  if (!t) return notFound();
  if (!can(data.admin!.role, t.cap)) return forbidden();
  const q = new URL(request.url).searchParams;
  const [list, options, vctx] = await Promise.all([listRows(env.DB, t, q), loadOptions(env.DB, t), visibilityContext(env.DB, t.name)]);
  return json({ ...list, options, vctx });
};

export const onRequestPost: Handler<"table"> = async ({ env, params, request, data }) => {
  const t = getTable(params.table);
  if (!t) return notFound();
  if (!can(data.admin!.role, t.cap)) return forbidden();
  const body = await readJson(request);
  if (!body) return error(400, "送信内容が読み取れません");
  try {
    const id = await createRow(env.DB, t, data.admin!, body);
    return json({ id }, { status: 201 });
  } catch (e) {
    if (e instanceof HttpError) return error(e.status, e.message, e.extra);
    throw e;
  }
};
