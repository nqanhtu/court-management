"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { AuditLogWithUser } from "@/lib/hooks/use-audit"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"

export const columns: ColumnDef<AuditLogWithUser>[] = [
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Thời gian" />
    ),
    cell: ({ row }) => (
      <div className="font-medium text-foreground tabular-nums">
        {format(new Date(row.getValue("createdAt")), 'dd/MM/yyyy HH:mm:ss')}
      </div>
    ),
    enableSorting: false, // Audit list usually sorted by server default
  },
  {
    accessorKey: "user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tài khoản" />
    ),
    cell: ({ row }) => {
      const user = row.original.user;
      return (
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
                {user?.fullName.charAt(0)}
            </div>
            <div>
                <p className="text-sm font-semibold text-foreground">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground">@{user?.username}</p>
            </div>
        </div>
      )
    },
  },
  {
    accessorKey: "action",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Hành động" />
    ),
    cell: ({ row }) => {
      const action = row.getValue("action") as string;
      switch (action) {
        case 'CREATE': return <Badge variant="outline" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">THÊM MỚI</Badge>;
        case 'UPDATE': return <Badge variant="outline" className="bg-sky-100 text-sky-700 hover:bg-sky-100 border-sky-200">CẬP NHẬT</Badge>;
        case 'DELETE': return <Badge variant="destructive">XÓA</Badge>;
        case 'LOGIN': return <Badge variant="outline" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200">ĐĂNG NHẬP</Badge>;
        default: return <Badge variant="outline">{action}</Badge>;
      }
    },
  },
  {
    accessorKey: "target",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Đối tượng" />
    ),
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-mono text-[10px] uppercase">
        {row.getValue("target")}
      </Badge>
    ),
  },
  {
    accessorKey: "detail",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Chi tiết" />
    ),
    cell: ({ row }) => (
      <div className="text-muted-foreground text-xs">
        <div className="max-w-xs truncate bg-muted p-2 rounded border border-border font-mono" title={JSON.stringify(row.original.detail, null, 2)}>
            {JSON.stringify(row.original.detail)}
        </div>
      </div>
    ),
  },
]
