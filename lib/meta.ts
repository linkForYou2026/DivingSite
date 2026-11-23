// 各ページのタイトル・説明文・OGP をまとめて作る関数
import type { Metadata } from "next";
import { site } from "./data";

export function pageMeta(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "ja_JP",
      siteName: site.name,
      title: `${title} | ${site.name}`,
      description,
      url: path,
    },
  };
}
