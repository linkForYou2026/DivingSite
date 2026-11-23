// 管理画面の小さな部品
import { STATUS } from "@/shared/enums";

export function PageTitle({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <h1 className="text-xl font-bold text-ocean-deep">{children}</h1>
      <div className="ml-auto flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-amber-100 text-amber-900",
  published: "bg-green-100 text-green-900",
  archived: "bg-slate-200 text-slate-700",
};
export function StatusBadge({ value }: { value: string }) {
  return <span className={`rounded px-2 py-0.5 text-xs font-bold ${STATUS_COLOR[value] ?? "bg-slate-100"}`}>{STATUS[value as keyof typeof STATUS] ?? value}</span>;
}

export function Card({ title, children, className = "" }: { title?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      {title && <h2 className="mb-3 font-bold text-ocean-deep">{title}</h2>}
      {children}
    </section>
  );
}

export function Alert({ kind = "error", children }: { kind?: "error" | "ok" | "info"; children: React.ReactNode }) {
  const c = kind === "error" ? "border-red-300 bg-red-50 text-red-900" : kind === "ok" ? "border-green-300 bg-green-50 text-green-900" : "border-sky-300 bg-sky-50 text-sky-900";
  return (
    <p role={kind === "error" ? "alert" : "status"} className={`mb-3 rounded-lg border px-3 py-2 text-sm ${c}`}>
      {children}
    </p>
  );
}

export const btn = "inline-block rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50";
export const btnPrimary = `${btn} bg-pro text-white hover:bg-ocean-deep`;
export const btnGhost = `${btn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-100`;
export const btnDanger = `${btn} border border-red-300 bg-white text-red-700 hover:bg-red-50`;
export const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[15px] focus:border-ocean";
