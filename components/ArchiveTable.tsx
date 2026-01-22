'use client';

import { Filter, Search, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useMemo } from 'react';
import { FileModel } from '@/app/generated/prisma/models';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

interface ArchiveTableProps {
  files: FileModel[];
  onEdit: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ITEMS_PER_PAGE = 20;

export default function ArchiveTable({
  files,
  onEdit,
  onDelete,
}: ArchiveTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedYear, setSelectedYear] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter Logic
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      // 1. Search Term (Code, Title)
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        file.code.toLowerCase().includes(searchLower) ||
        file.title.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // 2. Type Filter
      if (selectedType !== 'all' && file.type !== selectedType) {
        return false;
      }

      // 3. Year Filter
      if (selectedYear) {
        const fileYear = file.year?.toString() || '';
        if (fileYear !== selectedYear) {
          return false;
        }
      }

      return true;
    });
  }, [files, searchTerm, selectedType, selectedYear]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE);
  const paginatedFiles = filteredFiles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    setCurrentPage(1);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedYear(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className='flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden'>
      {/* Header / Filter Bar */}
      <div className='bg-white p-4 border-b border-slate-200 flex flex-wrap items-center gap-3 shrink-0'>
        <div className='flex items-center gap-2'>
          <Filter className='w-5 h-5 text-indigo-600' />
          <h3 className='font-bold text-slate-700'>Kho lưu trữ & Tra cứu</h3>
        </div>

        <div className='h-6 w-px bg-slate-200 mx-2 hidden md:block'></div>

        <div className='flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200'>
          <span className='text-xs font-medium text-slate-500 uppercase tracking-wide'>
            Lọc:
          </span>
        </div>

        <div className='flex items-center gap-2'>
          <Select value={selectedType} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-[140px] border-slate-200 h-9">
              <SelectValue placeholder="Tất cả loại án" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại án</SelectItem>
              <SelectItem value="Hình sự">Hình sự</SelectItem>
              <SelectItem value="Dân sự">Dân sự</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='flex items-center gap-2'>
          <Input
            type='text'
            placeholder='Năm'
            value={selectedYear}
            onChange={handleYearChange}
            className='border-slate-200 rounded-lg px-3 py-1.5 w-20 text-center text-sm outline-none focus-visible:ring-indigo-500 transition-colors h-9'
          />
        </div>

        <div className='flex-1 min-w-50 relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10' />
          <Input
            type='text'
            placeholder='Nhập mã hồ sơ, tiêu đề...'
            value={searchTerm}
            onChange={handleSearchChange}
            className='w-full pl-9 pr-4 py-1.5 border-slate-200 rounded-lg text-sm outline-none focus-visible:ring-indigo-500 bg-slate-50 focus:bg-white transition-all h-9'
          />
        </div>

        <Button className='bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-indigo-200 h-9'>
          Tìm kiếm
        </Button>
      </div>

      {/* Table Content */}
      <div className='flex-1 overflow-auto bg-slate-50 relative'>
        <Table className='w-full text-sm text-left border-collapse'>
          <TableHeader className='bg-white text-slate-600 sticky top-0 shadow-sm z-10'>
            <TableRow className="hover:bg-transparent border-none">
              {[
                'Hồ sơ số',
                'Số tờ',
                'Năm',
                'Loại án',
                'Tiêu đề',
                'THBQ',
                'Ngày xử',
                'Trạng thái',
                'Hành động',
              ].map((head) => (
                <TableHead
                  key={head}
                  className='px-4 py-3 font-semibold whitespace-nowrap border-b border-slate-200 bg-slate-50/90 backdrop-blur-sm first:pl-6 last:pr-6'
                >
                  {head}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className='divide-y divide-slate-200 bg-white'>
            {paginatedFiles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className='px-6 py-8 text-center text-slate-500'
                >
                  {filteredFiles.length === 0 && files.length > 0
                    ? 'Không tìm thấy kết quả phù hợp.'
                    : 'Chưa có hồ sơ nào.'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedFiles.map((file) => (
                <TableRow
                  key={file.id}
                  className='hover:bg-indigo-50/50 transition-colors group'
                >
                  <TableCell className='px-4 py-2.5 pl-6 font-medium text-slate-900 group-hover:text-indigo-700'>
                    {file.code}
                  </TableCell>
                  <TableCell className='px-4 py-2.5 text-slate-600'>
                    {file.pageCount || '-'}
                  </TableCell>
                  <TableCell className='px-4 py-2.5 text-slate-600'>
                    {file.year}
                  </TableCell>
                  <TableCell className='px-4 py-2.5 text-slate-600'>{file.type}</TableCell>
                  <TableCell
                    className='px-4 py-2.5 text-slate-600 max-w-xs truncate'
                    title={file.title}
                  >
                    {file.title}
                  </TableCell>
                  <TableCell className='px-4 py-2.5 text-slate-600'>
                    {file.retention || '-'}
                  </TableCell>
                  <TableCell className='px-4 py-2.5 text-slate-600'>
                    {file.judgmentDate ? format(new Date(file.judgmentDate), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell className='px-4 py-2.5'>
                    {file.status === 'IN_STOCK' && (
                      <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800'>
                        Lưu kho
                      </span>
                    )}
                    {file.status === 'BORROWED' && (
                      <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800'>
                        Đang mượn
                      </span>
                    )}
                    {file.status === 'LOST' && (
                      <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800'>
                        Thất lạc
                      </span>
                    )}
                    {!['IN_STOCK', 'BORROWED', 'LOST'].includes(
                      file.status
                    ) && (
                        <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800'>
                          {file.status}
                        </span>
                      )}
                  </TableCell>
                  <TableCell className='px-4 py-2.5 pr-6'>
                    <div className='flex items-center gap-2'>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(file.id)}
                        className='p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors shadow-sm h-8 w-8'
                        title='Chỉnh sửa'
                      >
                        <Pencil className='w-4 h-4' />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete?.(file.id)}
                        className='p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors shadow-sm h-8 w-8'
                        title='Xóa'
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className='p-3 border-t border-slate-100 bg-white flex items-center justify-between shrink-0'>
        <span className='text-xs text-slate-500'>
          Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
          {Math.min(currentPage * ITEMS_PER_PAGE, filteredFiles.length)} trên{' '}
          {filteredFiles.length} bản ghi
        </span>
        <div className='flex gap-2'>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className='px-3 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed h-7'
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className='px-3 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed h-7'
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}
