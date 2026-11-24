// サイト表示の状態（バックオフィス仕様書 9.5）
// 1件のデータが「サイトに出ているか・出ていない理由・直し方」を判定する。
// 判定の条件は公開API（functions/_lib/public.ts、functions/api/events.ts など）と同じにしている。
import { getTable } from "./admin-schema";
import { placementsFor, type Placement } from "./site-map";

type Row = Record<string, unknown>;

/** 判定に必要な、データの外の情報（管理APIが返す） */
export type VisCtx = {
  now: string; // 現在（世界標準時）
  today: string; // 今日（日本時間）YYYY-MM-DD
  lastDeployAt: string | null; // 最後に「サイトに反映」を押した日時
  topIds: number[]; // トップなど「先頭〇件」だけの部分に出ている行の id
};

export type Visibility = {
  tone: "ok" | "ng" | "wait" | "none"; // 表示中・表示されていない・反映待ち・サイトに出ないデータ
  text: string;
  fix?: string;
  placements: Placement[];
  short: string; // 一覧用の短い表示
};

const md = (d: string) => {
  const [, m, day] = d.split("-");
  return `${Number(m)}月${Number(day)}日`;
};

export function visibility(table: string, row: Row, ctx: VisCtx | null): Visibility {
  const t = getTable(table);
  const placements = placementsFor(table, row);
  if (!t || !placements.length) {
    return { tone: "none", text: "サイトには表示されません（管理用のデータ）", placements: [], short: "—" };
  }
  const ng = (text: string, fix?: string): Visibility => ({ tone: "ng", text: `表示されていません：${text}`, fix, placements, short: "✕ 出ていない" });

  if (t.hasStatus) {
    if (row.status === "draft") return ng("公開状態が下書きです", "「公開して保存」を押す");
    if (row.status === "archived") return ng("非表示にしています", "「公開して保存」で公開に戻す");
  }
  if (ctx && table === "notices") {
    if (row.publish_from && String(row.publish_from) > ctx.today) return ng(`表示開始日が${md(String(row.publish_from))}です`, "表示期間を確認する");
    if (row.publish_until && String(row.publish_until) < ctx.today) return ng("表示終了日が過ぎています", "表示期間を確認する");
  }
  if (ctx && table === "events" && row.end_at && String(row.end_at) < ctx.now) return ng("開催日が過ぎています");

  // 「サイトに反映」が必要なデータで、最後の反映より後に変更したもの
  if (t.reflect === "publish" && ctx && (!ctx.lastDeployAt || String(row.updated_at || "") > ctx.lastDeployAt)) {
    return {
      tone: "wait",
      text: ctx.lastDeployAt ? "反映待ち：「サイトに反映」を押すと表示されます" : "反映待ち：まだ一度も「サイトに反映」を押していません",
      fix: "ダッシュボードの「サイトに反映」を押す",
      placements,
      short: "… 反映待ち",
    };
  }

  // 表示中：先頭〇件だけの部分（トップなど）に入っているか
  const id = Number(row.id);
  const shown = placements.filter((p) => !p.limit || !ctx || ctx.topIds.includes(id));
  const missed = placements.filter((p) => p.limit && ctx && !ctx.topIds.includes(id));
  const pages = Array.from(new Set(shown.map((p) => (p.page === "トップ" ? `トップの「${p.part}」` : p.page))));
  let text = `表示中：${pages.join("、")}`;
  let fix: string | undefined;
  if (table === "services" && placements.every((p) => p.page !== "ダイビングの仕事")) {
    text += "（ダイビングの仕事ではありません）";
    fix = "仕事に出したい場合は、種類を仕事の種類に変える";
  }
  if (missed.length) {
    text += ` ／ ${missed.map((p) => `${p.page}の「${p.part}」`).join("、")}には出ていません（先頭${missed[0].limit}件のみ表示）`;
    fix = "並び順の数字を小さくする";
  }
  if (table === "services" && Number(row.accepting) === 0) {
    text += "（「受付停止中」と表示）";
    fix = "受付中をオンにする";
  }
  return { tone: "ok", text, fix, placements, short: "✓ 表示中" };
}
