"use client";

// ヘッダー（グローバルナビ）。スマホでは「メニュー」ボタンで開閉します
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV } from "@/lib/nav";

export default function Header({ siteName }: { siteName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // ページを移動したらメニューを閉じる
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-sky-100 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-pro">
          <span
            aria-hidden="true"
            className="inline-block h-8 w-8 rounded-full bg-[radial-gradient(circle_at_35%_30%,#b3e5fc,#0277bd_60%,#062a4f)]"
          />
          <span className="text-base sm:text-lg">{siteName}</span>
        </Link>

        <button
          type="button"
          className="ml-auto rounded-lg border-2 border-pro px-3 py-1 text-sm font-bold text-pro md:hidden"
          aria-expanded={open}
          aria-controls="gnav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "✕ 閉じる" : "☰ メニュー"}
        </button>

        <nav
          id="gnav"
          aria-label="メインメニュー"
          className={`${open ? "block" : "hidden"} absolute inset-x-0 top-16 max-h-[calc(100vh-4rem)] overflow-auto border-b border-sky-100 bg-white px-4 pb-4 shadow-lg md:static md:ml-auto md:block md:max-h-none md:overflow-visible md:border-0 md:p-0 md:shadow-none`}
        >
          <ul className="flex flex-col md:flex-row md:items-center md:gap-1">
            {NAV.map((item) => (
              <li key={item.href} className="group relative">
                <Link
                  href={item.href}
                  className={`block border-b border-sky-100 px-2 py-3 text-sm font-bold md:rounded-lg md:border-0 md:px-3 md:py-2 hover:text-pro md:hover:bg-sky-50 ${
                    isActive(item.href) ? "text-pro" : "text-slate-800"
                  }`}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <ul className="pb-1 pl-4 md:invisible md:absolute md:left-0 md:top-full md:min-w-52 md:rounded-xl md:border md:border-sky-100 md:bg-white md:p-2 md:pl-2 md:opacity-0 md:shadow-xl md:transition md:group-focus-within:visible md:group-focus-within:opacity-100 md:group-hover:visible md:group-hover:opacity-100">
                    {item.children.map((c) => (
                      <li key={c.href}>
                        <Link href={c.href} className="block rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-sky-50 hover:text-pro">
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            <li className="mt-3 md:ml-2 md:mt-0">
              <Link
                href="/contact/"
                className="btn-warm block rounded-full px-5 py-2 text-center text-sm"
              >
                お問い合わせ
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
