"use client";

// 依頼・問い合わせフォーム（F-03）
// 送信すると /api/inquiries でデータベースに保存され、管理画面の「問い合わせ」に届く
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { usePrices } from "@/lib/live";
import { INQUIRY_PURPOSE, purposeCode } from "@/shared/enums";
import { WORK_KINDS } from "./ServiceCards";

const field = "w-full rounded-xl border-[1.5px] border-sky-100 bg-white px-3 py-2 text-base";
const Req = () => <span className="ml-1.5 rounded bg-red-700 px-1.5 align-[1px] text-[11px] text-white">必須</span>;
const Opt = () => <span className="ml-1.5 rounded bg-slate-500 px-1.5 align-[1px] text-[11px] text-white">任意</span>;
const Err = ({ id, msg }: { id: string; msg?: string }) => (msg ? <p id={id} className="mt-1 text-sm font-bold text-red-700">{msg}</p> : null);

const EXPERIENCE = ["未経験", "体験ダイビングのみ", "OW（〜20本）", "AOW以上（20〜100本）", "100本以上", "プロ資格あり"];
const BUDGET = ["〜3万円", "〜10万円", "〜30万円", "30万円以上", "相談したい"];

export default function ContactForm() {
  const prices = usePrices();
  const workServices = (prices.data?.services ?? []).filter((s) => WORK_KINDS.includes(s.kind));
  const [v, setV] = useState({
    purpose: "", service_id: "", name: "", email: "", phone: "", preferred_date: "", people: "1", experience: "", budget: "", message: "", consent: false, website: "",
  });
  const [ctx, setCtx] = useState({ event_id: "", summary: "", source_page: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  // 他のページのボタンから来たとき：用件・内容・イベント・メニューを選んだ状態にする
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const detail = p.get("detail") ?? "";
    const kind = p.get("kind") ?? "";
    setV((s) => ({ ...s, purpose: purposeCode(p.get("purpose")) || s.purpose, service_id: p.get("service") ?? "", message: detail || (kind ? `「${kind}」について` : "") }));
    let from = "";
    try {
      const r = document.referrer ? new URL(document.referrer) : null;
      if (r && r.origin === window.location.origin) from = r.pathname;
    } catch {
      /* 送信元が読めないときは空 */
    }
    setCtx({ event_id: p.get("event") ?? "", summary: detail, source_page: from });
  }, []);

  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const miss: Record<string, string> = {};
    if (!v.purpose) miss.purpose = "用件を選んでください";
    if (!v.name.trim()) miss.name = "お名前を入力してください";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email.trim())) miss.email = "メールアドレスを確認してください";
    if (!v.message.trim()) miss.message = "内容を入力してください";
    if (!v.consent) miss.consent = "個人情報の取り扱いへの同意が必要です";
    setErrors(miss);
    if (Object.keys(miss).length) {
      document.getElementById("f-" + Object.keys(miss)[0])?.focus();
      return;
    }
    setStatus("sending");
    setErrMsg("");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...v,
          service_id: v.purpose === "work" || v.service_id ? v.service_id || null : null,
          event_id: v.purpose === "event" ? ctx.event_id || null : null,
          summary: ctx.summary || null,
          source_page: ctx.source_page || null,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; fieldErrors?: Record<string, string> };
      if (!res.ok) {
        setErrors(body.fieldErrors || {});
        throw new Error(body.error || "送信できませんでした");
      }
      setStatus("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setStatus("error");
      setErrMsg((err as Error).message);
    }
  };

  if (status === "done") {
    return (
      <div role="status" className="rounded-2xl border border-green-300 bg-green-50 p-6">
        <h2 className="text-lg font-bold text-green-900">送信しました</h2>
        <p className="mt-2 text-[15px]">お問い合わせありがとうございます。内容を確認して、ご入力のメールアドレスにご連絡します。</p>
        <p className="mt-4"><Link href="/" className="text-ocean underline">トップへ戻る</Link></p>
      </div>
    );
  }

  const aria = (k: string) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `e-${k}` : undefined });

  return (
    <form onSubmit={onSubmit} noValidate className="relative grid gap-4 rounded-2xl border border-sky-100 bg-sky-50/60 p-4 md:p-5">
      <div>
        <label htmlFor="f-purpose" className="mb-1 block text-sm font-bold">用件<Req /></label>
        <select id="f-purpose" className={field} value={v.purpose} onChange={set("purpose")} {...aria("purpose")}>
          <option value="">選択してください</option>
          {Object.entries(INQUIRY_PURPOSE).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
        <Err id="e-purpose" msg={errors.purpose} />
      </div>
      {v.purpose === "work" && workServices.length > 0 && (
        <div>
          <label htmlFor="f-service" className="mb-1 block text-sm font-bold">依頼の種類<Opt /></label>
          <select id="f-service" className={field} value={v.service_id} onChange={set("service_id")}>
            <option value="">選択してください</option>
            {workServices.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="f-name" className="mb-1 block text-sm font-bold">お名前<Req /></label>
          <input id="f-name" className={field} autoComplete="name" value={v.name} onChange={set("name")} {...aria("name")} />
          <Err id="e-name" msg={errors.name} />
        </div>
        <div>
          <label htmlFor="f-email" className="mb-1 block text-sm font-bold">メールアドレス<Req /></label>
          <input id="f-email" type="email" className={field} autoComplete="email" value={v.email} onChange={set("email")} {...aria("email")} />
          <Err id="e-email" msg={errors.email} />
        </div>
        <div>
          <label htmlFor="f-phone" className="mb-1 block text-sm font-bold">電話番号<Opt /></label>
          <input id="f-phone" type="tel" className={field} autoComplete="tel" value={v.phone} onChange={set("phone")} />
        </div>
        <div>
          <label htmlFor="f-date" className="mb-1 block text-sm font-bold">希望日・時期<Opt /></label>
          <input id="f-date" className={field} placeholder="例：12月の週末" value={v.preferred_date} onChange={set("preferred_date")} />
        </div>
        <div>
          <label htmlFor="f-people" className="mb-1 block text-sm font-bold">人数<Opt /></label>
          <input id="f-people" type="number" min={1} max={100} className={field} value={v.people} onChange={set("people")} {...aria("people")} />
          <Err id="e-people" msg={errors.people} />
        </div>
        <div>
          <label htmlFor="f-exp" className="mb-1 block text-sm font-bold">ダイビング経験<Opt /></label>
          <select id="f-exp" className={field} value={v.experience} onChange={set("experience")}>
            <option value="">選択してください</option>
            {EXPERIENCE.map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="f-budget" className="mb-1 block text-sm font-bold">ご予算<Opt /></label>
        <select id="f-budget" className={field} value={v.budget} onChange={set("budget")}>
          <option value="">選択してください</option>
          {BUDGET.map((x) => <option key={x}>{x}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="f-message" className="mb-1 block text-sm font-bold">内容<Req /></label>
        <textarea id="f-message" rows={6} className={field} value={v.message} onChange={set("message")} {...aria("message")} />
        <Err id="e-message" msg={errors.message} />
      </div>
      {/* ロボット対策の見えない入力欄（人は入力しない） */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="f-website">ウェブサイト</label>
        <input id="f-website" tabIndex={-1} autoComplete="off" value={v.website} onChange={set("website")} />
      </div>
      <div>
        <label className="flex items-center gap-2 text-sm">
          <input id="f-consent" type="checkbox" className="h-5 w-5" checked={v.consent} onChange={(e) => setV({ ...v, consent: e.target.checked })} {...aria("consent")} />
          <span>
            <a href="/privacy/" target="_blank" className="text-ocean underline">個人情報の取り扱い</a>に同意する<Req />
          </span>
        </label>
        <Err id="e-consent" msg={errors.consent} />
      </div>
      {status === "error" && (
        <p role="alert" className="rounded-lg bg-sand px-3 py-2 text-sm text-amber-900">{errMsg}</p>
      )}
      <button type="submit" className="btn btn-warm" disabled={status === "sending"}>
        {status === "sending" ? "送信しています…" : "送信する"}
      </button>
    </form>
  );
}
