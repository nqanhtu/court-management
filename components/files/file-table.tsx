import { apiFetch } from '@/lib/api/client';
import * as React from 'react'
import {
  ColumnFiltersState,
  ColumnDef,
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
import { Columns3, Loader2 } from 'lucide-react'
import { useRouter } from "next/navigation"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { FileDocument, getColumns, FileWithBox } from "@/components/files/columns"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { FileTableToolbar } from '@/components/files/file-table-toolbar'
import Modal from "@/components/modal"
import BorrowForm from "@/components/borrow/borrow-form"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FileTableProps {
  files: FileWithBox[]
  isLoading?: boolean
  role?: string // For RBAC display
  canBorrow?: boolean
  onCreate?: () => void
  total?: number
  page?: number
  pageSize?: number
  onPaginationChange?: (page: number, pageSize: number) => void
  onRefresh?: () => void
}

export function FileTable({ files, isLoading, canBorrow = false, onCreate, total, page = 1, pageSize = 10, onPaginationChange, onRefresh }: FileTableProps) {
  const router = useRouter();
  const [rowSelection, setRowSelection] = React.useState({})
  const [isBorrowModalOpen, setIsBorrowModalOpen] = React.useState(false);
  const [borrowFiles, setBorrowFiles] = React.useState<FileWithBox[]>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [density, setDensity] = React.useState<'compact' | 'comfortable'>('comfortable')
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])

  // Determine if we are using manual pagination (server-side)
  const isManual = total !== undefined

  React.useEffect(() => {
    const storedVisibility = window.localStorage.getItem('files-table-column-visibility')
    const storedDensity = window.localStorage.getItem('files-table-density')

    if (storedVisibility) setColumnVisibility(JSON.parse(storedVisibility))
    if (storedDensity === 'compact' || storedDensity === 'comfortable') setDensity(storedDensity)
  }, [])

  React.useEffect(() => {
    window.localStorage.setItem('files-table-column-visibility', JSON.stringify(columnVisibility))
  }, [columnVisibility])

  React.useEffect(() => {
    window.localStorage.setItem('files-table-density', density)
  }, [density])

  const paginationState = {
    pageIndex: page - 1,
    pageSize: pageSize,
  }

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

  const handleDeleteFile = React.useCallback(async (file: FileDocument) => {
    try {
      const response = await apiFetch(`/api/files/${file.id}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Đã xóa hồ sơ')
        onRefresh?.()
        router.refresh()
        return
      }

      toast.error('Không thể xóa hồ sơ', {
        description: result.message || result.error || 'Vui lòng thử lại.',
      })
    } catch {
      toast.error('Không thể xóa hồ sơ')
    }
  }, [onRefresh, router]);

  const columns = React.useMemo<ColumnDef<FileWithBox>[]>(
    () => getColumns(undefined, () => { }, !!onCreate, handleDeleteFile) as unknown as ColumnDef<FileWithBox>[],
    [onCreate, handleDeleteFile]
  )

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

  return (
    <div className="space-y-4">
      <FileTableToolbar
        table={table}
        onCreate={onCreate}
        onBorrow={canBorrow ? handleBorrow : undefined}
        density={density}
        onDensityChange={setDensity}
      />
      <div className="overflow-hidden rounded-md border">
        <div className="flex items-center justify-end gap-2 border-b bg-muted/30 px-2 py-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="h-4 w-4" />
                Cột hiển thị
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Tùy chỉnh bảng</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="max-h-[65vh] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
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
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={density === 'compact' ? 'py-2' : undefined}>
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
                  Không có kết quả.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
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
