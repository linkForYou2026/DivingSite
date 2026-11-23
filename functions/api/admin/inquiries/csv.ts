// GET /api/admin/inquiries/csv?from=2026-11-01&to=2026-11-30&purpose=  CSV 書き出し（owner だけ。履歴に残す）
import type { Handler } from "../../../_lib/types";
import { error, forbidden } from "../../../_lib/http";
import { audit } from "../../../_lib/audit";
import { can } from "../../../../shared/permissions";
import { HANDLING_STATUS, INQUIRY_PURPOSE, enumLabel } from "../../../../shared/enums";
import { isValidDate } from "../../../../shared/validate";
import { formatJst } from "../../../../shared/format";

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  // 表計算ソフトで式として実行されないよう、= + - @ で始まる値の先頭に ' をつける
  const safe = /^[=+\-@]/.test(s) ? "'" + s : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export const onRequestGet: Handler = async ({ env, request, data }) => {
  const admin = data.admin!;
  if (!can(admin.role, "inquiries")) return forbidden();
  const q = new URL(request.url).searchParams;
  const from = q.get("from") || "";
  const to = q.get("to") || "";
  if ((from && !isValidDate(from)) || (to && !isValidDate(to))) return error(400, "期間の日付が正しくありません");
  const where: string[] = [];
  const binds: unknown[] = [];
  // 日付は日本時間の1日として扱う
  if (from) {
    binds.push(new Date(from + "T00:00:00+09:00").toISOString().replace(/\.\d{3}Z$/, "Z"));
    where.push(`created_at >= ?${binds.length}`);
  }
  if (to) {
    binds.push(new Date(to + "T24:00:00+09:00").toISOString().replace(/\.\d{3}Z$/, "Z"));
    where.push(`created_at < ?${binds.length}`);
  }
  const purpose = q.get("purpose");
  if (purpose && purpose in INQUIRY_PURPOSE) {
    binds.push(purpose);
    where.push(`purpose = ?${binds.length}`);
  }
  const rows = await env.DB.prepare(`SELECT * FROM inquiries ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY created_at`).bind(...binds).all<Record<string, unknown>>();
  const head = ["番号", "受付日時", "用件", "お名前", "メール", "電話", "希望日・時期", "人数", "経験", "予算", "内容", "自動入力された相談内容", "送信元ページ", "対応状況", "担当者"];
  const lines = [head.map(cell).join(",")];
  for (const r of rows.results) {
    lines.push(
      [r.id, formatJst(r.created_at as string), enumLabel("inquiry_purpose", r.purpose as string), r.name, r.email, r.phone, r.preferred_date, r.people, r.experience, r.budget, r.message, r.summary, r.source_page, HANDLING_STATUS[r.handling_status as keyof typeof HANDLING_STATUS], r.assignee]
        .map(cell)
        .join(","),
    );
  }
  await audit(env.DB, admin.email, "export", "inquiries", null, { from, to, purpose, count: rows.results.length });
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inquiries_${from || "all"}_${to || "all"}.csv"`,
      "Cache-Control": "no-store",
    },
  });
};
