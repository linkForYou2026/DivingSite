# ダイビング総合ポータルサイト（diving.link-since2026.jp）

このフォルダは、ダイビング総合ポータルサイトのソースコードです。
仕様の詳細は `docs/` にあります。作業の前に必ず読み、仕様に沿って実装してください。
- `docs/ダイビング総合ポータルサイト_仕様書.md`：サイト全体の要件と機能
- `docs/データモデル定義書.md`：データベース（D1）のテーブル、API、Excelとの対応
- `docs/バックオフィス仕様書.md`：管理画面（/admin）の要件と画面
- `docs/バックオフィス設定手順.md`：管理画面を動かすための Cloudflare・Google の設定

## 運営者について
- 運営者はプログラミングに詳しくありません。説明は日本語で、専門用語はかみ砕いて伝えてください。
- コマンドの実行や画面操作を運営者にお願いするときは、手順を1つずつ具体的に書いてください。

## 技術構成
- Next.js（App Router）＋ TypeScript ＋ Tailwind CSS
- **静的書き出し**（`next.config` で `output: 'export'`）。ビルド結果は `out/` に出力される
  - Next.js のサーバー機能（API Routes、Server Actions、ISR、Middleware）は使わない
  - サーバー側の処理は **Cloudflare Pages Functions**（`functions/` フォルダ）で書く。データベースは **Cloudflare D1**、画像は **Cloudflare R2**
  - `next/image` は `images: { unoptimized: true }` で使う
- 料金・イベント・お知らせはページを開いたときに API から取得する（即時反映）。スポット・ブログなどはビルド時に書き出す（`docs/データモデル定義書.md` 1.2）
- 管理画面（`/admin`、`/api/admin/`）はログイン必須。権限チェックは必ず API 側でも行う
- データの正は D1。料金・イベント・お知らせ・公開設定は `lib/live.ts`（ページ表示時に `/api/...`）、資格・スポット・FAQ など「公開操作で反映」のデータは `lib/content.ts`（ビルド時に `/api/export`）で読む
- `data/` の JSON は、D1 が読めないときの初期値（サイト名・資格・FAQ）だけに使う。`spots.json` `cost.json` `events.json` `works.json` `courses.json` `voices.json` `media.json` は使っていない（削除してよい）
- 「サイトのどこに何が出るか」は `shared/site-map.ts`（バックオフィス仕様書 10章）、表示されない理由の判定は `shared/visibility.ts`、項目ごとのサイトでの使われ方は `shared/field-site.ts`。公開サイトの表示条件や表示項目を変えたら、この3つも必ず合わせて直す
- 管理対象のテーブルは `shared/admin-schema.ts` に定義する。ここに追加すると、管理画面の一覧・編集と管理APIが使えるようになる
- 権限は `shared/permissions.ts`（owner／editor）。管理APIは `functions/api/admin/_middleware.ts` でログインを確認し、各APIで `can()` を確認する
- `functions/` は Next.js の型チェックの対象外（`functions/tsconfig.json` で別に確認）
- 公開：Cloudflare Pages（GitHub に push すると自動でビルド・公開）
  - ビルドコマンド：`npm run build`／出力フォルダ：`out`
- 公開URL：`https://diving.link-since2026.jp`
- ソース管理：GitHub（非公開リポジトリ）

## フォルダ構成
```
app/              各ページ
components/       共通部品（ヘッダー、フッター、カード、SNS埋め込み、FAQ など）
content/blog/     ブログ記事（Markdown）
app/admin/        管理画面（ログイン、ダッシュボード、問い合わせ、一覧 /admin/t/、編集 /admin/edit/、サイト設定）
components/admin/ 管理画面の部品
functions/        サーバー側の処理（Cloudflare Pages Functions）。api/admin/ はログイン必須
shared/           画面と API で共通の定義（列挙値 enums.ts、権限 permissions.ts、テーブル定義 admin-schema.ts、入力チェック validate.ts）
migrations/       D1 の SQL（0001 テーブル作成、0002 初期データ）
data/             初期値（site.json, licenses.json, faq.json）、blog-categories.json
lib/              組み立て時のデータ（content.ts）、ページ表示時のデータ（live.ts）、ブログ（blog.ts）、メニュー（nav.ts）
public/images/    写真
docs/             仕様書
```

## 実装ルール
- 料金・取得条件などのデータはデータベース（D1）に置き、コンポーネントに直接書かない
- スマホ表示を基本に作る（幅767px以下で縦並び）。スマホでは画面下部に「お問い合わせ」「イベント」の固定ボタン
- 配色は海をイメージした青系。レジャー系 `#4FC3F7`、プロ系 `#0D47A1`
- 全ページにタイトル・説明文・OGP を設定し、`sitemap.xml` を出力する
- 画像には代替テキストを付ける。色だけで情報を区別しない
- アフィリエイトやタイアップを含むページには、広告である旨を表記する
- 問い合わせ・イベントはデータベースで管理する。動画・SNS は管理画面に登録した URL を埋め込みで表示する（YouTube／Instagram／TikTok／Facebook）。マップは Googleマイマップの予定

## コマンド
- 開発サーバー：`npm run dev`（http://localhost:3000）
- ビルド確認：`npm run build`（`out/` が作られればOK）
- 作業の区切りごとに、ビルドが通ることを確認してから commit / push する

## 注意事項
- このフォルダは Googleドライブの同期フォルダ内にある。`node_modules/`、`.next/`、`out/` は `.gitignore` に入れる
- ドメインのDNS（ムームーDNS）では、Google Workspace のメール用レコード（MX・TXT）を絶対に変更しない
- 秘密情報（APIキー、パスワード）をコードやリポジトリに含めない

## 進め方（リリース計画）
- フェーズ0：ひな形作成 → GitHub に push → Cloudflare Pages で公開 → `diving.link-since2026.jp` を接続
- フェーズ1：トップ、はじめての方へ（費用・FAQ）、ブランクダイバーの方へ、資格ガイド、仕事メニュー、問い合わせ、イベント、動画・SNS、ブログ、スポット簡易版
- フェーズ2：スポット検索の本格版、生き物図鑑、マップ、撮影機材紹介、コミュニティ

## 参考資料
- `G:\マイドライブ\事業\DivingSite` に、Googleサイト向けに作った試作HTML（`資格ステップアップ.html`、`スポット検索.html`、`費用シミュレーター.html`、`ポータルサイト試作版.html`）がある。デザインや文言の参考にしてよい
