"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, RotateCcw, Trash2, History } from "lucide-react"
import { BorrowSlipWithDetails } from '@/lib/types/borrow';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
interface ColumnActions {
  onReturn: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewHistory: (id: string) => void;
  canManageBorrow?: boolean;
}

export const getColumns = ({ onReturn, onEdit, onDelete, onViewHistory, canManageBorrow = false }: ColumnActions): ColumnDef<BorrowSlipWithDetails>[] => [
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
      const now = new Date();
      const dueDate = new Date(slip.dueDate);
      const soonDate = new Date();
      soonDate.setDate(now.getDate() + 3);

      const isReturned = slip.status === 'RETURNED';
      const isOverdue = slip.status === 'OVERDUE' || (now > dueDate && !isReturned);
      const isSoonOverdue = !isReturned && !isOverdue && dueDate <= soonDate;

      return (
        <div
          className={cn(
            'font-medium',
            isOverdue ? 'text-destructive' : isSoonOverdue ? 'text-amber-600' : 'text-muted-foreground'
          )}
        >
          {format(dueDate, 'dd/MM/yyyy')}
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
      const now = new Date();
      const dueDate = new Date(slip.dueDate);
      const soonDate = new Date();
      soonDate.setDate(now.getDate() + 3);

      const isReturned = slip.status === 'RETURNED';
      const isOverdue = slip.status === 'OVERDUE' || (now > dueDate && !isReturned);
      const isSoonOverdue = !isReturned && !isOverdue && dueDate <= soonDate;

      if (isReturned) {
        return (
          <Badge variant="success">
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
      if (isSoonOverdue) {
        return (
          <Badge variant="warning" className="bg-amber-500 hover:bg-amber-600">
            Sắp hết hạn
          </Badge>
        )
      }
      return (
        <Badge variant="warning">
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

      if (!canManageBorrow) {
        return (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewHistory(slip.id)}
            className='h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50'
            title='Nháº­t kÃ½'
          >
            <History className='w-4 h-4' />
          </Button>
        )
      }

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




