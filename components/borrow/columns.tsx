"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Book, Pencil, RotateCcw, Trash2, History } from "lucide-react"
import { BorrowSlipWithDetails } from '@/lib/types/borrow';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
interface ColumnActions {
  onReturn: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewHistory: (id: string) => void;
}

export const getColumns = ({ onReturn, onEdit, onDelete, onViewHistory }: ColumnActions): ColumnDef<BorrowSlipWithDetails>[] => [
  {
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mã phiếu" />
    ),
    cell: ({ row }) => <div className="font-mono text-muted-foreground">{row.original.code}</div>,
    enableSorting: true,
  },
  {
    accessorKey: "lender.fullName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Người mượn" />
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-3'>
        <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary'>
          {row.original.lender.fullName.charAt(0)}
        </div>
        <span className='font-medium text-foreground'>
          {row.original.lender.fullName}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "borrowDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ngày mượn" />
    ),
    cell: ({ row }) => <div>{format(new Date(row.original.borrowDate), 'dd/MM/yyyy')}</div>,
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Hạn trả" />
    ),
    cell: ({ row }) => {
      const slip = row.original;
      const isReturned = slip.status === 'RETURNED';
      const isOverdue =
        slip.status === 'OVERDUE' ||
        (new Date() > new Date(slip.dueDate) && !isReturned);

      return (
        <div
          className={cn(
            'font-medium',
            isOverdue && !isReturned
              ? 'text-destructive'
              : 'text-muted-foreground'
          )}
        >
          {format(new Date(row.original.dueDate), 'dd/MM/yyyy')}
        </div>
      )
    },
  },
  {
    id: "items",
    header: "Hồ sơ",
    cell: ({ row }) => (
      <div>
        {row.original.items.length > 0 ? (
          row.original.items.map((item) => item.file.code).join(', ')
        ) : (
          <span className='text-muted-foreground italic'>
            Không có hồ sơ
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trạng thái" />
    ),
    cell: ({ row }) => {
      const slip = row.original;

      // Keep simplified badge logic or use statuses metadata if preferred.
      // For now sticking to original badge logic but using constants where helpful or just keeping as is since it has custom logic (overdue calc).

      const isReturned = slip.status === 'RETURNED';
      const isOverdue =
        slip.status === 'OVERDUE' ||
        (new Date() > new Date(slip.dueDate) && !isReturned);

      if (isReturned) {
        return (
          <Badge variant="outline" className="border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            Đã trả
          </Badge>
        )
      }
      if (isOverdue) {
        return (
          <Badge variant="destructive">
            Quá hạn
          </Badge>
        )
      }
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
          Đang mượn
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: "actions",
    header: "Hành động",
    cell: ({ row }) => {
      const slip = row.original;
      const isReturned = slip.status === 'RETURNED';

      return (
        <div className='flex items-center gap-1'>
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
            onClick={() => onViewHistory(slip.id)}
            className='h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50'
            title='Nhật ký'
          >
            <History className='w-4 h-4' />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(slip.id)}
            className='h-8 w-8 text-primary hover:text-primary hover:bg-primary/10'
            title='Chỉnh sửa'
          >
            <Pencil className='w-4 h-4' />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(slip.id)}
            className='h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10'
            title='Xóa'
          >
            <Trash2 className='w-4 h-4' />
          </Button>
        </div>
      )
    },
  },
]




