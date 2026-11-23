// 検索エンジン向けの sitemap.xml（仕様書 9章）
import type { MetadataRoute } from "next";
import { STATIC_PAGES } from "@/lib/nav";
import { blogCategories, site } from "@/lib/data";
import { getSpots } from "@/lib/content";
import { getAllPosts } from "@/lib/blog";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { spots } = await getSpots();
  const u = (p: string) => site.url + p;
  return [
    ...STATIC_PAGES.map((p) => ({ url: u(p.href) })),
    ...spots.map((s) => ({ url: u(`/spots/${s.slug}/`) })),
    ...blogCategories.items.map((c) => ({ url: u(`/blog/category/${c.id}/`) })),
    ...getAllPosts().map((p) => ({ url: u(`/blog/${p.slug}/`), lastModified: p.date })),
  ];
}
