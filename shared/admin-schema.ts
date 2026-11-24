// バックオフィスで編集できるテーブルの定義（docs/データモデル定義書.md 4章）
// 管理画面（一覧・編集フォーム）と管理API（入力チェック・権限）の両方がこの定義を使う。
// テーブルや項目を増やすときは、ここに1つ追加するだけで一覧・編集画面と API が使えるようになる。
import type { Capability } from "./permissions";

export type FieldType =
  | "text" // 1行の文字
  | "textarea" // 複数行の文字
  | "markdown" // Markdown の文章
  | "int" // 整数
  | "yen" // 金額（円・税込・整数）
  | "real" // 小数
  | "bool" // はい／いいえ（0/1）
  | "date" // 日付 YYYY-MM-DD
  | "datetime" // 日時（画面では日本時間、保存は世界標準時）
  | "enum" // 決まった値から選ぶ
  | "list" // 文字の一覧（JSON配列で保存）
  | "months" // 月の一覧（JSON配列で保存）
  | "ref" // 別のテーブルの行を選ぶ
  | "email"
  | "url"
  | "slug" // URLに使う名前（英小文字・数字・ハイフン）
  | "code" // 識別コード（英数字・ハイフン・アンダースコア）
  | "json"; // そのまま表示するJSON（読み取り専用）

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  enum?: string; // shared/enums.ts の ENUMS のキー
  ref?: { table: string; label: string }; // type: "ref" のとき
  help?: string;
  default?: string | number | null;
  min?: number;
  max?: number;
  readonly?: boolean; // 画面で編集できない（API でも受け付けない）
  createOnly?: boolean; // 作成時だけ入力できる
  list?: boolean; // 一覧に表示する
};

export type TableDef = {
  name: string;
  label: string;
  group: "料金" | "イベント" | "海・生き物" | "資格" | "コンテンツ" | "運用";
  cap: Capability; // 編集に必要な権限
  reflect: "instant" | "publish" | "none"; // サイトへの反映方式（定義書 1.2）
  title: string; // 一覧やパンくずで使う名前の項目
  orderBy: string;
  search: string[];
  fields: Field[];
  hasStatus: boolean; // status（下書き・公開・非表示）を持つ
  allowCreate?: boolean; // 既定 true
  allowDelete?: boolean; // status を持たないテーブルで、行の削除を許すか
  readOnly?: boolean;
  priceFields?: string[]; // 変更されたら checked_on を今日にする金額項目
  m2m?: { name: string; label: string; table: string; fk: string; otherFk: string; refTable: string; refLabel: string };
  special?: "planItems" | "areaPreview"; // 編集画面に追加の部品を出す
  note?: string; // 編集画面の上部に常に出す注記
};

const sortOrder: Field = { name: "sort_order", label: "並び順", type: "int", default: 0, help: "小さいほど先に表示" };
const status: Field = { name: "status", label: "公開状態", type: "enum", enum: "status", required: true, default: "draft", list: true };
const checkedOn: Field = { name: "checked_on", label: "確認日", type: "date", required: true, help: "金額を確認した日。金額を変えると自動で今日になります", list: true };
const isEstimate = (def: 0 | 1): Field => ({ name: "is_estimate", label: "目安の金額", type: "bool", default: def, help: "オン＝相場の目安、オフ＝自社が実際に提供する価格" });

