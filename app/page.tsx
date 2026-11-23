// 仮のトップページ（フェーズ0）。フェーズ1で本番のトップページに置き換える。
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-leisure via-sky-600 to-ocean-deep px-6 text-center text-white">
      <p className="mb-3 text-sm tracking-[0.3em] opacity-80">学ぶ・潜る・撮る・働く・つながる</p>
      <h1 className="text-3xl font-bold leading-tight sm:text-5xl">ダイビング総合ポータル（仮）</h1>
      <p className="mt-8 rounded-full border border-white/50 px-6 py-2 text-lg">ただいま準備中です</p>
      <p className="mt-6 max-w-md text-sm leading-relaxed opacity-90">
        資格のこと、綺麗な海のこと、水中撮影、ダイビングのお仕事のご依頼まで。
        <br />
        もうすぐ公開します。
      </p>
      <footer className="absolute bottom-6 text-xs opacity-70">© 2026 diving.link-since2026.jp</footer>
    </main>
  );
}
