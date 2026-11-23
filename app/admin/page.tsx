"use client";

// BO-01 ダッシュボード
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/components/admin/api";
import { useAdmin } from "@/components/admin/AdminContext";
import { Alert, Card, PageTitle, btnPrimary } from "@/components/admin/ui";
import { enumLabel } from "@/shared/enums";
import { formatJst } from "@/shared/format";

type Dash = {
  inquiries?: { newCount: number; latest: { id: number; created_at: string; purpose: string; name: string | null }[] };
  events: { id: number; title: string; start_at: string; capacity: number | null; entry_status: string; status: string; entries: number }[];
  stalePrices: { days: number; items: { table: string; tableLabel: string; id: number; title: string; checked_on: string }[] };
  deploy: {
    last_deploy_at?: string;
    last_deploy_result?: string;
    last_deploy_by?: string;
    pending: { table: string; label: string; count: number }[];
    hookConfigured: boolean;
    canDeploy: boolean;
  };
};

export default function Dashboard() {
  const { can } = useAdmin();
  const [d, setD] = useState<Dash | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    apiGet<Dash>("/api/admin/dashboard").then(setD).catch((e) => setErr(e.message));
  }, []);
  useEffect(load, [load]);

  const deploy = async () => {
    if (!confirm("公開中のデータでサイトを組み立て直します。よろしいですか？（数分かかります）")) return;
    setBusy(true);
    setErr("");
    try {
      await apiSend("POST", "/api/admin/deploy");
      setMsg("サイトの組み立てを開始しました。数分後にサイトに反映されます。");
      load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (err && !d) return <Alert>{err}</Alert>;
  if (!d) return <p className="text-slate-500">読み込んでいます…</p>;
  const pendingTotal = d.deploy.pending.reduce((s, p) => s + p.count, 0);

  return (
    <>
      <PageTitle>ダッシュボード</PageTitle>
      {err && <Alert>{err}</Alert>}
      {msg && <Alert kind="ok">{msg}</Alert>}
      <div className="grid gap-4 lg:grid-cols-2">
        {d.inquiries && (
          <Card title={<>未対応の問い合わせ <span className="ml-2 rounded-full bg-red-700 px-2 text-sm text-white">{d.inquiries.newCount}</span></>}>
            {d.inquiries.latest.length ? (
              <ul className="divide-y text-sm">
                {d.inquiries.latest.map((i) => (
                  <li key={i.id}>
                    <Link href={`/admin/inquiries/view/?id=${i.id}`} className="flex gap-3 py-2 hover:bg-slate-50">
                      <span className="text-slate-500">{formatJst(i.created_at)}</span>
                      <span className="font-bold">{enumLabel("inquiry_purpose", i.purpose)}</span>
                      <span>{i.name ?? "（消去済み）"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">未対応の問い合わせはありません。</p>
            )}
            <p className="mt-2 text-right text-sm"><Link href="/admin/inquiries/" className="text-ocean underline">問い合わせ一覧へ</Link></p>
          </Card>
        )}

        <Card title="サイトに反映">
          <p className="text-sm">
            資格・スポット・FAQ などは、保存したあと「サイトに反映」を押すとサイトに出ます（数分）。料金・イベント・お知らせは保存するとすぐ出ます。
          </p>
          <p className="mt-3 text-sm">
            反映待ち：<strong className="text-lg">{pendingTotal}</strong> 件
          </p>
          {d.deploy.pending.length > 0 && (
            <ul className="mt-1 text-sm text-slate-600">
              {d.deploy.pending.map((p) => <li key={p.table}>・{p.label}：{p.count}件</li>)}
            </ul>
          )}
          <p className="mt-2 text-xs text-slate-500">
            前回の反映：{d.deploy.last_deploy_at ? `${formatJst(d.deploy.last_deploy_at)}（${d.deploy.last_deploy_by ?? ""}）` : "まだありません"}
            {d.deploy.last_deploy_result === "failed" && <span className="ml-2 font-bold text-red-700">前回は開始に失敗しました</span>}
          </p>
          {d.deploy.canDeploy &&
            (d.deploy.hookConfigured ? (
              <button type="button" className={`${btnPrimary} mt-3`} onClick={deploy} disabled={busy}>
                {busy ? "開始しています…" : "サイトに反映"}
              </button>
            ) : (
              <p className="mt-3 rounded bg-amber-50 p-2 text-xs text-amber-900">デプロイフック（DEPLOY_HOOK_URL）が未設定のため、まだ押せません。</p>
            ))}
          <p className="mt-2 text-xs text-slate-500">組み立ての進み具合（成功・失敗）は、Cloudflare の「Workers & Pages → diving-site → デプロイ」で確認できます。</p>
        </Card>

        <Card title="今後30日のイベント">
          {d.events.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500"><th className="py-1">日時</th><th>イベント</th><th className="text-right">申込／定員</th></tr>
              </thead>
              <tbody className="divide-y">
                {d.events.map((e) => (
                  <tr key={e.id}>
                    <td className="py-1.5">{formatJst(e.start_at)}</td>
                    <td><Link href={`/admin/edit/?table=events&id=${e.id}`} className="text-ocean underline">{e.title}</Link>{e.status !== "published" && <span className="ml-1 text-xs text-amber-700">（{enumLabel("status", e.status)}）</span>}</td>
                    <td className="text-right">{e.entries}／{e.capacity ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-500">予定しているイベントはありません。</p>
          )}
        </Card>

        <Card title={`金額の確認期限（確認日から${d.stalePrices.days}日以上）`}>
          {d.stalePrices.items.length ? (
            <ul className="divide-y text-sm">
              {d.stalePrices.items.map((s) => (
                <li key={s.table + s.id} className="flex gap-3 py-1.5">
                  <span className="text-slate-500">{s.checked_on}</span>
                  <span className="text-slate-600">{s.tableLabel}</span>
                  {can(s.table === "spots" || s.table === "gear_items" ? "content" : "prices") ? (
                    <Link href={`/admin/edit/?table=${s.table}&id=${s.id}`} className="text-ocean underline">{s.title}</Link>
                  ) : (
                    <span>{s.title}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">見直しが必要な金額はありません。</p>
          )}
        </Card>
      </div>
    </>
  );
}
