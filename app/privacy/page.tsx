// プライバシーポリシー（ひな形。公開前に内容を確認してください）
import PageHeader from "@/components/PageHeader";
import { site } from "@/lib/data";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta("プライバシーポリシー", `${site.name}における個人情報の取り扱いについて。`, "/privacy/");

const SECTIONS: [string, string[]][] = [
  ["取得する情報", ["お問い合わせフォームでご入力いただいた、お名前・メールアドレス・電話番号・ご相談内容などの情報。"]],
  ["利用目的", ["お問い合わせへの回答、講習・イベントのご案内と運営、お仕事のご依頼への対応のために利用します。"]],
  ["第三者への提供", ["法令に基づく場合を除き、ご本人の同意なく第三者に提供しません。"]],
  ["外部サービスの利用", [
    "お問い合わせの受付に Google フォームを利用しています。",
    "動画・SNSの表示に YouTube、Instagram、TikTok、Facebook の埋め込み機能を利用しており、各サービスがクッキー等を利用する場合があります。",
  ]],
  ["開示・訂正・削除", ["ご本人からの求めに応じて、保有する個人情報の開示・訂正・削除に対応します。お問い合わせフォームからご連絡ください。"]],
  ["改定", ["本ポリシーの内容は、必要に応じて変更することがあります。"]],
];

export default function Page() {
  return (
    <>
      <PageHeader title="プライバシーポリシー" />
      <div className="mx-auto max-w-3xl px-4 pt-8 text-[15px]">
        <p>{site.name}（以下「当サイト」）は、ご提供いただいた個人情報を次のとおり取り扱います。</p>
        {SECTIONS.map(([h, ps]) => (
          <section key={h} className="mt-6">
            <h2 className="text-lg font-bold text-pro">{h}</h2>
            {ps.map((p) => <p key={p} className="mt-1">{p}</p>)}
          </section>
        ))}
        <p className="mt-8 text-sm text-slate-500">制定日：2026年11月（準備中のひな形です）</p>
      </div>
    </>
  );
}
