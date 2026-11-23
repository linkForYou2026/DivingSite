// 動画・SNSの埋め込み（仕様書 F-08）。data/media.json にURLやIDを追加するだけで表示されます
import { media } from "@/lib/data";
import Placeholder from "./Placeholder";

const frame = "w-full rounded-2xl border-0 bg-slate-100";

function instagramEmbed(url: string) {
  const m = url.match(/instagram\.com\/(p|reel)\/([^/?#]+)/);
  return m ? `https://www.instagram.com/${m[1]}/${m[2]}/embed` : "";
}
function tiktokEmbed(url: string) {
  const m = url.match(/\/video\/(\d+)/);
  return m ? `https://www.tiktok.com/embed/v2/${m[1]}` : "";
}
function facebookEmbed(url: string) {
  return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=500`;
}

export function YouTubeEmbed({ compact = false }: { compact?: boolean }) {
  const { playlistId, videoIds } = media.youtube;
  const srcs = playlistId
    ? [`https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}`]
    : videoIds.slice(0, compact ? 1 : 6).map((id) => `https://www.youtube-nocookie.com/embed/${id}`);
  if (!srcs.length) return <Placeholder title="YouTube" text="動画は準備中です" />;
  return (
    <div className={`grid gap-4 ${srcs.length > 1 ? "md:grid-cols-2" : ""}`}>
      {srcs.map((src) => (
        <iframe key={src} src={src} title="YouTube動画" className={`${frame} aspect-video`} loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      ))}
    </div>
  );
}

function PostGrid({ name, posts, toSrc, height }: { name: string; posts: string[]; toSrc: (u: string) => string; height: number }) {
  const srcs = posts.map(toSrc).filter(Boolean);
  if (!srcs.length) return <Placeholder title={name} text="投稿は準備中です" />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {srcs.map((src) => (
        <iframe key={src} src={src} title={`${name}の投稿`} className={frame} style={{ height }} loading="lazy" />
      ))}
    </div>
  );
}

export function InstagramEmbed({ limit }: { limit?: number }) {
  return <PostGrid name="Instagram" posts={media.instagram.posts.slice(0, limit ?? 99)} toSrc={instagramEmbed} height={560} />;
}
export function TikTokEmbed() {
  return <PostGrid name="TikTok" posts={media.tiktok.posts} toSrc={tiktokEmbed} height={740} />;
}
export function FacebookEmbed() {
  return <PostGrid name="Facebook" posts={media.facebook.posts} toSrc={facebookEmbed} height={600} />;
}
