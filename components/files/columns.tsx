"use client"

import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react"
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


import { File, StorageBox } from "@/app/generated/prisma/client"

export type FileWithBox = File & {
  box: StorageBox | null
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
}

export const getColumns = (fileId: string | undefined, mutate: () => void): ColumnDef<FileDocument>[] => {
  const cols: ColumnDef<FileDocument>[] = [
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
              href={`/files/${row.original.id}`}
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
        const variant = status === "BORROWED" ? "destructive" : status === "LOST" ? "secondary" : "default"
        const label = status === "BORROWED" ? "Đang mượn" : status === "LOST" ? "Thất lạc" : "Trong kho"
        
        return (
          <Badge variant={variant} className="whitespace-nowrap">
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

        return (
          <div className="flex items-center">
            <ChildDocumentFormModal
              fileId={fileId ?? ""}
              document={doc}
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Pencil className="h-4 w-4" />
                </Button>
              }
              onSuccess={() => mutate()}
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this document from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={async () => {
                    try {
                      const res = await fetch(`/api/files/child-document?id=${doc.id}`, {
                        method: 'DELETE'
                      })
                      if (res.ok) {
                        toast.success('Delete successful')
                        mutate()
                      } else {
                        toast.error('Delete failed')
                      }
                    } catch (e) {
                      toast.error('Delete failed')
                    }
                  }}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      },
    }
  ]

  return cols
}


