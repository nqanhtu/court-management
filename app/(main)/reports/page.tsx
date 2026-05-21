'use client'

import { useState } from "react";
import { Download, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportDashboard } from "@/components/reports/report-dashboard";
import { apiFetch } from "@/lib/api/client";
import { toast } from "sonner";

export default function Reports() {
  const [isExporting, setIsExporting] = useState(false);

  const exportReport = async (format: "xlsx" | "csv") => {
    setIsExporting(true);
    try {
      const response = await apiFetch(`/api/reports/export?type=files&format=${format}`);
      if (!response.ok) throw new Error("Không thể kết xuất báo cáo");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getDownloadFilename(response.headers.get("content-disposition"), `files-report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Đã kết xuất báo cáo");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi kết nối");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Báo cáo thống kê</h1>
          <p className="text-slate-500 text-sm mt-1">Tổng hợp tình hình mượn trả hồ sơ.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> In
          </Button>
          <Button variant="outline" onClick={() => exportReport("csv")} disabled={isExporting}>
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            CSV
          </Button>
          <Button variant="outline" onClick={() => exportReport("xlsx")} disabled={isExporting}>
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Excel
          </Button>
        </div>
      </div>

      <ReportDashboard />
    </div>
  );
}

function getDownloadFilename(contentDisposition: string | null, fallback: string) {
  if (!contentDisposition) return fallback;
  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return filenameMatch?.[1] || fallback;
}
