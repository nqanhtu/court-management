"use client"

import { Table } from "@tanstack/react-table"
import { X, Search } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"

interface FileTableToolbarProps<TData> {
  table: Table<TData>
  onCreate?: () => void
}

// TODO: Define status options properly or import shared constants
const statuses = [
    {
        value: "BORROWED",
        label: "Đang mượn",
    },
    {
        value: "IN_STOCK",
        label: "Lưu kho",
    },
]

export function FileTableToolbar<TData>({
  table,
  onCreate,
}: FileTableToolbarProps<TData>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isFiltered = !!searchParams.get('q') || !!searchParams.get('type') || table.getState().columnFilters.length > 0

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams)
    if (term) {
        params.set('q', term)
    } else {
        params.delete('q')
    }
    params.set('page', '1')
    router.replace(`/?${params.toString()}`)
  }, 300)

  const handleTypeChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== 'all') {
        params.set('type', value)
    } else {
        params.delete('type')
    }
    params.set('page', '1')
    router.replace(`/?${params.toString()}`)
  }

  const handleReset = () => {
     table.resetColumnFilters()
     const params = new URLSearchParams(searchParams);
     params.delete('q');
     params.delete('type');
     router.replace(`/?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
            placeholder="Tìm kiếm hồ sơ (mã, tiêu đề)..."
            defaultValue={searchParams.get('q')?.toString()}
            onChange={(event) => handleSearch(event.target.value)}
            className="h-9 w-[150px] lg:w-[250px] pl-8"
            />
        </div>
        
        <DataTableFacetedFilter
            title="Loại án"
            options={[
                { label: 'Hình sự', value: 'Hình sự' },
                { label: 'Dân sự', value: 'Dân sự' },
                { label: 'Hành chính', value: 'Hành chính' },
                { label: 'Kinh tế', value: 'Kinh tế' },
            ]}
            value={searchParams.get('type') ? [searchParams.get('type')!] : []}
            onFilter={(values) => handleTypeChange(values?.[0] || 'all')}
        />

        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Trạng thái"
            options={statuses}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={handleReset}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      {onCreate && (
        <Button size="sm" onClick={onCreate}>
          Thêm hồ sơ
        </Button>
      )}
    </div>
  )
}
