// 表示対応表（バックオフィス仕様書 10章）
// 「サイトのどのページのどの部分に、どの管理画面のデータが出るか」を1か所にまとめる。
// 管理画面の「表示先の帯」（9.4）、「サイト表示の状態」（9.5）、表示マップ（BO-03）、空の部分の知らせ（9.8）がこの表を使う。
// 公開サイトの表示条件を変えたら、この表も必ず合わせて直す。

/** 仕事メニューとして「ダイビングの仕事」に出る種類 */
export const WORK_KINDS = ["fun_dive", "photo", "survey", "media", "tour_plan", "other"];
/** 講習として「講習案内」に出る種類 */
export const COURSE_KINDS = ["trial", "course", "refresh"];

type Row = Record<string, unknown>;

export type Placement = {
  page: string; // サイトのページ名
  path: string; // サイトの URL
  part: string; // ページの部分
  table: string | null; // 編集する管理画面（テーブル名）。null は管理画面以外
  editLabel: string; // 編集する管理画面の名前
  condition: string; // 表示される条件
  reflect: "instant" | "publish" | "file" | "none";
  when?: (row: Row) => boolean; // この行がこの部分に出る条件（種類などで変わるもの）
  limit?: number; // 先頭〇件だけ出る
  rowPath?: (row: Row) => string; // 1件ごとのページがある場合
  emptyCheck?: string; // 空の部分の判定に使うキー（functions/api/admin/dashboard.ts）
};

const isWork = (r: Row) => WORK_KINDS.includes(String(r.kind));
const isCourse = (r: Row) => COURSE_KINDS.includes(String(r.kind));
const isTopEmbed = (r: Row) => !r.related_kind || r.related_kind === "top";

