// 仕事メニュー（仕様書 F-02）
import Link from "next/link";
import { contactHref, works } from "@/lib/data";

export default function WorkCards({ limit, withButton = true }: { limit?: number; withButton?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {works.items.slice(0, limit ?? 99).map((w) => (
        <article key={w.id} className="flex flex-col gap-1.5 rounded-2xl border border-sky-100 bg-white p-4">
          <span className="text-3xl" aria-hidden="true">{w.icon}</span>
          <h3 className="font-bold">{w.name}</h3>
          <p className="text-sm text-slate-600">{w.description}</p>
          <p className="mt-auto text-lg font-extrabold text-pro">{w.price}</p>
          {withButton && (
            <Link href={contactHref({ purpose: "仕事の依頼", kind: w.name })} className="btn btn-warm text-sm">
              この内容で依頼する
            </Link>
          )}
        </article>
      ))}
    </div>
  );
}
