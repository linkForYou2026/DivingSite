// ブログ記事（content/blog/*.md）を読み込むファイル
// 記事の先頭に次のような「設定」を書きます（--- で囲む）
// ---
// title: 記事のタイトル
// date: 2026-11-23
// category: beginner        ← data/blog-categories.json の id
// description: 一覧や検索結果に出る短い説明
// popular: 1                ← 人気記事に出す順番（出さないなら書かない）
// draft: false              ← true にすると公開されない
// ---
import fs from "node:fs";
import path from "node:path";
import { blogCategories } from "./data";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export type Post = {
  slug: string;
  title: string;
  date: string;
  category: string;
  categoryLabel: string;
  description: string;
  popular: number | null;
  draft: boolean;
  html: string;
};

function parseFrontmatter(src: string): { meta: Record<string, string>; body: string } {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: src };
  const meta: Record<string, string> = {};
  m[1].split(/\r?\n/).forEach((line) => {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  });
  return { meta, body: m[2] };
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** 文中の書式：**太字**、[リンク](URL) */
function inline(s: string): string {
  let t = esc(s);
  t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_all, text: string, url: string) => {
    const external = /^https?:\/\//.test(url);
    return `<a href="${url}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${text}</a>`;
  });
  return t;
}

/** かんたんな Markdown → HTML 変換（見出し・段落・箇条書き・番号付き・引用・画像・区切り線） */
export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let para: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.type}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.type}>`);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    let m: RegExpMatchArray | null;
    if (!line.trim()) {
      flushPara();
      flushList();
    } else if ((m = line.match(/^(#{2,4})\s+(.*)$/))) {
      flushPara();
      flushList();
      const lv = m[1].length;
      out.push(`<h${lv}>${inline(m[2])}</h${lv}>`);
    } else if ((m = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/))) {
      flushPara();
      flushList();
      out.push(`<figure><img src="${esc(m[2])}" alt="${esc(m[1])}" loading="lazy" /></figure>`);
    } else if (/^---+$/.test(line)) {
      flushPara();
      flushList();
      out.push("<hr />");
    } else if ((m = line.match(/^>\s?(.*)$/))) {
      flushPara();
      flushList();
      out.push(`<blockquote>${inline(m[1])}</blockquote>`);
    } else if ((m = line.match(/^[-*]\s+(.*)$/))) {
      flushPara();
      if (!list || list.type !== "ul") {
        flushList();
        list = { type: "ul", items: [] };
      }
      list.items.push(m[1]);
    } else if ((m = line.match(/^\d+\.\s+(.*)$/))) {
      flushPara();
      if (!list || list.type !== "ol") {
        flushList();
        list = { type: "ol", items: [] };
      }
      list.items.push(m[1]);
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return out.join("\n");
}

function categoryLabel(id: string): string {
  return blogCategories.items.find((c) => c.id === id)?.label ?? id;
}

/** 公開中の記事をすべて（新しい順） */
export function getAllPosts(): Post[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const { meta, body } = parseFrontmatter(fs.readFileSync(path.join(BLOG_DIR, file), "utf8"));
      const slug = file.replace(/\.md$/, "");
      return {
        slug,
        title: meta.title || slug,
        date: meta.date || "",
        category: meta.category || "",
        categoryLabel: categoryLabel(meta.category || ""),
        description: meta.description || "",
        popular: meta.popular ? Number(meta.popular) : null,
        draft: meta.draft === "true",
        html: markdownToHtml(body),
      };
    })
    .filter((p) => !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function getPopularPosts(): Post[] {
  return getAllPosts()
    .filter((p) => p.popular !== null)
    .sort((a, b) => (a.popular ?? 0) - (b.popular ?? 0));
}

export function formatDate(d: string): string {
  return d.replace(/-/g, ".");
}
