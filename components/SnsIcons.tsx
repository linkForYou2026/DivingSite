// SNSアイコン。data/site.json の sns に URL を入れると表示されます
import { site } from "@/lib/data";

export default function SnsIcons({ className = "" }: { className?: string }) {
  const list = site.sns.filter((s) => s.url);
  if (!list.length) return <p className={`text-xs opacity-80 ${className}`}>SNSは準備中です</p>;
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`} aria-label="SNS">
      {list.map((s) => (
        <li key={s.id}>
          <a
            href={s.url}
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
