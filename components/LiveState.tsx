// 即時データの「読み込み中」「読み込めない」「まだない」の表示
export default function LiveState({ loading, error, empty, emptyText = "準備中です。" }: { loading: boolean; error: boolean; empty: boolean; emptyText?: string }) {
  if (loading) return <p className="rounded-xl bg-sky-50 p-5 text-center text-sm text-slate-500" aria-live="polite">読み込んでいます…</p>;
  if (error) return <p className="rounded-xl bg-sky-50 p-5 text-center text-sm text-slate-600">情報を読み込めませんでした。時間をおいて開き直してください。</p>;
  if (empty) return <p className="rounded-xl bg-sky-50 p-5 text-center text-sm text-slate-600">{emptyText}</p>;
  return null;
}
