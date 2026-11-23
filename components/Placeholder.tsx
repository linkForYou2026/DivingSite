// まだ素材がない場所に置く「準備中」の枠
export default function Placeholder({ title, text, className = "" }: { title: string; text?: string; className?: string }) {
  return (
    <div
      className={`rounded-2xl border-2 border-dashed border-slate-300 bg-[repeating-linear-gradient(45deg,#fafcfe,#fafcfe_10px,#f1f6fa_10px,#f1f6fa_20px)] px-4 py-8 text-center text-sm text-slate-600 ${className}`}
    >
      <strong className="block text-base text-slate-700">{title}</strong>
      {text}
    </div>
  );
}