export const TABLES: TableDef[] = [
  /* ---------------- 料金（owner） ---------------- */
  {
    name: "services",
    label: "仕事・講習のメニューと料金",
    note: "【仕事・講習のメニューと料金】自分が販売する価格（講習料、ガイド料など）。【費用の目安（モデルプラン）】お客様が全体でいくら払うかの目安。両者は自動で連動しません。講習料を変えたら、モデルプランの「講習・ツアー代」も必要に応じて直してください。",
    group: "料金",
    cap: "prices",
    reflect: "instant",
    title: "name",
    orderBy: "kind, sort_order, id",
    search: ["name", "code"],
    hasStatus: true,
    priceFields: ["price_yen"],
    fields: [
      { name: "code", label: "メニューコード", type: "code", required: true, help: "英数字。例 ow-course", list: true },
      { name: "kind", label: "種類", type: "enum", enum: "service_kind", required: true, list: true },
      { name: "name", label: "メニュー名", type: "text", required: true, list: true },
      { name: "description", label: "内容", type: "textarea" },
      { name: "license_id", label: "対応する資格", type: "ref", ref: { table: "licenses", label: "name_ja" }, help: "講習の場合" },
      { name: "price_yen", label: "料金（税込）", type: "yen", help: "空欄にすると「要相談」と表示", list: true },
      { name: "price_unit", label: "単位", type: "enum", enum: "price_unit", required: true, default: "person" },
      { name: "price_from", label: "「〜」をつける", type: "bool", default: 0, help: "オン＝「〇〇円〜」と表示" },
      { name: "includes", label: "料金に含まれるもの", type: "textarea" },
      { name: "excludes", label: "含まれないもの", type: "textarea" },
      { name: "duration", label: "所要時間・日数", type: "text" },
      isEstimate(0),
      checkedOn,
      { name: "accepting", label: "受付中", type: "bool", default: 1, help: "オフ＝「受付停止中」と表示", list: true },
      sortOrder,
      status,
    ],
  },
  {
    name: "model_plans",
    label: "費用の目安（モデルプラン）",
    note: "【費用の目安（モデルプラン）】お客様が全体でいくら払うかの目安（講習代＋レンタル＋交通費＋宿泊など）。【仕事・講習のメニューと料金】自分が販売する価格。両者は自動で連動しません。",
    group: "料金",
    cap: "prices",
    reflect: "instant",
    title: "name",
    orderBy: "sort_order, id",
    search: ["name", "code"],
    hasStatus: true,
    special: "planItems",
    fields: [
      { name: "code", label: "プランコード", type: "code", required: true, list: true },
      { name: "name", label: "プラン名", type: "text", required: true, list: true },
      { name: "subtitle", label: "ひとこと", type: "text" },
      { name: "inquiry_purpose", label: "相談ボタンの用件", type: "enum", enum: "inquiry_purpose", required: true, default: "plan" },
      { name: "memo", label: "注記", type: "textarea" },
      isEstimate(1),
      checkedOn,
      sortOrder,
      status,
    ],
  },
  {
    name: "area_rates",
    label: "費用シミュレーターの単価",
    group: "料金",
    cap: "prices",
    reflect: "instant",
    title: "name",
    orderBy: "sort_order, id",
    search: ["name", "code"],
    hasStatus: true,
    special: "areaPreview",
    priceFields: ["dive_per_day_yen", "rental_per_day_yen", "travel_yen", "stay_per_night_yen", "other_per_day_yen"],
    fields: [
      { name: "code", label: "エリアコード", type: "code", required: true, list: true },
      { name: "name", label: "エリア名", type: "text", required: true, list: true },
      { name: "dive_per_day_yen", label: "1日のダイビング代（2本）", type: "yen", required: true, list: true },
      { name: "rental_per_day_yen", label: "1日の器材レンタル", type: "yen", required: true },
      { name: "travel_yen", label: "往復交通費", type: "yen", required: true, list: true },
      { name: "stay_per_night_yen", label: "1泊の宿泊費", type: "yen", required: true },
      { name: "other_per_day_yen", label: "1日のその他（食事など）", type: "yen", required: true },
      { name: "uses_flight", label: "飛行機を使う", type: "bool", default: 0, help: "オン＝帰る日は潜らない計算" },
      { name: "range_ratio", label: "目安の幅", type: "real", required: true, default: 0.15, min: 0, max: 0.99, help: "0.15 ＝ ±15%" },
      isEstimate(1),
      checkedOn,
      sortOrder,
      status,
    ],
  },

  /* ---------------- イベント ---------------- */
  {
    name: "events",
    label: "イベント・ツアー",
    group: "イベント",
    cap: "content",
    reflect: "instant",
    title: "title",
    orderBy: "start_at DESC, id DESC",
    search: ["title", "slug", "place_text"],
    hasStatus: true,
    fields: [
      { name: "slug", label: "URL名", type: "slug", required: true },
      { name: "title", label: "イベント名", type: "text", required: true, list: true },
      { name: "kind", label: "種類", type: "enum", enum: "event_kind", required: true, default: "tour" },
      { name: "start_at", label: "開始日時", type: "datetime", required: true, list: true },
      { name: "end_at", label: "終了日時", type: "datetime", required: true },
      { name: "spot_id", label: "開催スポット", type: "ref", ref: { table: "spots", label: "name" } },
      { name: "place_text", label: "集合場所", type: "text", list: true },
      { name: "level_min", label: "対象レベル", type: "enum", enum: "dive_level", required: true, default: "ow" },
      { name: "price_yen", label: "参加費（税込）", type: "yen" },
      { name: "price_note", label: "参加費の条件", type: "text" },
      { name: "capacity", label: "定員", type: "int", min: 1, help: "空欄＝定員なし", list: true },
      { name: "entry_deadline", label: "申込締切", type: "date" },
      { name: "entry_status", label: "受付状態", type: "enum", enum: "entry_status", required: true, default: "open", list: true },
      { name: "description_md", label: "内容", type: "markdown" },
      status,
    ],
  },
  {
    name: "event_entries",
    label: "イベントの申し込み者",
    group: "イベント",
    cap: "event_entries",
    reflect: "none",
    title: "id",
    orderBy: "created_at DESC",
    search: ["memo"],
    hasStatus: false,
    allowCreate: false,
    fields: [
      { name: "event_id", label: "イベント", type: "ref", ref: { table: "events", label: "title" }, required: true, readonly: true, list: true },
      { name: "inquiry_id", label: "問い合わせ番号", type: "int", required: true, readonly: true, list: true },
      { name: "people", label: "人数", type: "int", required: true, min: 1, list: true },
      { name: "entry_status", label: "状態", type: "enum", enum: "event_entry_status", required: true, default: "requested", list: true },
      { name: "memo", label: "メモ", type: "textarea" },
    ],
  },

  /* ---------------- 海・生き物 ---------------- */
  {
    name: "spots",
    label: "スポット",
    group: "海・生き物",
    cap: "content",
    reflect: "publish",
    title: "name",
    orderBy: "sort_order, id",
    search: ["name", "slug", "area_name"],
    hasStatus: true,
    priceFields: ["cost_yen"],
    m2m: { name: "purposes", label: "目的", table: "spot_purposes", fk: "spot_id", otherFk: "purpose_id", refTable: "purposes", refLabel: "name" },
    fields: [
      { name: "slug", label: "URL名", type: "slug", required: true, help: "例 kerama → /spots/kerama/", list: true },
      { name: "name", label: "スポット名", type: "text", required: true, list: true },
      { name: "region", label: "国内・海外", type: "enum", enum: "region", required: true, default: "domestic" },
      { name: "area_name", label: "地域", type: "text", required: true, help: "沖縄、伊豆・関東 など", list: true },
      { name: "area_rate_id", label: "費用計算のエリア", type: "ref", ref: { table: "area_rates", label: "name" } },
      { name: "level_min", label: "対象レベル", type: "enum", enum: "dive_level", required: true, default: "ow" },
      { name: "cost_yen", label: "費用の目安（1人）", type: "yen", help: "旅行全体の目安", list: true },
      { name: "cost_note", label: "費用の条件", type: "text", help: "2泊3日・東京発 など" },
      { name: "best_months", label: "ベストシーズン", type: "months" },
      { name: "summary", label: "ひとこと紹介", type: "textarea", required: true },
      { name: "body_md", label: "詳しい紹介", type: "markdown" },
      { name: "access", label: "行き方", type: "textarea" },
      { name: "latitude", label: "緯度", type: "real", min: -90, max: 90 },
      { name: "longitude", label: "経度", type: "real", min: -180, max: 180 },
      isEstimate(1),
      checkedOn,
      { ...sortOrder, help: "小さいほど先。トップの「人気のスポット」はこの順で上位5件" },
      status,
    ],
  },
  {
    name: "purposes",
    label: "「目的から探す」の項目",
    group: "海・生き物",
    cap: "content",
    reflect: "publish",
    title: "name",
    orderBy: "sort_order, id",
    search: ["name", "code"],
    hasStatus: false,
    fields: [
      { name: "code", label: "目的コード", type: "code", required: true, list: true },
      { name: "name", label: "表示名", type: "text", required: true, list: true },
      { name: "icon", label: "アイコン（絵文字）", type: "text", list: true },
      sortOrder,
    ],
  },
  {
    name: "creatures",
    label: "生き物",
    group: "海・生き物",
    cap: "content",
    reflect: "publish",
    title: "name",
    orderBy: "category, sort_order, id",
    search: ["name", "name_kana", "slug"],
    hasStatus: true,
    fields: [
      { name: "slug", label: "URL名", type: "slug", required: true },
      { name: "name", label: "名前", type: "text", required: true, list: true },
      { name: "name_kana", label: "よみ", type: "text" },
      { name: "category", label: "種類", type: "enum", enum: "creature_category", required: true, list: true },
      { name: "size_text", label: "大きさ", type: "text" },
      { name: "seasons", label: "見られる月", type: "months" },
      { name: "summary", label: "説明", type: "textarea" },
      { name: "photo_tips", label: "撮影のコツ", type: "textarea" },
      sortOrder,
      status,
    ],
  },

  /* ---------------- 資格（owner） ---------------- */
  {
    name: "agencies",
    label: "指導団体",
    group: "資格",
    cap: "licenses",
    reflect: "publish",
    title: "name",
    orderBy: "sort_order, id",
    search: ["name", "code", "full_name"],
    hasStatus: true,
    fields: [
      { name: "code", label: "団体コード", type: "code", required: true, list: true },
      { name: "name", label: "表示名", type: "text", required: true, list: true },
      { name: "full_name", label: "正式名称", type: "text" },
      { name: "origin", label: "発祥", type: "text" },
      { name: "feature", label: "特徴", type: "textarea" },
      { name: "official_url", label: "公式サイト", type: "url" },
      { name: "jp_shop_count", label: "国内加盟ショップ数", type: "int", min: 0 },
      { name: "jp_shop_count_source", label: "ショップ数の出典", type: "text" },
      { name: "show_tab", label: "資格ガイドのタブに出す", type: "bool", default: 0, list: true },
      sortOrder,
      status,
    ],
  },
  {
    name: "licenses",
    label: "資格",
    group: "資格",
    cap: "licenses",
    reflect: "publish",
    title: "name_ja",
    orderBy: "agency_id, step_order, id",
    search: ["name_ja", "name_en", "abbr", "code"],
    hasStatus: true,
    fields: [
      { name: "agency_id", label: "指導団体", type: "ref", ref: { table: "agencies", label: "name" }, required: true, list: true },
      { name: "code", label: "資格コード", type: "code", required: true },
      { name: "step_order", label: "取得順", type: "int", required: true, min: 1, list: true },
      { name: "category", label: "区分", type: "enum", enum: "license_category", required: true, default: "leisure", list: true },
      { name: "is_optional", label: "任意のステップ", type: "bool", default: 0 },
      { name: "name_ja", label: "日本語名", type: "text", required: true, list: true },
      { name: "name_en", label: "英語名", type: "text" },
      { name: "abbr", label: "略称", type: "text" },
      { name: "summary", label: "どんな資格か", type: "textarea", required: true },
      { name: "can_do", label: "できること", type: "list", help: "1行に1つ" },
      { name: "requirements", label: "主な取得条件", type: "list", help: "1行に1つ" },
      { name: "min_age", label: "最低年齢", type: "int", min: 0 },
      { name: "min_dives", label: "必要な経験本数", type: "int", min: 0 },
      { name: "next_license_id", label: "次のステップ", type: "ref", ref: { table: "licenses", label: "name_ja" } },
      { name: "note", label: "団体ごとの注記", type: "textarea" },
      { name: "source_url", label: "出典", type: "url" },
      { name: "checked_on", label: "確認日", type: "date", required: true },
      status,
    ],
  },
  {
    name: "license_equivalences",
    label: "資格名の対応表",
    group: "資格",
    cap: "licenses",
    reflect: "publish",
    title: "level_name",
    orderBy: "level_order, agency_id",
    search: ["level_name", "label"],
    hasStatus: false,
    allowDelete: true,
    fields: [
      { name: "level_order", label: "レベルの順", type: "int", required: true, list: true },
      { name: "level_name", label: "レベル", type: "text", required: true, list: true },
      { name: "agency_id", label: "指導団体", type: "ref", ref: { table: "agencies", label: "name" }, required: true, list: true },
      { name: "license_id", label: "資格", type: "ref", ref: { table: "licenses", label: "name_ja" } },
      { name: "label", label: "表示名", type: "text", help: "資格がない団体用、または資格名の代わりに出す文字", list: true },
    ],
  },

  /* ---------------- コンテンツ ---------------- */
  {
    name: "notices",
    label: "お知らせ",
    group: "コンテンツ",
    cap: "content",
    reflect: "instant",
    title: "title",
    orderBy: "publish_from DESC, id DESC",
    search: ["title"],
    hasStatus: true,
    fields: [
      { name: "title", label: "タイトル", type: "text", required: true, list: true },
      { name: "body_md", label: "内容", type: "markdown" },
      { name: "link_url", label: "リンク先", type: "url", help: "サイト内なら /events/ のように書けます" },
      { name: "publish_from", label: "表示開始日", type: "date", required: true, list: true },
      { name: "publish_until", label: "表示終了日", type: "date", help: "空欄＝ずっと表示", list: true },
      status,
    ],
  },
  {
    name: "faqs",
    label: "よくある質問",
    group: "コンテンツ",
    cap: "content",
    reflect: "publish",
    title: "question",
    orderBy: "sort_order, id",
    search: ["question", "answer_md"],
    hasStatus: true,
    fields: [
      { name: "category", label: "カテゴリ", type: "enum", enum: "faq_category", required: true, list: true },
      { name: "question", label: "質問", type: "text", required: true, list: true },
      { name: "answer_md", label: "回答", type: "markdown", required: true },
      sortOrder,
      status,
    ],
  },
  {
    name: "testimonials",
    label: "参加者の声",
    group: "コンテンツ",
    cap: "content",
    reflect: "publish",
    title: "display_name",
    orderBy: "sort_order, id",
    search: ["display_name", "body"],
    hasStatus: true,
    fields: [
      { name: "display_name", label: "表示名", type: "text", required: true, help: "イニシャルや年代など。本人の許可を得た表記", list: true },
      { name: "body", label: "内容", type: "textarea", required: true, list: true },
      { name: "related_kind", label: "関連", type: "enum", enum: "testimonial_related" },
      { name: "related_id", label: "関連先の番号", type: "int" },
      { name: "permission_on", label: "掲載許可日", type: "date", required: true, list: true },
      sortOrder,
      status,
    ],
  },
  {
    name: "embeds",
    label: "動画・SNS（手動で登録）",
    group: "コンテンツ",
    cap: "content",
    reflect: "publish",
    title: "url",
    orderBy: "sort_order, id",
    search: ["url", "title"],
    hasStatus: true,
    fields: [
      { name: "platform", label: "サービス", type: "enum", enum: "embed_platform", required: true, list: true },
      { name: "url", label: "投稿URL", type: "url", required: true, list: true },
      { name: "title", label: "タイトル", type: "text" },
      { name: "related_kind", label: "表示する場所", type: "enum", enum: "embed_related", default: "top", list: true },
      { name: "related_id", label: "関連先の番号", type: "int", help: "トップに出すときは空欄" },
      sortOrder,
      status,
    ],
  },
  {
    name: "gear_items",
    label: "撮影機材",
    group: "コンテンツ",
    cap: "content",
    reflect: "publish",
    title: "name",
    orderBy: "category, budget_band, sort_order, id",
    search: ["name", "maker"],
    hasStatus: true,
    priceFields: ["ref_price_yen"],
    fields: [
      { name: "category", label: "分類", type: "enum", enum: "gear_category", required: true, list: true },
      { name: "budget_band", label: "予算帯", type: "enum", enum: "budget_band", required: true, list: true },
      { name: "name", label: "商品名", type: "text", required: true, list: true },
      { name: "maker", label: "メーカー", type: "text" },
      { name: "ref_price_yen", label: "参考価格（税込）", type: "yen" },
      { name: "comment", label: "おすすめコメント", type: "textarea" },
      { name: "affiliate_url", label: "購入リンク", type: "url", help: "アフィリエイトリンクを含むページには PR 表記が出ます" },
      { name: "affiliate_provider", label: "提携先", type: "text" },
      isEstimate(1),
      checkedOn,
      sortOrder,
      status,
    ],
  },
  {
    name: "community_links",
    label: "コミュニティの参加先",
    group: "コンテンツ",
    cap: "content",
    reflect: "publish",
    title: "name",
    orderBy: "sort_order, id",
    search: ["name"],
    hasStatus: true,
    fields: [
      { name: "name", label: "名前", type: "text", required: true, list: true },
      { name: "kind", label: "種類", type: "enum", enum: "community_kind", required: true, list: true },
      { name: "url", label: "URL", type: "url", required: true },
      { name: "description", label: "説明", type: "textarea" },
      sortOrder,
      status,
    ],
  },

  /* ---------------- 運用（owner） ---------------- */
  {
    name: "admin_users",
    label: "管理者",
    group: "運用",
    cap: "users",
    reflect: "none",
    title: "display_name",
    orderBy: "role, id",
    search: ["email", "display_name"],
    hasStatus: false,
    fields: [
      { name: "email", label: "メールアドレス", type: "email", required: true, createOnly: true, help: "@link-since2026.jp のアカウント", list: true },
      { name: "display_name", label: "表示名", type: "text", required: true, list: true },
      { name: "role", label: "権限", type: "enum", enum: "admin_role", required: true, default: "editor", list: true },
      { name: "active", label: "有効", type: "bool", default: 1, help: "オフにするとすぐログインできなくなります", list: true },
      { name: "last_login_at", label: "最終ログイン", type: "datetime", readonly: true, list: true },
    ],
  },
  {
    name: "audit_logs",
    label: "操作履歴",
    group: "運用",
    cap: "audit",
    reflect: "none",
    title: "id",
    orderBy: "id DESC",
    search: ["actor_email", "target_table"],
    hasStatus: false,
    readOnly: true,
    allowCreate: false,
    fields: [
      { name: "created_at", label: "日時", type: "datetime", readonly: true, list: true },
      { name: "actor_email", label: "操作した人", type: "email", readonly: true, list: true },
      { name: "action", label: "操作", type: "enum", enum: "audit_action", readonly: true, list: true },
      { name: "target_table", label: "対象", type: "text", readonly: true, list: true },
      { name: "target_id", label: "対象の番号", type: "int", readonly: true, list: true },
      { name: "diff_json", label: "変更内容", type: "json", readonly: true },
    ],
  },
];

