import { Suspense } from 'react';
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportDashboard } from "@/components/reports/report-dashboard";

export const dynamic = 'force-dynamic';

export default function Reports() {
  return (
    <div className="flex flex-col h-full space-y-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Báo cáo thống kê</h1>
          <p className="text-slate-500 text-sm mt-1">Tổng hợp tình hình mượn trả hồ sơ.</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2 bg-white border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors h-auto">
          <Download className="w-4 h-4" /> Xuất Excel
        </Button>
      </div>

      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Đang tải báo cáo...</span>
        </div>
      }>
        <ReportDashboard />
      </Suspense>
    </div>
  );
}