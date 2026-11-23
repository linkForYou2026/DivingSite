// スポットのカード
import Link from "next/link";
import { Spot, yen } from "@/lib/data";

export default function SpotCard({ spot, rank }: { spot: Spot; rank?: number }) {
  return (
    <Link
      href={`/spots/${spot.id}/`}
      className="relative flex flex-col overflow-hidden rounded-2xl border border-sky-100 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      {rank && (
        <span className="absolute left-2 top-2 z-10 rounded-md bg-orange-700 px-2 text-sm font-extrabold text-white">{rank}</span>
      )}
      <SpotImage spot={spot} />
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="font-bold">{spot.name}</h3>
        <div className="flex flex-wrap gap-1">
          {spot.purposes.map((p) => (
            <span key={p} className="rounded bg-sky-100 px-1.5 text-xs font-bold text-leisure-ink">{p}</span>
          ))}
        </div>
        <p className="mt-auto text-lg font-extrabold text-pro">
          {yen(spot.cost)}〜<small className="text-xs font-normal text-slate-500"> /1人・目安</small>
        </p>
      </div>
    </Link>
  );
}

export function SpotImage({ spot, tall = false }: { spot: Spot; tall?: boolean }) {
  const h = tall ? "h-56 md:h-72" : "h-32";
  if (spot.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={spot.image} alt={spot.imageAlt || spot.name} className={`${h} w-full object-cover`} loading="lazy" />;
  }
  return (
    <div
      role="img"
      aria-label={`${spot.name}のイメージ（写真は準備中）`}
      className={`${h} flex items-end justify-between p-2 text-xs text-white`}
      style={{ background: `linear-gradient(135deg, ${spot.color[0]}, ${spot.color[1]})` }}
    >
      <span className="rounded bg-black/30 px-1.5">{spot.region}・{spot.area}</span>
      <span className="opacity-90">写真準備中</span>
    </div>
  );
}
