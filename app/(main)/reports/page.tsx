'use client'

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportDashboard } from "@/components/reports/report-dashboard";

export default function Reports() {
  return (
    <div className="flex flex-col h-full space-y-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Báo cáo thống kê</h1>
          <p className="text-slate-500 text-sm mt-1">Tổng hợp tình hình mượn trả hồ sơ.</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4" /> Xuất Excel
        </Button>
      </div>

      <ReportDashboard />
    </div>
  );
}