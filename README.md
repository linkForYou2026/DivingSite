# DivingSite

ダイビング総合ポータルサイト（https://diving.link-since2026.jp）のソースコードです。
仕様は `docs/ダイビング総合ポータルサイト_仕様書.md`、作業ルールは `CLAUDE.md` を見てください。

## よくある更新と、書き換える場所

| やりたいこと | 書き換えるファイル |
|---|---|
| サイト名・キャッチコピー・メール・電話・受付時間 | `data/site.json` |
| お問い合わせを Googleフォームにつなぐ | `data/site.json` の `contactForm` |
| SNSアイコンを出す | `data/site.json` の `sns` の `url` |
| YouTube・Instagram などの動画・投稿を載せる | `data/media.json` |
| イベントを追加する | `data/events.json` |
| スポットを追加する | `data/spots.json` |
| 資格の説明・取得条件 | `data/licenses.json` |
| 費用の目安・モデルプラン | `data/cost.json` |
| よくある質問 | `data/faq.json` |
| 仕事メニュー・料金 | `data/works.json` |
| 講習の一覧 | `data/courses.json` |
| 参加者の声 | `data/voices.json` |
| ブログ記事を書く | `content/blog/` に `.md` ファイルを追加 |

## 確認・公開
1. `npm run dev` → http://localhost:3000 で確認
2. `npm run build` が成功することを確認
3. GitHub Desktop で commit → push（Cloudflare が自動で公開）
