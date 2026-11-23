// 管理画面（/admin）共通。検索エンジンには載せない
import type { Metadata } from "next";
import AdminFrame from "@/components/admin/AdminFrame";

export const metadata: Metadata = {
  title: "管理画面",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminFrame>{children}</AdminFrame>;
}
