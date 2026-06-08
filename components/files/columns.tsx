"use client";

import { apiFetch } from '@/lib/api/client';

import { Link } from 'react-router-dom'
import { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChildDocumentFormModal } from "./child-document-form-modal"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner'
import { Badge } from "@/components/ui/badge"


import type { FileDto, StorageBoxDto } from "@/lib/api/types"
import { Checkbox } from "../ui/checkbox"

export type FileWithBox = FileDto & {
  box: StorageBoxDto | null
}

export type FileDocument = {
  id: string
  order?: number | null
  title: string
  contentIndex?: string | null
  indexCode?: string | null // For FileWithBox
  code?: string | null
  year?: number | null
  pageCount?: number | null
  note?: string | null
  status?: string | null
  createdBy?: { id: string, username: string, fullName: string } | null
  updatedBy?: { id: string, username: string, fullName: string } | null
}

export const getColumns = (
  fileId: string | undefined,
  mutate: () => void,
  canManageFiles = false,
  onDeleteFile?: (file: FileDocument) => void
): ColumnDef<FileDocument>[] => {
  const cols: ColumnDef<FileDocument>[] = [
    {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
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
      accessorKey: "title",
      header: "Trích yếu / Tên văn bản",
      cell: ({ row }) => (
        <div className="font-medium max-w-100">
          {!fileId ? (
            <Link 
              to={`/files/${row.original.id}`}
              className="hover:underline hover:text-primary transition-colors cursor-pointer"
            >
              {row.original.title}
            </Link>
          ) : (
             <span>{row.original.title}</span>
          )}
          {/* Support both contentIndex (Child) and indexCode (Parent) */}
          {(row.original.contentIndex || row.original.indexCode) && (
            <div className="text-xs text-muted-foreground mt-1">
              MLVB: {row.original.contentIndex || row.original.indexCode}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.original.status || "IN_STOCK"
        const variant = status === "BORROWED" ? "warning" : status === "ARCHIVED" || status === "LOST" ? "secondary" : "default"
        const label = status === "BORROWED"
          ? "Đang mượn"
          : status === "ARCHIVED"
            ? "Ngừng sử dụng"
            : status === "LOST"
              ? "Thất lạc"
              : "Trong kho"
        
        return (
          <Badge variant={variant}>
            {label}
          </Badge>
        )
      },
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
      accessorKey: "createdBy",
      header: "Người tạo",
      cell: ({ row }) => <div className="text-muted-foreground text-xs truncate max-w-[120px]">{row.original.createdBy?.fullName || row.original.createdBy?.username || "-"}</div>,
    },
    {
      accessorKey: "updatedBy",
      header: "Người cập nhật",
      cell: ({ row }) => <div className="text-muted-foreground text-xs truncate max-w-[120px]">{row.original.updatedBy?.fullName || row.original.updatedBy?.username || "-"}</div>,
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
    {
      id: "actions",
      cell: ({ row }) => {
        const doc = row.original

        if (!fileId) {
          return (
            <div className="flex items-center justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Lưu trữ hồ sơ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Hồ sơ sẽ chuyển sang trạng thái ngừng sử dụng và bị ẩn khỏi danh sách mặc định. Lịch sử mượn/trả vẫn được giữ lại.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => onDeleteFile?.(doc)}
                    >
                      Lưu trữ
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )
        }

        return (
          <div className="flex items-center">
            <ChildDocumentFormModal
              fileId={fileId ?? ""}
              document={doc}
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/50 dark:hover:text-amber-400">
                  <Pencil className="h-4 w-4" />
                </Button>
              }
              onSuccess={() => mutate()}
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"><Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận xóa văn bản?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Hành động này không thể hoàn tác. Văn bản này sẽ bị xóa vĩnh viễn khỏi hồ sơ.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={async () => {
                    try {
                      const res = await apiFetch(`/api/documents/${doc.id}`, {
                        method: 'DELETE'
                      })
                      if (res.ok) {
                        toast.success('Xóa thành công')
                        mutate()
                      } else {
                        toast.error('Xóa thất bại')
                      }
                    } catch {
                      toast.error('Xóa thất bại')
                    }
                  }}>Xóa</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      },
    }
  ]

  return canManageFiles ? cols : cols.filter((column) => column.id !== "actions")
}


