"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Filter, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FooterArchive() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={cn(
      "flex flex-col bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-all duration-300 ease-in-out z-30",
      isOpen ? "h-80" : "h-10"
    )}>
      {/* Handle / Title Bar */}
      <div 
        className="h-10 bg-slate-50 border-b border-slate-200 px-4 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600" />
          <h3 className="font-semibold text-slate-700 text-sm">Kho lưu trữ & Tra cứu nhanh</h3>
          <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">2015</span>
        </div>
        <button className="text-slate-500 hover:text-slate-800">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Content */}
      <div className={cn("flex flex-col h-full overflow-hidden", !isOpen && "hidden")}>
        {/* Filters */}
        <div className="p-3 border-b border-slate-200 bg-white flex flex-wrap items-center gap-3">
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

        {/* Table */}
        <div className="flex-1 overflow-auto bg-slate-50">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-white text-slate-600 sticky top-0 shadow-sm z-10">
              <tr>
                {["Hồ sơ số", "Số tờ", "Thời gian", "Loại án", "Tiêu đề", "Hộp số", "MLHS", "MLVB", "THBQ", "Ghi chú", "Trạng thái"].map((head) => (
                  <th key={head} className="px-4 py-3 font-semibold whitespace-nowrap border-b border-slate-200 bg-slate-50/80 backdrop-blur-sm">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="hover:bg-indigo-50/50 transition-colors cursor-pointer group">
                  <td className="px-4 py-2.5 font-medium text-slate-900 group-hover:text-indigo-700">HS-{202500 + i}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}