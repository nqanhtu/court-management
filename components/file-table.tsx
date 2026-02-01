'use client'

import * as React from 'react'
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { toast } from "sonner"
import { useRouter } from "next/navigation"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { getColumns, FileWithBox } from "@/components/files/columns"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { FileTableToolbar } from '@/components/files/file-table-toolbar'
import Modal from "@/components/Modal"
import BorrowForm from "@/components/borrow/BorrowForm"

interface FileTableProps {
    files: FileWithBox[]
    role?: string // For RBAC display
    onCreate?: () => void
    total?: number
    page?: number
    pageSize?: number
    onPaginationChange?: (page: number, pageSize: number) => void
    onRefresh?: () => void
}

export function FileTable({ files, onCreate, total, page = 1, pageSize = 10, onPaginationChange, onRefresh }: FileTableProps) {
  const router = useRouter();
  const [rowSelection, setRowSelection] = React.useState({})
  const [isBorrowModalOpen, setIsBorrowModalOpen] = React.useState(false);
  const [borrowFiles, setBorrowFiles] = React.useState<FileWithBox[]>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])

  // Determine if we are using manual pagination (server-side)
  const isManual = total !== undefined
  
  const paginationState = {
    pageIndex: page - 1,
    pageSize: pageSize,
  }

  // Use getColumns. We pass undefined for fileId (so no child actions) and a no-op for mutate.
  // We cast to any to satisfy TS constraint differences between FileDocument and FileWithBox
  const columns = React.useMemo(() => getColumns(undefined, () => {}) as any, [])

  const table = useReactTable({
    data: files,
    columns,
    pageCount: isManual ? Math.ceil(total / pageSize) : undefined,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: isManual ? paginationState : undefined,
    },
    manualPagination: isManual,
    onPaginationChange: isManual ? (updater) => {
        if (onPaginationChange) {
             const nextState = typeof updater === 'function' ? updater(paginationState) : updater;
             onPaginationChange(nextState.pageIndex + 1, nextState.pageSize);
        }
    } : undefined,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const handleBorrow = (selectedFiles: FileWithBox[]) => {
    const files = selectedFiles;
    const borrowed = files.filter((f) => f.status === "BORROWED");
    if (borrowed.length > 0) {
      toast.error(
        `Có ${borrowed.length} hồ sơ đang được mượn không thể tạo phiếu.`
      );
      return;
    }
    setBorrowFiles(files);
    setIsBorrowModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <FileTableToolbar table={table} onCreate={onCreate} onBorrow={handleBorrow} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} totalRows={total} />

      <Modal
        isOpen={isBorrowModalOpen}
        onClose={() => setIsBorrowModalOpen(false)}
        title="Tạo phiếu mượn hồ sơ"
        className="max-w-5xl"
      >
        <BorrowForm
          initialFiles={borrowFiles}
          onSuccess={() => {
            setIsBorrowModalOpen(false);
            setRowSelection({});
            router.refresh();
            onRefresh?.();
          }}
        />
      </Modal>
    </div>
  )
}
