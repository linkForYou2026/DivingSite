// イベント・ツアー（仕様書 6.7／F-07）。管理画面で登録したイベントがすぐ出る
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import EventList from "@/components/EventList";
import ContactBand from "@/components/ContactBand";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta("イベント・ツアー", "ダイビングツアー、講習会、交流イベントの予定です。日程・場所・対象レベル・費用・空き状況を確認して申し込めます。", "/events/");

export default function Page() {
  return (
    <>
      <PageHeader title="イベント・ツアー" lead="ツアーや講習会、交流イベントの予定です。" />
      <div className="mx-auto max-w-6xl px-4">
        <Section title="これからのイベント">
          <EventList />
        </Section>
        <ContactBand title="イベントへの参加・ご質問" text="1人参加も歓迎です。お気軽にどうぞ。" button="参加を申し込む" purpose="event" />
      </div>
    </>
  );
}
