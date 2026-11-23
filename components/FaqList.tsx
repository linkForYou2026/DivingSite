// よくある質問（仕様書 F-13）。開閉式＋検索エンジン向けの構造化データ
import { faq } from "@/lib/data";

export default function FaqList({ categories }: { categories?: string[] }) {
  const cats = (categories ?? faq.categories).filter((c) => faq.items.some((f) => f.category === c));
  const items = faq.items.filter((f) => cats.includes(f.category));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <div>
      {cats.map((c) => (
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
                <div className="border-t border-sky-100 px-4 py-3 text-[15px]">
                  <span className="font-bold text-orange-700">A. </span>
                  {f.a}
                </div>
              </details>
            ))}
        </section>
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