export function getTable(name: string): TableDef | undefined {
  return TABLES.find((t) => t.name === name);
}

/** 「サイトに反映」が必要なテーブル（ダッシュボードの「反映待ち」の集計に使う） */
export const PUBLISH_TABLES = TABLES.filter((t) => t.reflect === "publish").map((t) => t.name);

/** サイト設定のキー（定義書 4.7）。owner だけが編集できる */
export const SETTING_KEYS: { key: string; label: string; type: "text" | "textarea" | "email" | "url" | "int"; public: boolean; help?: string }[] = [
  { key: "site_name", label: "サイト名", type: "text", public: true, help: "変更後は「サイトに反映」が必要です" },
  { key: "catch_copy", label: "キャッチコピー", type: "text", public: true, help: "変更後は「サイトに反映」が必要です" },
  { key: "contact_email", label: "問い合わせの通知先メール", type: "email", public: false },
  { key: "contact_hours", label: "受付時間", type: "text", public: true },
  { key: "reply_days", label: "返信までの目安（営業日）", type: "int", public: true },
  { key: "price_notice", label: "金額の注意書き", type: "textarea", public: true },
  { key: "sns_instagram", label: "Instagram のURL", type: "url", public: true },
  { key: "sns_youtube", label: "YouTube のURL", type: "url", public: true },
  { key: "sns_tiktok", label: "TikTok のURL", type: "url", public: true },
  { key: "sns_facebook", label: "Facebook のURL", type: "url", public: true },
  { key: "inquiry_retention_days", label: "問い合わせの個人情報の保存日数", type: "int", public: false, help: "空欄＝消去しない" },
  { key: "price_check_days", label: "金額の確認期限（日）", type: "int", public: false, help: "確認日からこの日数が過ぎた金額をダッシュボードで知らせます。空欄＝180日" },
];
