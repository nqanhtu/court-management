import { BarChart3, TrendingUp, AlertCircle, CheckCircle2, FileClock, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Reports() {
  return (
    <div className="flex flex-col h-full gap-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Báo cáo thống kê</h1>
           <p className="text-slate-500 text-sm mt-1">Tổng hợp tình hình mượn trả hồ sơ.</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Download className="w-4 h-4" /> Xuất Excel
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng lượt mượn", value: "1,248", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Đang mượn", value: "42", icon: FileClock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Quá hạn", value: "5", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
          { label: "Đã trả đúng hạn", value: "98%", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
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
           <h3 className="font-semibold text-slate-800">Chi tiết giao dịch</h3>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 sticky top-0 shadow-sm z-10">
              <tr>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Mã mượn</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Hồ sơ số</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Ngày mượn</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Hạn trả</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Thời gian trả</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: 15 }).map((_, i) => {
                const isOverdue = i % 10 === 0;
                const isReturned = i % 3 === 0;
                
                return (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-3.5 font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">PM-2025-{1000+i}</td>
                    <td className="px-6 py-3.5 text-slate-600">HS-2024-{500+i}</td>
                    <td className="px-6 py-3.5 text-slate-600">01/03/2025</td>
                    <td className="px-6 py-3.5 text-slate-600">08/03/2025</td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {isReturned ? "05/03/2025" : "-"}
                    </td>
                    <td className="px-6 py-3.5">
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
           <span className="text-xs text-slate-500">Hiển thị 15 trên 1,248 bản ghi</span>
           <div className="flex gap-2">
             <button className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">Trước</button>
             <button className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50">Sau</button>
           </div>
        </div>
      </div>
    </div>
  );
}