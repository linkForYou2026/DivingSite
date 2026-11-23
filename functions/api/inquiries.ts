// POST /api/inquiries  お問い合わせを受け付けて保存する（F-03）
// 迷惑投稿対策：見えない入力欄（website）が埋まっていたら捨てる／同じメールからの連続送信を断る／Turnstile（設定時のみ）
import type { Handler } from "../_lib/types";
import { error, json, nowIso, readJson } from "../_lib/http";
import { INQUIRY_PURPOSE } from "../../shared/enums";

type Body = {
  purpose?: string;
  service_id?: number | string | null;
  event_id?: number | string | null;
  name?: string;
  email?: string;
  phone?: string;
  preferred_date?: string;
  people?: number | string;
  experience?: string;
  budget?: string;
  message?: string;
  summary?: string;
  source_page?: string;
  consent?: boolean;
  website?: string; // 見えない入力欄（人は入力しない）
  turnstile?: string;
};

const str = (v: unknown, max: number) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s.slice(0, max) : null;
};
const idOrNull = (v: unknown) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export const onRequestPost: Handler = async ({ env, request }) => {
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) return error(403, "不正な送信元です");
  const b = await readJson<Body>(request, 30_000);
  if (!b) return error(400, "送信内容が読み取れません");
  if (b.website) return json({ ok: true }, { status: 201 }); // ロボットには成功したように見せて保存しない

  if (env.TURNSTILE_SECRET) {
    const form = new FormData();
    form.append("secret", env.TURNSTILE_SECRET);
    form.append("response", b.turnstile || "");
    const ip = request.headers.get("CF-Connecting-IP");
    if (ip) form.append("remoteip", ip);
    const v = (await (await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form })).json()) as { success?: boolean };
    if (!v.success) return error(400, "確認に失敗しました。もう一度お試しください");
  }

  const fieldErrors: Record<string, string> = {};
  const purpose = b.purpose && b.purpose in INQUIRY_PURPOSE ? b.purpose : null;
  if (!purpose) fieldErrors.purpose = "用件を選んでください";
  const name = str(b.name, 100);
  if (!name) fieldErrors.name = "お名前を入力してください";
  const email = str(b.email, 254)?.toLowerCase() ?? null;
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fieldErrors.email = "メールアドレスを確認してください";
  const message = str(b.message, 5000);
  if (!message) fieldErrors.message = "内容を入力してください";
  if (b.consent !== true) fieldErrors.consent = "個人情報の取り扱いへの同意が必要です";
  const people = b.people === undefined || b.people === "" ? null : Number(b.people);
  if (people !== null && (!Number.isInteger(people) || people < 1 || people > 100)) fieldErrors.people = "人数を確認してください";
  if (Object.keys(fieldErrors).length) return error(400, "入力内容を確認してください", { fieldErrors });

  // 同じメールアドレスからの連続送信を制限（1分に1件、1時間に5件まで）
  const recent = await env.DB.prepare(
    "SELECT SUM(created_at >= ?2) AS m1, COUNT(*) AS h1 FROM inquiries WHERE email = ?1 AND created_at >= ?3",
  )
    .bind(email, new Date(Date.now() - 60_000).toISOString().replace(/\.\d{3}Z$/, "Z"), new Date(Date.now() - 3600_000).toISOString().replace(/\.\d{3}Z$/, "Z"))
    .first<{ m1: number | null; h1: number }>();
  if ((recent?.m1 ?? 0) > 0 || (recent?.h1 ?? 0) >= 5) return error(429, "短時間に何度も送信されています。しばらく待ってからお試しください");

  // イベント・メニューが実在して公開中かを確認（存在しない番号は外す）
  let eventId = idOrNull(b.event_id);
  if (eventId && !(await env.DB.prepare("SELECT 1 FROM events WHERE id = ?1 AND status = 'published'").bind(eventId).first())) eventId = null;
  let serviceId = idOrNull(b.service_id);
  if (serviceId && !(await env.DB.prepare("SELECT 1 FROM services WHERE id = ?1 AND status = 'published'").bind(serviceId).first())) serviceId = null;

  const r = await env.DB.prepare(
    `INSERT INTO inquiries (purpose, service_id, event_id, name, email, phone, preferred_date, people, experience, budget, message, source_page, summary, consent_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)`,
  )
    .bind(purpose, serviceId, eventId, name, email, str(b.phone, 30), str(b.preferred_date, 100), people, str(b.experience, 100), str(b.budget, 100), message, str(b.source_page, 300), str(b.summary, 1000), nowIso())
    .run();
  const inquiryId = Number(r.meta.last_row_id);

  // イベントの申し込みなら、申し込み者一覧にも入れる（状態は「申込」。確定は管理画面で行う）
  if (purpose === "event" && eventId) {
    await env.DB.prepare("INSERT INTO event_entries (event_id, inquiry_id, people) VALUES (?1, ?2, ?3)").bind(eventId, inquiryId, people ?? 1).run();
  }

  // 通知メールの送り方は未決（バックオフィス仕様書 B-02）。決まったらここで送る
  return json({ ok: true }, { status: 201 });
};
