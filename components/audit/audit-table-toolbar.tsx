"use client"

import { Table } from "@tanstack/react-table"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter";
import { useDebouncedCallback } from "use-debounce";

interface AuditTableToolbarProps<TData> {
  table: Table<TData>
  searchTerm: string;
  onSearchChange: (value: string) => void;
  actionFilter: string;
  onActionChange: (value: string) => void;
}

export function AuditTableToolbar<TData>({
  searchTerm,
  onSearchChange,
  actionFilter,
  onActionChange,
}: AuditTableToolbarProps<TData>) {
  // Since we are server-side filtering, we don't check table.getState().columnFilters
  // Instead we rely on the props passed down from the URL/State

  const isFiltered = !!searchTerm || (actionFilter && actionFilter !== 'ALL');
  
  const handleReset = () => {
    onSearchChange('');
    onActionChange('ALL');
  };

  const debouncedSearch = useDebouncedCallback((value) => {
    onSearchChange(value);
  }, 300);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center gap-2">
        <Input
          placeholder="Tìm kiếm người dùng, đối tượng..."
          defaultValue={searchTerm}
          onChange={(event) => debouncedSearch(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        
        <DataTableFacetedFilter
            title="Hành động"
            options={[
                { label: 'Thêm mới', value: 'CREATE' },
                { label: 'Cập nhật', value: 'UPDATE' },
                { label: 'Xóa', value: 'DELETE' },
                { label: 'Đăng nhập', value: 'LOGIN' },
            ]}
            value={actionFilter && actionFilter !== 'ALL' ? [actionFilter] : []}
            onFilter={(values) => onActionChange(values?.[0] || 'ALL')}
        />

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
    </div>
  )
}
