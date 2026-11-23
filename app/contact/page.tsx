// 依頼・お問い合わせ（仕様書 6.12／F-03）
import PageHeader from "@/components/PageHeader";
import ContactForm from "@/components/ContactForm";
import ContactHours from "@/components/ContactHours";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta("依頼・お問い合わせ", "講習の申し込み、ブランク相談、イベント参加、お仕事のご依頼はこちらから。", "/contact/");

export default function Page() {
  return (
    <>
      <PageHeader title="依頼・お問い合わせ" lead="講習の申し込み・ご相談・お仕事のご依頼はこちらから。" />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 pt-8 md:grid-cols-[2fr_1fr]">
        <ContactForm />
        <aside className="self-start rounded-2xl border border-sky-100 bg-sky-50/60 p-5 text-sm leading-relaxed">
          <h2 className="font-bold text-ocean-deep">受付について</h2>
          <p className="mt-1"><ContactHours withReply /></p>
          <p className="mt-2">送信いただいた内容を確認し、ご入力のメールアドレスにご連絡します。</p>
        </aside>
      </div>
    </>
  );
}
