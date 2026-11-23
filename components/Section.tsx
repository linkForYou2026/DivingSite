// 見出しつきのまとまり
export default function Section({
  title,
  en,
  lead,
  children,
  className = "",
}: {
  title: string;
  en?: string;
  lead?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`mt-12 ${className}`}>
      <h2 className="flex items-baseline gap-3 text-xl font-bold text-pro md:text-2xl">
        {title}
        {en && <small className="text-xs font-bold tracking-widest text-ocean">{en}</small>}
      </h2>
      {lead && <p className="mt-1 text-sm text-slate-600">{lead}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
