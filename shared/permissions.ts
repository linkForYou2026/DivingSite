// 権限（docs/バックオフィス仕様書.md 3.3）
// 画面のメニューを出し分けるときと、API で操作を許可するときの両方でこの表を使う。
// 「画面で隠す」だけでは不十分なので、API 側でも必ず can() で確認する。

export type Role = "owner" | "editor";

/** 権限の単位（どの種類の操作か） */
export type Capability =
  | "inquiries" // 問い合わせの閲覧・対応（個人情報を含む）
  | "prices" // 料金（自社メニュー・モデルプラン・エリア単価）の編集
  | "excel" // Excel の取り込み・書き出し
  | "content" // イベント・スポット・生き物・ブログ・FAQ などの編集
  | "licenses" // 資格・指導団体（BO-52 は owner）
  | "event_entries" // イベントの申し込み者（個人情報を含む）
  | "deploy" // 「サイトに反映」
  | "settings" // サイト設定
  | "users" // 管理者の追加・権限変更
  | "audit"; // 操作履歴

const MATRIX: Record<Capability, Role[]> = {
  inquiries: ["owner"],
  prices: ["owner"],
  excel: ["owner"],
  content: ["owner", "editor"],
  licenses: ["owner"],
  event_entries: ["owner"],
  deploy: ["owner", "editor"],
  settings: ["owner"],
  users: ["owner"],
  audit: ["owner"],
};

export function can(role: Role | null | undefined, cap: Capability): boolean {
  return !!role && MATRIX[cap].includes(role);
}

export const ROLE_LABEL: Record<Role, string> = { owner: "オーナー", editor: "編集者" };
