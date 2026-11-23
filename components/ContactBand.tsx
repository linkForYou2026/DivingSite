// ページ下の「お問い合わせ」帯（どのページからも1〜2タップで問い合わせへ：仕様書9章）
import Link from "next/link";
import { contactHref } from "@/lib/data";
import ContactHours from "./ContactHours";

export default function ContactBand({
  title = "お気軽にご相談ください",
  text = "講習の申し込み、ブランクからの再開、仕事のご依頼まで。",
  button = "お問い合わせフォームへ",
  purpose,
}: {
  title?: string;
  text?: string;
  button?: string;
  purpose?: string;
}) {
  return (
    <div className="mt-14 flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-gradient-to-r from-[#01579b] to-ocean-deep p-6 text-white">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm opacity-90">{text}</p>
        <p className="mt-1 text-sm opacity-90"><ContactHours /></p>
      </div>
      <Link href={contactHref({ purpose })} className="btn btn-warm">
        {button}
      </Link>
    </div>
  );
}
