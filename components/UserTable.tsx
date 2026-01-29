'use client';

import { Search, Pencil, Trash2, Filter } from 'lucide-react';
import { UserModel } from '@/app/generated/prisma/models';
import { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserTableProps {
  users: UserModel[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  currentUserRole?: string;
}

const ITEMS_PER_PAGE = 15;

export default function UserTable({ users, onEdit, onDelete, currentUserRole }: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const isAdmin = currentUserRole === 'SUPER_ADMIN';

  // Filter Logic
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.username.toLowerCase().includes(searchLower) ||
        user.fullName.toLowerCase().includes(searchLower) ||
        (user.unit && user.unit.toLowerCase().includes(searchLower))
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
    <Card className='flex flex-col h-full overflow-hidden border-border shadow-sm'>
      {/* Header / Filters */}
      <div className='p-4 border-b border-border flex flex-wrap items-center gap-3 bg-card shrink-0'>
        <div className='flex items-center gap-2'>
          <Filter className='w-5 h-5 text-primary' />
          <h3 className='font-bold text-card-foreground'>Danh sách người dùng</h3>
        </div>
        <div className='h-6 w-px bg-border mx-2 hidden md:block'></div>

        <div className='flex-1 min-w-50 relative max-w-md'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10' />
          <Input
            type='text'
            placeholder='Tìm kiếm theo tên, đơn vị...'
            value={searchTerm}
            onChange={handleSearchChange}
            className='w-full pl-9 pr-4 py-1.5 bg-muted/50 border-input rounded-lg text-sm outline-none focus-visible:ring-primary transition-all h-9'
          />
        </div>
      </div>

      <div className='flex-1 overflow-auto bg-muted/10'>
        <Table>
          <TableHeader className="bg-card sticky top-0 z-10">
            <TableRow>
              {[
                'Tên đăng nhập',
                'Họ và Tên',
                'Vai trò',
                'Đơn vị',
                'Trạng thái',
                'Hành động',
              ].map((head) => (
                <TableHead key={head} className="whitespace-nowrap font-semibold text-muted-foreground">
                  {head}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className='h-24 text-center text-muted-foreground'
                >
                  {filteredUsers.length === 0 && users.length > 0
                    ? 'Không tìm thấy kết quả phù hợp.'
                    : 'Chưa có dữ liệu người dùng.'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow key={user.id} className="bg-card hover:bg-muted/50 transition-colors">
                  <TableCell className='text-muted-foreground'>{user.username}</TableCell>
                  <TableCell className='font-medium text-foreground'>
                    {user.fullName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-muted-foreground">
                        {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.unit || '-'}
                  </TableCell>
                  <TableCell>
                    {user.status ? (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Hoạt động</Badge>
                    ) : ( 
                        <Badge variant="destructive">Khoá</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isAdmin && (
                      <div className='flex items-center gap-2'>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(user.id)}
                          className='h-8 w-8 text-primary hover:text-primary hover:bg-primary/10'
                          title='Chỉnh sửa'
                        >
                          <Pencil className='w-4 h-4' />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(user.id)}
                          className='h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10'
                          title='Xóa'
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className='p-3 border-t border-border bg-card flex items-center justify-between shrink-0'>
        <span className='text-xs text-muted-foreground'>
          Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
          {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} trên{' '}
          {filteredUsers.length} người dùng
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
