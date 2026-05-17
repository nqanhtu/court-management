import { Metadata } from "next";
import { AgencyList } from "@/components/admin/agency-list";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Quản lý Phông lưu trữ | Court Management",
  description: "Quản lý lịch sử tên cơ quan (Phông lưu trữ)",
};

export default async function AgencyPage() {
  const session = await getSession();

  if (!session || session.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Quản lý Hệ thống</h1>
            <p className="text-muted-foreground mt-2">
              Thiết lập danh mục phông lưu trữ và lịch sử thay đổi tên cơ quan.
            </p>
          </div>
          <AgencyList />
        </div>
      </main>
    </div>
  );
}
