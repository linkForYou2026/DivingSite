"use client";

// 金額の注意書き（管理画面の「サイト設定」→「金額の注意書き」）
import { usePrices } from "@/lib/live";

export default function PriceNotice({ className = "" }: { className?: string }) {
  const { data } = usePrices();
  const text = data?.priceNotice || "表示の金額は税込の目安です。条件によって変わります。";
  return <p className={`rounded-xl bg-sky-50 px-4 py-3 text-xs text-slate-600 ${className}`}>※ {text}</p>;
}
