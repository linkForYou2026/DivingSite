import type { NextConfig } from "next";

// 静的書き出し（Cloudflare Pages で公開するため、サーバー機能は使わない）
const nextConfig: NextConfig = {
  output: "export",
  // /about → /about/index.html の形で書き出す（静的ホスティングで安定させるため）
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
