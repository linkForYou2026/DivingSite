"use client";

// BO-11 問い合わせ詳細（owner だけ）
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/components/admin/api";
import { useAdmin } from "@/components/admin/AdminContext";
import { Alert, Card, PageTitle, btnGhost, btnPrimary, inputCls } from "@/components/admin/ui";
import { EVENT_ENTRY_STATUS, HANDLING_STATUS, enumLabel } from "@/shared/enums";
import { formatJst } from "@/shared/format";

type Inq = Record<string, string | number | null>;
type Log = { id: number; action: string; body: string | null; created_at: string; updated_by: string };
type Entry = { id: number; event_id: number; people: number; entry_status: string; memo: string | null; updated_at: string };
type Res = { row: Inq; logs: Log[]; entries: Entry[]; assignees: { email: string; display_name: string }[] };

const ROWS: [string, string][] = [
  ["purpose", "用件"], ["service_name", "依頼メニュー"], ["event_title", "イベント"], ["name", "お名前"], ["email", "メールアドレス"], ["phone", "電話番号"],
  ["preferred_date", "希望日・時期"], ["people", "人数"], ["experience", "経験"], ["budget", "予算"], ["summary", "自動入力された相談内容"], ["source_page", "送信元ページ"],
];
const ACTION_LABEL: Record<string, string> = { status_change: "対応状況", note: "メモ", replied: "返信" };

function Inner() {
  const { can } = useAdmin();
  const id = Number(useSearchParams().get("id"));
  const [d, setD] = useState<Res | null>(null);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(() => apiGet<Res>(`/api/admin/inquiries/${id}`).then(setD).catch((e) => setErr(e.message)), [id]);
  useEffect(() => {
    if (can("inquiries") && id) load();
  }, [id, load, can]);

  if (!can("inquiries")) return <Alert>問い合わせを見る権限がありません。</Alert>;
  if (err && !d) return <Alert>{err}</Alert>;
  if (!d) return <p className="text-slate-500">読み込んでいます…</p>;
  const r = d.row;

  const update = async (patch: { handling_status?: string; assignee?: string | null }) => {
    setErr("");
    try {
      await apiSend("PUT", `/api/admin/inquiries/${id}`, patch);
      setOk("更新しました");
      load();
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  const addNote = async (action: "note" | "replied") => {
    setErr("");
    try {
      await apiSend("POST", `/api/admin/inquiries/${id}/notes`, { body: note, action });
      setNote("");
      setOk(action === "replied" ? "「返信した」と記録しました" : "メモを残しました");
      load();
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  const gmail = r.email
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(String(r.email))}&su=${encodeURIComponent(`Re: 【お問い合わせ】${enumLabel("inquiry_purpose", String(r.purpose))}`)}`
    : null;

  return (
    <>
      <p className="mb-1 text-sm"><Link href="/admin/inquiries/" className="text-ocean underline">← 問い合わせ一覧</Link></p>
      <PageTitle>問い合わせ #{id}（{formatJst(String(r.created_at))}）</PageTitle>
      {err && <Alert>{err}</Alert>}
      {ok && <Alert kind="ok">{ok}</Alert>}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card title="送信内容">
            {r.deleted_at && <Alert kind="info">保存期間を過ぎたため、名前・連絡先は {formatJst(String(r.deleted_at))} に消去しました。</Alert>}
            <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
              {ROWS.filter(([k]) => r[k] !== null && r[k] !== undefined && r[k] !== "").map(([k, label]) => (
                <div key={k} className="contents">
                  <dt className="font-bold text-slate-600">{label}</dt>
                  <dd className="break-all">{k === "purpose" ? enumLabel("inquiry_purpose", String(r[k])) : String(r[k])}</dd>
                </div>
              ))}
            </dl>
            <h3 className="mt-4 text-sm font-bold text-slate-600">内容</h3>
            <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-[15px]">{String(r.message)}</p>
            <p className="mt-2 text-xs text-slate-500">個人情報の同意：{formatJst(String(r.consent_at))}</p>
          </Card>
          {d.entries.length > 0 && (
            <Card title="イベントの申し込み">
              {d.entries.map((e) => (
                <p key={e.id} className="text-sm">
                  {e.people}人・{EVENT_ENTRY_STATUS[e.entry_status as keyof typeof EVENT_ENTRY_STATUS]}{" "}
                  <Link href={`/admin/edit/?table=event_entries&id=${e.id}`} className="text-ocean underline">確定・取消を変更</Link>
                </p>
              ))}
            </Card>
          )}
          <Card title="対応の記録">
            <ul className="space-y-2 text-sm">
              {d.logs.map((l) => (
                <li key={l.id} className="rounded-lg border p-2">
                  <span className="text-xs text-slate-500">{formatJst(l.created_at)}・{l.updated_by}・{ACTION_LABEL[l.action]}</span>
                  {l.body && <p className="whitespace-pre-wrap">{l.body}</p>}
                </li>
              ))}
              {!d.logs.length && <li className="text-slate-500">まだ記録はありません</li>}
            </ul>
            <label htmlFor="note" className="mt-4 block text-sm font-bold">メモ</label>
            <textarea id="note" rows={3} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="mt-2 flex flex-wrap gap-2">
              <button className={btnPrimary} disabled={!note.trim()} onClick={() => addNote("note")}>メモを残す</button>
              <button className={btnGhost} onClick={() => addNote("replied")}>「返信した」と記録</button>
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="対応状況">
            <label htmlFor="hs" className="sr-only">対応状況</label>
            <select id="hs" className={inputCls} value={String(r.handling_status)} onChange={(e) => update({ handling_status: e.target.value })}>
              {Object.entries(HANDLING_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <label htmlFor="as" className="mt-3 block text-sm font-bold">担当者</label>
            <select id="as" className={inputCls} value={String(r.assignee ?? "")} onChange={(e) => update({ assignee: e.target.value || null })}>
              <option value="">（なし）</option>
              {d.assignees.map((a) => <option key={a.email} value={a.email}>{a.display_name}</option>)}
            </select>
          </Card>
          <Card title="返信">
            {gmail ? (
              <a href={gmail} target="_blank" rel="noopener noreferrer" className={`${btnPrimary} block text-center`}>Gmail で返信を書く</a>
            ) : (
              <p className="text-sm text-slate-500">連絡先が消去されているため返信できません。</p>
            )}
            <p className="mt-2 text-xs text-slate-500">宛先と件名が入った状態で Gmail が開きます。送ったら「返信した」と記録し、対応状況を「返信待ち」にしてください。</p>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
