"use client";

// 依頼・問い合わせフォーム（仕様書 F-03）
// - data/site.json の contactForm.googleFormUrl が入っていれば、Googleフォームを埋め込む（用件などを選択済みにして開く）
// - まだ入っていない間は、同じ項目のフォームを表示し、メール（contact.email）で送る形にする
import { FormEvent, useEffect, useState } from "react";
import { site, works } from "@/lib/data";

const field = "w-full rounded-xl border-[1.5px] border-sky-100 bg-white px-3 py-2 text-base";
const Req = () => <span className="ml-1.5 rounded bg-red-700 px-1.5 align-[1px] text-[11px] text-white">必須</span>;
const Opt = () => <span className="ml-1.5 rounded bg-slate-500 px-1.5 align-[1px] text-[11px] text-white">任意</span>;

function readParams() {
  const p = new URLSearchParams(window.location.search);
  return { purpose: p.get("purpose") ?? "", kind: p.get("kind") ?? "", detail: p.get("detail") ?? "" };
}

function GoogleFormEmbed({ purpose, kind, detail }: { purpose: string; kind: string; detail: string }) {
  const f = site.contactForm;
  const u = new URL(f.googleFormUrl);
  if (purpose || kind || detail) u.searchParams.set("usp", "pp_url");
  if (purpose && f.entryPurpose) u.searchParams.set(f.entryPurpose, purpose);
  if (kind && f.entryKind) u.searchParams.set(f.entryKind, kind);
  if (detail && f.entryDetail) u.searchParams.set(f.entryDetail, detail);
  return (
    <iframe src={u.toString()} title="お問い合わせフォーム" className="w-full rounded-2xl border border-sky-100 bg-white" style={{ height: f.height }} loading="lazy">
      読み込んでいます…
    </iframe>
  );
}

export default function ContactForm() {
  const [v, setV] = useState({
    purpose: "", kind: "", name: "", email: "", tel: "", date: "", people: "1", exp: "", budget: "", message: "", agree: false,
  });
  const [ready, setReady] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState("");

  useEffect(() => {
    const p = readParams();
    setV((s) => ({ ...s, purpose: site.purposes.includes(p.purpose) ? p.purpose : s.purpose, kind: p.kind, message: p.detail }));
    setReady(true);
  }, []);

  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value });

  if (site.contactForm.googleFormUrl) {
    return ready ? <GoogleFormEmbed purpose={v.purpose} kind={v.kind} detail={v.message} /> : null;
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const miss: string[] = [];
    if (!v.purpose) miss.push("用件");
    if (!v.name.trim()) miss.push("お名前");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) miss.push("メールアドレス");
    if (!v.message.trim()) miss.push("内容");
    if (!v.agree) miss.push("個人情報の取り扱いへの同意");
    setErrors(miss);
    if (miss.length) return;
    if (!site.contact.email) {
      setDone("お問い合わせの受付は準備中です。公開までもうしばらくお待ちください。");
      return;
    }
    const body = [
      `用件：${v.purpose}`,
      v.purpose === "仕事の依頼" && v.kind ? `依頼の種類：${v.kind}` : "",
      `お名前：${v.name}`,
      `メールアドレス：${v.email}`,
      v.tel ? `電話番号：${v.tel}` : "",
      v.date ? `希望日・時期：${v.date}` : "",
      `人数：${v.people}`,
      v.exp ? `ダイビング経験：${v.exp}` : "",
      v.budget ? `ご予算：${v.budget}` : "",
    ].filter(Boolean).join("\n") + "\n\n" + v.message;
    window.location.href = `mailto:${site.contact.email}?subject=${encodeURIComponent(`【お問い合わせ】${v.purpose}`)}&body=${encodeURIComponent(body)}`;
    setDone("メールソフトが開きます。内容を確認して送信してください。");
  };

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 rounded-2xl border border-sky-100 bg-sky-50/60 p-4 md:p-5">
      <div>
        <label htmlFor="f-purpose" className="mb-1 block text-sm font-bold">用件<Req /></label>
        <select id="f-purpose" className={field} value={v.purpose} onChange={set("purpose")}>
          <option value="">選択してください</option>
          {site.purposes.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      {v.purpose === "仕事の依頼" && (
        <div>
          <label htmlFor="f-kind" className="mb-1 block text-sm font-bold">依頼の種類<Opt /></label>
          <select id="f-kind" className={field} value={v.kind} onChange={set("kind")}>
            <option value="">選択してください</option>
            {works.items.map((w) => <option key={w.id}>{w.name}</option>)}
          </select>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="f-name" className="mb-1 block text-sm font-bold">お名前<Req /></label>
          <input id="f-name" className={field} autoComplete="name" value={v.name} onChange={set("name")} />
        </div>
        <div>
          <label htmlFor="f-email" className="mb-1 block text-sm font-bold">メールアドレス<Req /></label>
          <input id="f-email" type="email" className={field} autoComplete="email" value={v.email} onChange={set("email")} />
        </div>
        <div>
          <label htmlFor="f-tel" className="mb-1 block text-sm font-bold">電話番号<Opt /></label>
          <input id="f-tel" type="tel" className={field} autoComplete="tel" value={v.tel} onChange={set("tel")} />
        </div>
        <div>
          <label htmlFor="f-date" className="mb-1 block text-sm font-bold">希望日・時期<Opt /></label>
          <input id="f-date" type="date" className={field} value={v.date} onChange={set("date")} />
        </div>
        <div>
          <label htmlFor="f-people" className="mb-1 block text-sm font-bold">人数<Opt /></label>
          <input id="f-people" type="number" min={1} className={field} value={v.people} onChange={set("people")} />
        </div>
        <div>
          <label htmlFor="f-exp" className="mb-1 block text-sm font-bold">ダイビング経験<Opt /></label>
          <select id="f-exp" className={field} value={v.exp} onChange={set("exp")}>
            <option value="">選択してください</option>
            {["未経験", "体験ダイビングのみ", "OW（〜20本）", "AOW以上（20〜100本）", "100本以上", "プロ資格あり"].map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="f-budget" className="mb-1 block text-sm font-bold">ご予算<Opt /></label>
        <select id="f-budget" className={field} value={v.budget} onChange={set("budget")}>
          <option value="">選択してください</option>
          {["〜3万円", "〜10万円", "〜30万円", "30万円以上", "相談したい"].map((x) => <option key={x}>{x}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="f-msg" className="mb-1 block text-sm font-bold">内容<Req /></label>
        <textarea id="f-msg" rows={6} className={field} value={v.message} onChange={set("message")} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="h-5 w-5" checked={v.agree} onChange={(e) => setV({ ...v, agree: e.target.checked })} />
        <span>
          <a href="/privacy/" target="_blank" className="text-ocean underline">個人情報の取り扱い</a>に同意する<Req />
        </span>
      </label>
      {errors.length > 0 && (
        <p role="alert" className="rounded-lg bg-sand px-3 py-2 text-sm text-amber-900">入力してください：{errors.join("、")}</p>
      )}
      <button type="submit" className="btn btn-warm">送信する</button>
      {done && <p role="status" className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm">{done}</p>}
    </form>
  );
}
