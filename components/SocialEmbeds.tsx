// 動画・SNSの埋め込み（F-08）。管理画面の「動画・SNS投稿」に URL を登録すると表示されます
import type { EmbedView } from "@/lib/content";
import Placeholder from "./Placeholder";

const frame = "w-full rounded-2xl border-0 bg-slate-100";

function youtubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/)([\w-]{11})/);
  return m ? m[1] : "";
}
function playlistId(url: string) {
  const m = url.match(/[?&]list=([\w-]+)/);
  return m ? m[1] : "";
}
function toSrc(e: EmbedView): string {
  switch (e.platform) {
    case "youtube": {
      const id = youtubeId(e.url);
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : "";
    }
    case "youtube_playlist": {
      const id = playlistId(e.url);
      return id ? `https://www.youtube-nocookie.com/embed/videoseries?list=${id}` : "";
    }
    case "instagram": {
      const m = e.url.match(/instagram\.com\/(p|reel)\/([^/?#]+)/);
      return m ? `https://www.instagram.com/${m[1]}/${m[2]}/embed` : "";
    }
    case "tiktok": {
      const m = e.url.match(/\/video\/(\d+)/);
      return m ? `https://www.tiktok.com/embed/v2/${m[1]}` : "";
    }
    case "facebook":
      return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(e.url)}&show_text=true&width=500`;
    default:
      return "";
  }
}
const HEIGHT: Record<string, number> = { instagram: 560, tiktok: 740, facebook: 600 };
const NAME: Record<string, string> = { youtube: "YouTube", youtube_playlist: "YouTube", instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook" };

export default function SocialEmbeds({ embeds, platforms, limit, emptyTitle }: { embeds: EmbedView[]; platforms: string[]; limit?: number; emptyTitle: string }) {
  const list = embeds.filter((e) => platforms.includes(e.platform)).map((e) => ({ e, src: toSrc(e) })).filter((x) => x.src).slice(0, limit ?? 99);
  if (!list.length) return <Placeholder title={emptyTitle} text="準備中です" />;
  return (
    <div className={`grid gap-4 ${list.length > 1 ? "sm:grid-cols-2 lg:grid-cols-3" : ""}`}>
      {list.map(({ e, src }) =>
        e.platform.startsWith("youtube") ? (
          <iframe key={src} src={src} title={e.title || "YouTube動画"} className={`${frame} aspect-video`} loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : (
          <iframe key={src} src={src} title={e.title || `${NAME[e.platform]}の投稿`} className={frame} style={{ height: HEIGHT[e.platform] }} loading="lazy" />
        ),
      )}
    </div>
  );
}
