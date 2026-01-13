'use client';

import { Search, RotateCcw, Pencil, Trash2, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BorrowSlipModel,
  UserModel,
  BorrowItemModel,
  FileModel,
} from '@/app/generated/prisma/models';
import { format } from 'date-fns';
import { useState, useMemo } from 'react';

type BorrowSlipWithDetails = BorrowSlipModel & {
  user: UserModel;
  items: (BorrowItemModel & { file: FileModel })[];
};

interface BorrowTableProps {
  borrowSlips: BorrowSlipWithDetails[];
  onReturn: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const ITEMS_PER_PAGE = 15;

export default function BorrowTable({
  borrowSlips,
  onReturn,
  onEdit,
  onDelete,
}: BorrowTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter Logic
  const filteredSlips = useMemo(() => {
    return borrowSlips.filter((slip) => {
      // 1. Search (Code, User Name)
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        slip.code.toLowerCase().includes(searchLower) ||
        slip.user.fullName.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // 2. Status Filter
      if (selectedStatus !== 'all') {
        const isReturned = slip.status === 'RETURNED';
        const isOverdue =
          slip.status === 'OVERDUE' ||
          (new Date() > new Date(slip.dueDate) && !isReturned);

        if (selectedStatus === 'RETURNED' && !isReturned) return false;
        if (selectedStatus === 'OVERDUE' && !isOverdue) return false;
        if (selectedStatus === 'BORROWING' && (isReturned || isOverdue))
          return false;
      }

      return true;
    });
  }, [borrowSlips, searchTerm, selectedStatus]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredSlips.length / ITEMS_PER_PAGE);
  const paginatedSlips = filteredSlips.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className='flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden'>
      {/* Header / Filters */}
      <div className='p-4 border-b border-slate-200 flex flex-wrap items-center gap-3 bg-white shrink-0'>
        <div className='flex items-center gap-2'>
          <Filter className='w-5 h-5 text-indigo-600' />
          <h3 className='font-bold text-slate-700'>Phiếu mượn hồ sơ</h3>
        </div>
        <div className='h-6 w-px bg-slate-200 mx-2 hidden md:block'></div>

        <div className='flex items-center gap-2'>
          <select
            value={selectedStatus}
            onChange={handleStatusChange}
            className='bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-1.5 outline-none cursor-pointer focus:border-indigo-500 transition-colors'
          >
            <option value='all'>Tất cả trạng thái</option>
            <option value='BORROWING'>Đang mượn</option>
            <option value='OVERDUE'>Quá hạn</option>
            <option value='RETURNED'>Đã trả</option>
          </select>
        </div>

        <div className='flex-1 min-w-50 relative max-w-md ml-auto'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400' />
          <input
            type='text'
            placeholder='Tìm kiếm phiếu mượn...'
            value={searchTerm}
            onChange={handleSearchChange}
            className='w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 transition-all'
          />
        </div>
      </div>

      <div className='flex-1 overflow-auto bg-slate-50'>
        <table className='w-full text-sm text-left border-collapse'>
          <thead className='bg-white text-slate-600 sticky top-0 shadow-sm z-10'>
            <tr>
              {[
                'Mã phiếu',
                'Người mượn',
                'Ngày mượn',
                'Hạn trả',
                'Hồ sơ',
                'Trạng thái',
                'Hành động',
              ].map((head) => (
                <th
                  key={head}
                  className='px-6 py-3 font-semibold whitespace-nowrap border-b border-slate-200 bg-slate-50/90 backdrop-blur-sm'
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100 bg-white'>
            {paginatedSlips.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className='px-6 py-8 text-center text-slate-500'
                >
                  {filteredSlips.length === 0 && borrowSlips.length > 0
                    ? 'Không tìm thấy kết quả phù hợp.'
                    : 'Chưa có phiếu mượn nào.'}
                </td>
              </tr>
            ) : (
              paginatedSlips.map((slip) => {
                const isReturned = slip.status === 'RETURNED';
                const isOverdue =
                  slip.status === 'OVERDUE' ||
                  (new Date() > new Date(slip.dueDate) && !isReturned);

                return (
                  <tr
                    key={slip.id}
                    className='hover:bg-indigo-50/50 transition-colors group'
                  >
                    <td className='px-6 py-3 font-mono text-slate-500'>
                      {slip.code}
                    </td>
                    <td className='px-6 py-3'>
                      <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700'>
                          {slip.user.fullName.charAt(0)}
                        </div>
                        <span className='font-medium text-slate-800'>
                          {slip.user.fullName}
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-3 text-slate-600'>
                      {format(new Date(slip.borrowDate), 'dd/MM/yyyy')}
                    </td>
                    <td
                      className={cn(
                        'px-6 py-3 font-medium',
                        isOverdue && !isReturned
                          ? 'text-red-600'
                          : 'text-slate-600'
                      )}
                    >
                      {format(new Date(slip.dueDate), 'dd/MM/yyyy')}
                    </td>
                    <td className='px-6 py-3 text-slate-600'>
                      {slip.items.length > 0 ? (
                        slip.items.map((item) => item.file.code).join(', ')
                      ) : (
                        <span className='text-slate-400 italic'>
                          Không có hồ sơ
                        </span>
                      )}
                    </td>
                    <td className='px-6 py-3'>
                      {isReturned ? (
                        <span className='inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium border border-emerald-200'>
                          <span className='w-1.5 h-1.5 rounded-full bg-emerald-500'></span>{' '}
                          Đã trả
                        </span>
                      ) : isOverdue ? (
                        <span className='inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium border border-red-200'>
                          <span className='w-1.5 h-1.5 rounded-full bg-red-500'></span>{' '}
                          Quá hạn
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium border border-amber-200'>
                          <span className='w-1.5 h-1.5 rounded-full bg-amber-500'></span>{' '}
                          Đang mượn
                        </span>
                      )}
                    </td>
                    <td className='px-6 py-3'>
                      <div className='flex items-center gap-2'>
                        {!isReturned && (
                          <button
                            onClick={() => onReturn(slip.id)}
                            className='p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors shadow-sm'
                            title='Trả hồ sơ'
                          >
                            <RotateCcw className='w-4 h-4' />
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(slip.id)}
                          className='p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors shadow-sm'
                          title='Chỉnh sửa'
                        >
                          <Pencil className='w-4 h-4' />
                        </button>
                        <button
                          onClick={() => onDelete(slip.id)}
                          className='p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors shadow-sm'
                          title='Xóa'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className='p-3 border-t border-slate-100 bg-white flex items-center justify-between shrink-0'>
        <span className='text-xs text-slate-500'>
          Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
          {Math.min(currentPage * ITEMS_PER_PAGE, filteredSlips.length)} trên{' '}
          {filteredSlips.length} phiếu mượn
        </span>
        <div className='flex gap-2'>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className='px-3 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Trước
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className='px-3 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
