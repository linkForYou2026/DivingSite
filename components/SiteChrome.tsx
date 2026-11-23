"use client";

// 公開サイトのヘッダー・フッターを、管理画面（/admin）では出さない
import { usePathname } from "next/navigation";

export default function SiteChrome({
  header,
  footer,
  fixedBar,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  fixedBar: React.ReactNode;
  children: React.ReactNode;
}) {
  const p = usePathname() || "";
  if (p.startsWith("/admin")) return <>{children}</>;
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[60] focus:rounded focus:bg-white focus:p-2">
        本文へ移動
      </a>
      {header}
      <main id="main">{children}</main>
      {footer}
      {fixedBar}
    </>
  );
}
