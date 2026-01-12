"use client";

import { Filter, Search, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArchiveTableProps {
  onEdit: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function ArchiveTable({ onEdit, onDelete }: ArchiveTableProps) {
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header / Filter Bar */}
      <div className="bg-white p-4 border-b border-slate-200 flex flex-wrap items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-700">Kho lưu trữ & Tra cứu</h3>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Lọc theo:</span>
          <select className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer">
            <option>Năm</option>
            <option>Loại án</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500 transition-colors">
            <option>Tất cả loại án</option>
            <option>Hình sự</option>
            <option>Dân sự</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
            <input 
            type="text" 
            placeholder="Năm"
            defaultValue="2015"
            className="border border-slate-200 rounded-lg px-3 py-1.5 w-20 text-center text-sm outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Nhập mã hồ sơ cần tìm..."
            className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all"
          />
        </div>

        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-indigo-200">
          Tìm kiếm
        </button>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto bg-slate-50 relative">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-white text-slate-600 sticky top-0 shadow-sm z-10">
            <tr>
              {["Hồ sơ số", "Số tờ", "Thời gian", "Loại án", "Tiêu đề", "Hộp số", "MLHS", "MLVB", "THBQ", "Ghi chú", "Trạng thái", "Hành động"].map((head) => (
                <th key={head} className="px-4 py-3 font-semibold whitespace-nowrap border-b border-slate-200 bg-slate-50/90 backdrop-blur-sm first:pl-6 last:pr-6">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {Array.from({ length: 20 }).map((_, i) => (
              <tr key={i} className="hover:bg-indigo-50/50 transition-colors group">
                <td className="px-4 py-2.5 pl-6 font-medium text-slate-900 group-hover:text-indigo-700">HS-{202500 + i}</td>
                <td className="px-4 py-2.5 text-slate-600">1{i}</td>
                <td className="px-4 py-2.5 text-slate-600">03/03/2025</td>
                <td className="px-4 py-2.5 text-slate-600">Dân sự</td>
                <td className="px-4 py-2.5 text-slate-600 max-w-xs truncate">V/v Tranh chấp hợp đồng...</td>
                <td className="px-4 py-2.5 text-slate-600">H0{i}</td>
                <td className="px-4 py-2.5 text-slate-600">-</td>
                <td className="px-4 py-2.5 text-slate-600">-</td>
                <td className="px-4 py-2.5 text-slate-600">Vĩnh viễn</td>
                <td className="px-4 py-2.5 text-slate-400 italic">None</td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Lưu kho
                  </span>
                </td>
                <td className="px-4 py-2.5 pr-6">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onEdit(`HS-${202500 + i}`)}
                      className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors shadow-sm" 
                      title="Chỉnh sửa"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete?.(`HS-${202500 + i}`)}
                      className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors shadow-sm" 
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
       {/* Pagination */}
        <div className="p-3 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
           <span className="text-xs text-slate-500">Hiển thị 20 trên 1,024 bản ghi</span>
           <div className="flex gap-2">
             <button className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">Trước</button>
             <button className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50">Sau</button>
           </div>
        </div>
    </div>
  );
}