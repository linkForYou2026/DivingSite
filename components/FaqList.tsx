// よくある質問（F-13）。開閉式＋検索エンジン向けの構造化データ
import type { FaqView } from "@/lib/content";

export default function FaqList({ categories, items }: { categories: string[]; items: FaqView[] }) {
  if (!items.length) return <p className="rounded-xl bg-sky-50 p-6 text-center text-slate-600">よくある質問は準備中です。</p>;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.aText } })),
  };
  return (
    <div>
      {categories.map((c) => (
        <section key={c} className="mt-8 first:mt-0">
          <h2 className="mb-3 text-lg font-bold text-pro">{c}</h2>
          {items
            .filter((f) => f.category === c)
            .map((f) => (
              <details key={f.q} className="group mb-2 rounded-xl border border-sky-100 bg-white">
                <summary className="cursor-pointer list-none px-4 py-3 font-bold">
                  <span className="text-ocean">Q. </span>
                  {f.q}
                  <span className="float-right text-ocean transition group-open:rotate-180" aria-hidden="true">▾</span>
                </summary>
                <div className="flex gap-1 border-t border-sky-100 px-4 py-3 text-[15px]">
                  <span className="font-bold text-orange-700">A.</span>
                  <div className="prose-blog [&>p:last-child]:mb-0" dangerouslySetInnerHTML={{ __html: f.aHtml }} />
                </div>
              </details>
            ))}
        </section>
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
