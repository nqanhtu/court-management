"use client";

import { Search, Pencil, Trash2, Filter } from "lucide-react";

interface UserTableProps {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function UserTable({ onEdit, onDelete }: UserTableProps) {
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header / Filters */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-3 bg-white shrink-0">
         <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-700">Danh sách người dùng</h3>
        </div>
        <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
        
        <div className="flex-1 min-w-[200px] relative max-w-md">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
           <input type="text" placeholder="Tìm kiếm theo tên, SĐT, đơn vị..." className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-all" />
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-white text-slate-600 sticky top-0 shadow-sm z-10">
            <tr>
              {["ID", "Họ và Tên", "Đơn vị", "Liên lạc", "CCCD", "Địa chỉ", "Hành động"].map((head) => (
                <th key={head} className="px-6 py-3 font-semibold whitespace-nowrap border-b border-slate-200 bg-slate-50/90 backdrop-blur-sm">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
           {Array.from({ length: 15 }).map((_, i) => (
            <tr key={i} className="hover:bg-indigo-50/50 transition-colors group">
              <td className="px-6 py-3 text-slate-500">#{1000 + i}</td>
              <td className="px-6 py-3 font-medium text-slate-800">Nguyễn Văn {String.fromCharCode(65 + i)}</td>
              <td className="px-6 py-3 text-slate-600">Phòng Hành chính</td>
              <td className="px-6 py-3 text-slate-600">
                <div className="flex flex-col text-xs">
                  <span>090123456{i}</span>
                  <span className="text-slate-400">user{i}@example.com</span>
                </div>
              </td>
              <td className="px-6 py-3 text-slate-600">01234567890{i}</td>
              <td className="px-6 py-3 text-slate-600 truncate max-w-[150px]">Số {i}, Đường ABC, TP.HCM</td>
              <td className="px-6 py-3">
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onEdit(`USER-${1000+i}`)}
                      className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors shadow-sm"
                      title="Chỉnh sửa"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(`USER-${1000+i}`)}
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
           <span className="text-xs text-slate-500">Hiển thị 15 trên 150 người dùng</span>
           <div className="flex gap-2">
             <button className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">Trước</button>
             <button className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50">Sau</button>
           </div>
      </div>
    </div>
  );
}
