# ダイビング総合ポータルサイト（diving.link-since2026.jp）

このフォルダは、ダイビング総合ポータルサイトのソースコードです。
仕様の詳細は `docs/ダイビング総合ポータルサイト_仕様書.md` にあります。作業の前に必ず読み、仕様に沿って実装してください。

## 運営者について
- 運営者はプログラミングに詳しくありません。説明は日本語で、専門用語はかみ砕いて伝えてください。
- コマンドの実行や画面操作を運営者にお願いするときは、手順を1つずつ具体的に書いてください。

## 技術構成
- Next.js（App Router）＋ TypeScript ＋ Tailwind CSS
- **静的書き出し**（`next.config` で `output: 'export'`）。ビルド結果は `out/` に出力される
  - サーバー機能（API Routes、Server Actions、ISR、Middleware）は使わない
  - `next/image` は `images: { unoptimized: true }` で使う
- 公開：Cloudflare Pages（GitHub に push すると自動でビルド・公開）
  - ビルドコマンド：`npm run build`／出力フォルダ：`out`
- 公開URL：`https://diving.link-since2026.jp`
- ソース管理：GitHub（非公開リポジトリ）

## フォルダ構成
```
app/              各ページ
components/       共通部品（ヘッダー、フッター、カード、SNS埋め込み、FAQ など）
content/blog/     ブログ記事（Markdown）
data/             licenses.json, spots.json, creatures.json, events.json, faq.json, works.json, gear.json
public/images/    写真
docs/             仕様書
```

## 実装ルール
- 文言・料金・取得条件などのデータは `data/` の JSON に置き、コンポーネントに直接書かない
- スマホ表示を基本に作る（幅767px以下で縦並び）。スマホでは画面下部に「お問い合わせ」「イベント」の固定ボタン
- 配色は海をイメージした青系。レジャー系 `#4FC3F7`、プロ系 `#0D47A1`
- 全ページにタイトル・説明文・OGP を設定し、`sitemap.xml` を出力する
- 画像には代替テキストを付ける。色だけで情報を区別しない
- アフィリエイトやタイアップを含むページには、広告である旨を表記する
- 外部サービスは埋め込みで連携する：Googleフォーム（問い合わせ）、Googleカレンダー（イベント）、Googleマイマップ（マップ）、YouTube／Instagram／TikTok／Facebook（動画・SNS）

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
