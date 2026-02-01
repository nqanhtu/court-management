'use client'
'use no memo';

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

import { File } from '@/generated/prisma/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { getColumns, FileWithBox, FileDocument } from "@/components/files/columns"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { FileTableToolbar } from '@/components/files/file-table-toolbar'

interface FileTableProps {
    files: FileWithBox[]
    role?: string // For RBAC display
    onCreate?: () => void
    total?: number
    page?: number
    pageSize?: number
    onPaginationChange?: (page: number, pageSize: number) => void
}

export function FileTable({ files, onCreate, total, page = 1, pageSize = 10, onPaginationChange }: FileTableProps) {
  const [rowSelection, setRowSelection] = React.useState({})
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
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="space-y-4">
      <FileTableToolbar table={table} onCreate={onCreate} />
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
    </div>
  )
}
