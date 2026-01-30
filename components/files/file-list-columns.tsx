"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { File } from "@/app/generated/prisma/client"

// Use the same type as in file-table.tsx
export interface FileWithBox extends File {
    box?: { code: string } | null
}

export const columns: ColumnDef<FileWithBox>[] = [
  {
    id: "order",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Order
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    cell: ({ row }) => <div className="pl-4">{row.index + 1}</div>,
  },
  {
    accessorKey: "title",
    header: "Trích yếu / Tên văn bản",
    cell: ({ row }) => (
      <div className="font-medium max-w-[400px]">
        {row.original.title}
        {row.original.indexCode && (
          <div className="text-xs text-muted-foreground mt-1">
            MLVB: {row.original.indexCode}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "code",
    header: "Mã VB / MLHS",
    cell: ({ row }) => (
      <div className="flex flex-col text-xs gap-1">
        <span>{row.original.code || "-"}</span>
      </div>
    ),
  },
  {
    accessorKey: "year",
    header: "Thời gian",
    cell: ({ row }) => <div>{row.original.year || "-"}</div>,
  },
  {
    accessorKey: "pageCount",
    header: () => <div className="text-right">Số tờ</div>,
    cell: ({ row }) => <div className="text-right">{row.original.pageCount}</div>,
  },
  {
    accessorKey: "note",
    header: "Ghi chú",
    cell: ({ row }) => (
      <div
        className="text-muted-foreground text-xs max-w-[200px] truncate"
        title={row.original.note || ""}
      >
        {row.original.note}
      </div>
    ),
  },
]
