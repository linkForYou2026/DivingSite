"use client";

// SNSアイコン。管理画面の「サイト設定」で各SNSのURLを入れると表示されます
import { usePublicSettings } from "@/lib/live";

const SNS = [
  { key: "sns_instagram", label: "Instagram", short: "IG", color: "#d6249f" },
  { key: "sns_youtube", label: "YouTube", short: "YT", color: "#ff0000" },
  { key: "sns_tiktok", label: "TikTok", short: "TT", color: "#111111" },
  { key: "sns_facebook", label: "Facebook", short: "FB", color: "#1877f2" },
];

export default function SnsIcons({ className = "" }: { className?: string }) {
  const { data } = usePublicSettings();
  const list = SNS.filter((s) => data?.[s.key]);
  if (!list.length) return null;
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`} aria-label="SNS">
      {list.map((s) => (
        <li key={s.key}>
          <a
            href={data![s.key]!}
            target="_blank"
            rel="noopener noreferrer"
            title={s.label}
            aria-label={`${s.label}（新しいタブで開きます）`}
            className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-extrabold text-white"
            style={{ background: s.color }}
          >
            {s.short}
          </a>
        </li>
      ))}
    </ul>
  );
}