export const SITE_MAP: Placement[] = [
  { page: "トップ", path: "/", part: "目的から探す", table: "purposes", editLabel: "「目的から探す」の項目", condition: "全件（並び順）", reflect: "publish", emptyCheck: "purposes" },
  { page: "トップ", path: "/", part: "人気のスポット", table: "spots", editLabel: "スポット", condition: "公開、並び順の上位5件", reflect: "publish", limit: 5, emptyCheck: "spots" },
  { page: "トップ", path: "/", part: "次のイベント", table: "events", editLabel: "イベント・ツアー", condition: "公開、開催日が今日以降、先頭3件", reflect: "instant", limit: 3, emptyCheck: "events" },
  { page: "トップ", path: "/", part: "資格ステップアップ", table: "licenses", editLabel: "資格", condition: "公開", reflect: "publish" },
  { page: "トップ", path: "/", part: "動画・SNS", table: "embeds", editLabel: "動画・SNS（手動で登録）", condition: "公開、表示する場所＝トップ、先頭3件", reflect: "publish", when: isTopEmbed, limit: 3, emptyCheck: "embeds_top" },
  { page: "トップ", path: "/", part: "お知らせ・新着記事", table: "notices", editLabel: "お知らせ", condition: "公開、表示期間内（ブログ記事はファイルで管理）", reflect: "instant", emptyCheck: "notices" },
  { page: "トップ", path: "/", part: "参加者の声", table: "testimonials", editLabel: "参加者の声", condition: "公開", reflect: "publish", emptyCheck: "testimonials" },
  { page: "トップ", path: "/", part: "ダイビングの仕事", table: "services", editLabel: "仕事・講習のメニューと料金", condition: "公開、種類＝仕事の種類、先頭3件（ボタンなし）", reflect: "instant", when: isWork, limit: 3 },
  { page: "ダイビングの仕事", path: "/work/", part: "仕事メニュー・料金", table: "services", editLabel: "仕事・講習のメニューと料金", condition: "公開、種類＝ファンダイブ・ガイド／水中撮影／水中調査・マップ作り／取材・出演・SNS発信／ツアー企画／その他", reflect: "instant", when: isWork, emptyCheck: "services_work" },
  { page: "ダイビングの仕事", path: "/work/", part: "料金の注意書き", table: null, editLabel: "サイト設定（金額の注意書き）", condition: "常に", reflect: "instant" },
  { page: "講習案内", path: "/license/course/", part: "講習一覧", table: "services", editLabel: "仕事・講習のメニューと料金", condition: "公開、種類＝講習／体験ダイビング／リフレッシュ講習", reflect: "instant", when: isCourse, emptyCheck: "services_course" },
  { page: "資格ガイド", path: "/license/", part: "資格ステップアップ・すべての資格の説明", table: "licenses", editLabel: "資格", condition: "公開（指導団体が公開・タブに出す）", reflect: "publish", emptyCheck: "licenses" },
  { page: "資格ガイド", path: "/license/", part: "主な指導団体の特徴・国内の加盟ショップ数", table: "agencies", editLabel: "指導団体", condition: "公開", reflect: "publish" },
  { page: "資格ガイド", path: "/license/", part: "資格名の対応表", table: "license_equivalences", editLabel: "資格名の対応表", condition: "全件", reflect: "publish" },
  { page: "費用とモデルプラン", path: "/beginner/cost/", part: "モデルプラン", table: "model_plans", editLabel: "費用の目安（モデルプラン）", condition: "公開", reflect: "instant", emptyCheck: "model_plans" },
  { page: "費用とモデルプラン", path: "/beginner/cost/", part: "かんたん費用シミュレーター", table: "area_rates", editLabel: "費用シミュレーターの単価", condition: "公開", reflect: "instant", emptyCheck: "area_rates" },
  { page: "よくある質問", path: "/beginner/faq/", part: "質問と回答", table: "faqs", editLabel: "よくある質問", condition: "公開", reflect: "publish", emptyCheck: "faqs" },
  { page: "海・スポットを探す", path: "/spots/", part: "スポットの一覧・絞り込み", table: "spots", editLabel: "スポット", condition: "公開", reflect: "publish" },
  { page: "海・スポットを探す", path: "/spots/", part: "目的の絞り込み", table: "purposes", editLabel: "「目的から探す」の項目", condition: "全件", reflect: "publish" },
  { page: "スポット詳細", path: "/spots/", part: "スポットの詳しい情報", table: "spots", editLabel: "スポット", condition: "公開", reflect: "publish", rowPath: (r) => `/spots/${r.slug}/` },
  { page: "イベント・ツアー", path: "/events/", part: "これからのイベント", table: "events", editLabel: "イベント・ツアー", condition: "公開、開催日が今日以降", reflect: "instant" },
  { page: "動画・SNS", path: "/media/", part: "YouTube／Instagram／TikTok／Facebook", table: "embeds", editLabel: "動画・SNS（手動で登録）", condition: "公開", reflect: "publish" },
  { page: "ブログ", path: "/blog/", part: "記事", table: null, editLabel: "（管理画面ではなく、リポジトリの Markdown ファイル）", condition: "—", reflect: "file" },
  { page: "全ページ", path: "/", part: "フッターの受付時間・SNS", table: null, editLabel: "サイト設定", condition: "常に", reflect: "instant" },
  { page: "お問い合わせ", path: "/contact/", part: "送信された内容", table: "inquiries", editLabel: "問い合わせ（管理画面で確認する側）", condition: "—", reflect: "none" },
];

/** このデータ（入力中の内容）が表示されるページと部分 */
export function placementsFor(table: string, row: Row): Placement[] {
  return SITE_MAP.filter((p) => p.table === table && (!p.when || p.when(row)));
}

/** テーブルの表示先（種類などで変わるものも含めて全部） */
export function allPlacementsFor(table: string): Placement[] {
  return SITE_MAP.filter((p) => p.table === table);
}

export const REFLECT_TEXT: Record<Placement["reflect"], string> = {
  instant: "保存すると約1分で反映",
  publish: "保存後、「サイトに反映」を押すと数分で反映",
  file: "リポジトリに push すると反映",
  none: "サイトには表示されません",
};

