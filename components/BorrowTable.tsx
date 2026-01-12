"use client";

import { Search, RotateCcw, Pencil, Trash2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface BorrowTableProps {
  onReturn: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function BorrowTable({ onReturn, onEdit, onDelete }: BorrowTableProps) {
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
       {/* Header / Filters */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-3 bg-white shrink-0">
         <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-700">Phiếu mượn hồ sơ</h3>
        </div>
        <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
        
        <div className="flex items-center gap-2">
           <select className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-1.5 outline-none">
             <option>Tất cả trạng thái</option>
             <option>Đang mượn</option>
             <option>Quá hạn</option>
             <option>Đã trả</option>
           </select>
        </div>

        <div className="flex-1 min-w-[200px] relative max-w-md ml-auto">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
           <input type="text" placeholder="Tìm kiếm phiếu mượn..." className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-all" />
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50">
        <table className="w-full text-sm text-left border-collapse">
           <thead className="bg-white text-slate-600 sticky top-0 shadow-sm z-10">
            <tr>
              {["Mã phiếu", "Người mượn", "Ngày mượn", "Hạn trả", "Hồ sơ", "Trạng thái", "Hành động"].map((head) => (
                <th key={head} className="px-6 py-3 font-semibold whitespace-nowrap border-b border-slate-200 bg-slate-50/90 backdrop-blur-sm">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {Array.from({ length: 15 }).map((_, i) => {
               const isOverdue = i % 5 === 0;
               const isReturned = i % 3 === 0;
               return (
                <tr key={i} className="hover:bg-indigo-50/50 transition-colors group">
                  <td className="px-6 py-3 font-mono text-slate-500">PM-{202500 + i}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                         NV
                       </div>
                       <span className="font-medium text-slate-800">Nguyễn Văn {String.fromCharCode(65 + i)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-slate-600">03/03/2025</td>
                  <td className={cn("px-6 py-3 font-medium", isOverdue && !isReturned ? "text-red-600" : "text-slate-600")}>
                    10/03/2025
                  </td>
                  <td className="px-6 py-3 text-slate-600">HS-2025-{840+i}</td>
                  <td className="px-6 py-3">
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
                  <td className="px-6 py-3">
                     <div className="flex items-center gap-2">
                        {!isReturned && (
                          <button 
                            onClick={() => onReturn(`PM-${202500+i}`)}
                            className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors shadow-sm"
                            title="Trả hồ sơ"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => onEdit(`PM-${202500+i}`)}
                          className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors shadow-sm"
                          title="Chỉnh sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDelete(`PM-${202500+i}`)}
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors shadow-sm"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  </td>
                </tr>
               );
            })}
          </tbody>
        </table>
      </div>

       {/* Pagination */}
      <div className="p-3 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
           <span className="text-xs text-slate-500">Hiển thị 15 trên 42 phiếu mượn</span>
           <div className="flex gap-2">
             <button className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">Trước</button>
             <button className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50">Sau</button>
           </div>
      </div>
    </div>
  );
}
