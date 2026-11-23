"use client";

// 受付時間・返信の目安（管理画面の「サイト設定」）
import { usePublicSettings } from "@/lib/live";

export default function ContactHours({ withReply = false }: { withReply?: boolean }) {
  const { data } = usePublicSettings();
  const hours = data?.contact_hours;
  const days = data?.reply_days;
  if (!hours && !(withReply && days)) return null;
  return (
    <>
      {hours && <span className="block">受付時間：{hours}</span>}
      {withReply && days && <span className="block">原則{days}営業日以内にご返信します。</span>}
    </>
  );
}
