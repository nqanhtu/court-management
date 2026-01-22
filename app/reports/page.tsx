import { BarChart3, TrendingUp, AlertCircle, CheckCircle2, FileClock, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { getReportStats } from "@/lib/actions/borrow-queries";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = 'force-dynamic';

export default async function Reports() {
  const { totalBorrows, activeBorrows, overdueBorrows, returnedRate, recentBorrows } = await getReportStats();

  return (
    <div className="flex flex-col h-full gap-6 max-w-7xl mx-auto w-full">
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng lượt mượn", value: totalBorrows.toString(), icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Đang mượn", value: activeBorrows.toString(), icon: FileClock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Quá hạn", value: overdueBorrows.toString(), icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
          { label: "Đã trả đúng hạn", value: `${returnedRate}%`, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Data Table Card */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-slate-400" />
          <h3 className="font-semibold text-slate-800">Chi tiết giao dịch gần đây</h3>
        </div>

        <div className="flex-1 overflow-auto">
          <Table className="w-full text-sm text-left">
            <TableHeader className="bg-slate-50 text-slate-600 sticky top-0 shadow-sm z-10">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="px-6 py-4 font-semibold whitespace-nowrap">Mã mượn</TableHead>
                <TableHead className="px-6 py-4 font-semibold whitespace-nowrap">Hồ sơ số</TableHead>
                <TableHead className="px-6 py-4 font-semibold whitespace-nowrap">Ngày mượn</TableHead>
                <TableHead className="px-6 py-4 font-semibold whitespace-nowrap">Hạn trả</TableHead>
                <TableHead className="px-6 py-4 font-semibold whitespace-nowrap">Thời gian trả</TableHead>
                <TableHead className="px-6 py-4 font-semibold whitespace-nowrap">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {recentBorrows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Chưa có dữ liệu giao dịch.
                  </TableCell>
                </TableRow>
              ) : (
                recentBorrows.map((slip) => {
                  const isReturned = slip.status === "RETURNED";
                  const isOverdue = slip.status === "OVERDUE" || (new Date() > new Date(slip.dueDate) && !isReturned);

                  return (
                    <TableRow key={slip.id} className="hover:bg-slate-50/80 transition-colors group">
                      <TableCell className="px-6 py-3.5 font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">{slip.code}</TableCell>
                      <TableCell className="px-6 py-3.5 text-slate-600">
                        {slip.items.length > 0 ? slip.items.map(i => i.file.code).join(", ") : "-"}
                      </TableCell>
                      <TableCell className="px-6 py-3.5 text-slate-600">{format(new Date(slip.borrowDate), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="px-6 py-3.5 text-slate-600">{format(new Date(slip.dueDate), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="px-6 py-3.5 text-slate-600">
                        {slip.returnedDate ? format(new Date(slip.returnedDate), "dd/MM/yyyy") : "-"}
                      </TableCell>
                      <TableCell className="px-6 py-3.5">
                        {isReturned ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Đã trả
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Quá hạn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Đang mượn
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer - Static for now since we only fetch 20 */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">Hiển thị {recentBorrows.length} giao dịch gần nhất</span>
        </div>
      </div>
    </div>
  );
}