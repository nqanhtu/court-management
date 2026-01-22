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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type BorrowSlipWithDetails = BorrowSlipModel & {
  lender: UserModel;
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
      // 1. Search (Code, Lender Name)
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        slip.code.toLowerCase().includes(searchLower) ||
        slip.lender.fullName.toLowerCase().includes(searchLower);

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

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <Card className='flex flex-col h-full overflow-hidden border-slate-200 shadow-sm'>
      {/* Header / Filters */}
      <div className='p-4 border-b border-slate-200 flex flex-wrap items-center gap-3 bg-white shrink-0'>
        <div className='flex items-center gap-2'>
          <Filter className='w-5 h-5 text-indigo-600' />
          <h3 className='font-bold text-slate-700'>Phiếu mượn hồ sơ</h3>
        </div>
        <div className='h-6 w-px bg-slate-200 mx-2 hidden md:block'></div>

        <div className='flex items-center gap-2'>
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 h-9">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="BORROWING">Đang mượn</SelectItem>
              <SelectItem value="OVERDUE">Quá hạn</SelectItem>
              <SelectItem value="RETURNED">Đã trả</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='flex-1 min-w-50 relative max-w-md ml-auto'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10' />
          <Input
            type='text'
            placeholder='Tìm kiếm phiếu mượn...'
            value={searchTerm}
            onChange={handleSearchChange}
            className='w-full pl-9 pr-4 py-1.5 bg-slate-50 border-slate-200 rounded-lg text-sm outline-none focus-visible:ring-indigo-500 transition-all h-9'
          />
        </div>
      </div>

      <div className='flex-1 overflow-auto bg-slate-50/50'>
        <Table>
          <TableHeader className="bg-white sticky top-0 z-10">
            <TableRow>
              {[
                'Mã phiếu',
                'Người mượn',
                'Ngày mượn',
                'Hạn trả',
                'Hồ sơ',
                'Trạng thái',
                'Hành động',
              ].map((head) => (
                <TableHead key={head} className="whitespace-nowrap">
                  {head}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSlips.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className='h-24 text-center text-muted-foreground'
                >
                  {filteredSlips.length === 0 && borrowSlips.length > 0
                    ? 'Không tìm thấy kết quả phù hợp.'
                    : 'Chưa có phiếu mượn nào.'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedSlips.map((slip) => {
                const isReturned = slip.status === 'RETURNED';
                const isOverdue =
                  slip.status === 'OVERDUE' ||
                  (new Date() > new Date(slip.dueDate) && !isReturned);

                return (
                  <TableRow key={slip.id} className="bg-white">
                    <TableCell className='font-mono text-muted-foreground'>
                      {slip.code}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700'>
                          {slip.lender.fullName.charAt(0)}
                        </div>
                        <span className='font-medium'>
                          {slip.lender.fullName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(slip.borrowDate), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'font-medium',
                        isOverdue && !isReturned
                          ? 'text-red-600'
                          : 'text-muted-foreground'
                      )}
                    >
                      {format(new Date(slip.dueDate), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      {slip.items.length > 0 ? (
                        slip.items.map((item) => item.file.code).join(', ')
                      ) : (
                        <span className='text-muted-foreground italic'>
                          Không có hồ sơ
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        {!isReturned && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onReturn(slip.id)}
                            className='h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                            title='Trả hồ sơ'
                          >
                            <RotateCcw className='w-4 h-4' />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(slip.id)}
                          className='h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'
                          title='Chỉnh sửa'
                        >
                          <Pencil className='w-4 h-4' />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(slip.id)}
                          className='h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50'
                          title='Xóa'
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className='p-3 border-t border-slate-100 bg-white flex items-center justify-between shrink-0'>
        <span className='text-xs text-muted-foreground'>
          Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
          {Math.min(currentPage * ITEMS_PER_PAGE, filteredSlips.length)} trên{' '}
          {filteredSlips.length} phiếu mượn
        </span>
        <div className='flex gap-2'>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className='h-8'
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className='h-8'
          >
            Sau
          </Button>
        </div>
      </div>
    </Card>
  );
}
