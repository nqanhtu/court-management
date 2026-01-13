"use client";

import { Search, Pencil, Trash2, Filter } from "lucide-react";
import { User } from "@prisma/client";
import { useState, useMemo } from "react";

interface UserTableProps {
  users: User[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const ITEMS_PER_PAGE = 15;

export default function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter Logic
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.code.toLowerCase().includes(searchLower) ||
        user.fullName.toLowerCase().includes(searchLower) ||
        (user.unit && user.unit.toLowerCase().includes(searchLower)) ||
        (user.phone && user.phone.includes(searchTerm)) ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.cccd && user.cccd.includes(searchTerm)) ||
        (user.address && user.address.toLowerCase().includes(searchLower))
      );
    });
  }, [users, searchTerm]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

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
           <input 
             type="text" 
             placeholder="Tìm kiếm theo tên, SĐT, đơn vị..." 
             value={searchTerm}
             onChange={handleSearchChange}
             className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-all" 
           />
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
           {paginatedUsers.length === 0 ? (
             <tr>
               <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                 {filteredUsers.length === 0 && users.length > 0 ? "Không tìm thấy kết quả phù hợp." : "Chưa có dữ liệu người dùng."}
               </td>
             </tr>
           ) : (
             paginatedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-indigo-50/50 transition-colors group">
                <td className="px-6 py-3 text-slate-500">{user.code}</td>
                <td className="px-6 py-3 font-medium text-slate-800">{user.fullName}</td>
                <td className="px-6 py-3 text-slate-600">{user.unit || "-"}</td>
                <td className="px-6 py-3 text-slate-600">
                  <div className="flex flex-col text-xs">
                    <span>{user.phone || "-"}</span>
                    <span className="text-slate-400">{user.email || "-"}</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-slate-600">{user.cccd || "-"}</td>
                <td className="px-6 py-3 text-slate-600 truncate max-w-[150px]">{user.address || "-"}</td>
                <td className="px-6 py-3">
                   <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onEdit(user.id)}
                        className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors shadow-sm"
                        title="Chỉnh sửa"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(user.id)}
                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors shadow-sm"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                </td>
              </tr>
            ))
           )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="p-3 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
           <span className="text-xs text-slate-500">
             Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} trên {filteredUsers.length} người dùng
           </span>
           <div className="flex gap-2">
             <button 
               onClick={() => handlePageChange(currentPage - 1)}
               disabled={currentPage === 1}
               className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               Trước
             </button>
             <button 
               onClick={() => handlePageChange(currentPage + 1)}
               disabled={currentPage === totalPages || totalPages === 0}
               className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               Sau
             </button>
           </div>
      </div>
    </div>
  );
}
