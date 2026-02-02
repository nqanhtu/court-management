"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import { UserModel } from '@/generated/prisma/models';
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"

interface ColumnActions {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  currentUserRole?: string;
  isAdmin: boolean;
}

export const getColumns = ({ onEdit, onDelete, isAdmin }: ColumnActions): ColumnDef<UserModel>[] => [
  {
    accessorKey: "username",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tên đăng nhập" />
    ),
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("username")}</div>,
    enableSorting: true,
  },
  {
    accessorKey: "fullName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Họ và Tên" />
    ),
    cell: ({ row }) => <div className="font-medium text-foreground">{row.getValue("fullName")}</div>,
    enableSorting: true,
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vai trò" />
    ),
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.getValue("role")}
      </Badge>
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "unit",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Đơn vị" />
    ),
    cell: ({ row }) => <div>{row.getValue("unit") || '-'}</div>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trạng thái" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status");
      return status ? (
        <Badge variant="success">
          Hoạt động
        </Badge>
      ) : (
        <Badge variant="destructive">Khoá</Badge>
      );
    },
    filterFn: (row, id, value) => {
      const rowValue = String(row.getValue(id));
      return value.includes(rowValue);
    },
  },
  {
    id: "actions",
    header: "Hành động",
    cell: ({ row }) => {
      if (!isAdmin) return null;
      
      const user = row.original;
      return (
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
      )
    },
  },
]