/** やりたいこと別ガイド（9.9・BO-02） */
export const GUIDES: { want: string; table: string | null; open: string; steps: string[]; check: { label: string; path: string }[] }[] = [
  {
    want: "仕事のメニューを載せたい・料金を変えたい",
    table: "services",
    open: "仕事・講習のメニューと料金",
    steps: ["「＋ 新しく作る」または変えたいメニューを開く", "「種類」を仕事の種類（水中撮影・ファンダイブ・ガイドなど）にする", "メニュー名・内容・料金を入れる（料金が空欄なら「要相談」と表示）", "「公開して保存」を押す"],
    check: [{ label: "ダイビングの仕事", path: "/work/" }],
  },
  {
    want: "講習の料金を変えたい",
    table: "services",
    open: "仕事・講習のメニューと料金",
    steps: ["講習のメニューを開く（種類が講習・体験ダイビング・リフレッシュ講習のもの）", "料金・所要時間を直す", "「公開して保存」を押す", "必要なら「費用の目安（モデルプラン）」の講習・ツアー代も直す（自動では連動しません）"],
    check: [{ label: "講習案内", path: "/license/course/" }],
  },
  {
    want: "費用の目安を変えたい",
    table: "model_plans",
    open: "費用の目安（モデルプラン）",
    steps: ["変えたいプランを開く", "下の「内訳」で費目ごとの金額を直し、「内訳を保存」を押す（合計は自動）", "プランが下書きなら「公開して保存」を押す"],
    check: [{ label: "費用とモデルプラン", path: "/beginner/cost/" }],
  },
  {
    want: "シミュレーターの金額を変えたい",
    table: "area_rates",
    open: "費用シミュレーターの単価",
    steps: ["エリアを開く", "1日のダイビング代・交通費などを直す（右の試算プレビューで確認）", "「公開して保存」を押す"],
    check: [{ label: "費用とモデルプラン（シミュレーター）", path: "/beginner/cost/" }],
  },
  {
    want: "イベントを載せたい",
    table: "events",
    open: "イベント・ツアー",
    steps: ["「＋ 新しく作る」", "イベント名・開始日時・終了日時・対象レベル・参加費・定員を入れる", "「公開して保存」を押す"],
    check: [
      { label: "イベント・ツアー", path: "/events/" },
      { label: "トップの「次のイベント」", path: "/" },
    ],
  },
  {
    want: "お知らせを出したい",
    table: "notices",
    open: "お知らせ",
    steps: ["「＋ 新しく作る」", "タイトル・内容・表示開始日（必要なら表示終了日）を入れる", "「公開して保存」を押す"],
    check: [{ label: "トップの「お知らせ・新着記事」", path: "/" }],
  },
  {
    want: "スポットを追加したい",
    table: "spots",
    open: "スポット",
    steps: ["「＋ 新しく作る」", "URL名・スポット名・地域・目的などを入れる", "「公開して保存」を押す", "ダッシュボードの「サイトに反映」を押す（数分で表示）"],
    check: [
      { label: "海・スポットを探す", path: "/spots/" },
      { label: "トップの「人気のスポット」", path: "/" },
    ],
  },
  {
    want: "動画を載せたい",
    table: "embeds",
    open: "動画・SNS（手動で登録）",
    steps: ["「＋ 新しく作る」", "サービス（YouTube など）と投稿URLを入れ、表示する場所を選ぶ", "「公開して保存」を押す", "ダッシュボードの「サイトに反映」を押す"],
    check: [
      { label: "動画・SNS", path: "/media/" },
      { label: "トップの「動画・SNS」", path: "/" },
    ],
  },
  {
    want: "受付時間や連絡先を変えたい",
    table: null,
    open: "サイト設定",
    steps: ["「サイト設定」を開く", "受付時間・SNS の URL などを直して保存（約1分で反映）", "サイト名・キャッチコピーを変えたときは「サイトに反映」も押す"],
    check: [
      { label: "フッター", path: "/" },
      { label: "お問い合わせ", path: "/contact/" },
    ],
  },
];
