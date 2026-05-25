"use client";

import { Table } from "@tanstack/react-table";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from '@/src/lib/router';
import { useDebouncedCallback } from "use-debounce";

import { Button } from "@/components/ui/button";
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FileTableToolbarProps<TData> {
  table: Table<TData>;
  onCreate?: () => void;
  onBorrow?: (files: TData[]) => void;
  density?: "compact" | "comfortable";
  onDensityChange?: (density: "compact" | "comfortable") => void;
}

const statuses = [
  { value: "IN_STOCK", label: "Trong kho" },
  { value: "BORROWED", label: "Đang mượn" },
  { value: "ARCHIVED", label: "Ngừng sử dụng" },
  { value: "LOST", label: "Thất lạc" },
];

const caseTypes = [
  { label: "Hình sự", value: "Hình sự" },
  { label: "Dân sự", value: "Dân sự" },
  { label: "Hành chính", value: "Hành chính" },
  { label: "Kinh tế", value: "Kinh tế" },
];

export function FileTableToolbar<TData>({
  table,
  onCreate,
  onBorrow,
  density = "comfortable",
  onDensityChange,
}: FileTableToolbarProps<TData>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const advancedFilterKeys = [
    "year",
    "judgmentNumber",
    "party",
    "warehouse",
    "line",
    "shelf",
    "slot",
  ];
  const hasAdvancedFilters = advancedFilterKeys.some((key) => !!searchParams.get(key));
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(hasAdvancedFilters);

  const isFiltered = [
    "q",
    "type",
    "status",
    ...advancedFilterKeys,
  ].some((key) => !!searchParams.get(key)) || table.getState().columnFilters.length > 0;

  const setUrlParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.replace(`/?${params.toString()}`);
  };

  const handleSearch = useDebouncedCallback((term: string) => {
    setUrlParam("q", term.trim());
  }, 300);

  const handleTextFilter = useDebouncedCallback((key: string, value: string) => {
    setUrlParam(key, value.trim());
  }, 300);

  const handleReset = () => {
    table.resetColumnFilters();
    const params = new URLSearchParams(searchParams);
    [
      "q",
      "type",
      "status",
      "year",
      "judgmentNumber",
      "party",
      "warehouse",
      "line",
      "shelf",
      "slot",
    ].forEach((key) => params.delete(key));
    params.set("page", "1");
    router.replace(`/?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm hồ sơ, mã, tiêu đề..."
              defaultValue={searchParams.get("q")?.toString()}
              onChange={(event) => handleSearch(event.target.value)}
              className="h-8 w-full pl-8 sm:w-56 lg:w-72"
            />
          </div>

          <DataTableFacetedFilter
            title="Loại án"
            options={caseTypes}
            value={searchParams.get("type") ? [searchParams.get("type")!] : []}
            onFilter={(values) => setUrlParam("type", values?.[0] || "all")}
          />

          <DataTableFacetedFilter
            title="Trạng thái"
            options={statuses}
            value={searchParams.get("status") ? [searchParams.get("status")!] : []}
            onFilter={(values) => setUrlParam("status", values?.[0] || "all")}
          />

          <Button
            type="button"
            variant={showAdvancedFilters ? "secondary" : "outline"}
            onClick={() => setShowAdvancedFilters((value) => !value)}
            className="h-8 px-2 lg:px-3"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Bộ lọc
          </Button>

          {isFiltered && (
            <Button variant="ghost" onClick={handleReset} className="h-8 px-2 lg:px-3">
              Đặt lại
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Select
            value={density}
            onValueChange={(value) => onDensityChange?.(value as "compact" | "comfortable")}
          >
            <SelectTrigger className="h-8 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comfortable">Thoáng</SelectItem>
              <SelectItem value="compact">Gọn</SelectItem>
            </SelectContent>
          </Select>

          {onBorrow &&
            (table.getFilteredSelectedRowModel().rows.length > 0 ? (
              <Button
                onClick={() =>
                  onBorrow(table.getFilteredSelectedRowModel().rows.map((row) => row.original))
                }
                className="h-8"
              >
                Tạo phiếu mượn ({table.getFilteredSelectedRowModel().rows.length})
              </Button>
            ) : (
              <Button className="h-8" disabled>Chọn hồ sơ để tạo phiếu mượn</Button>
            ))}
          {onCreate && <Button className="h-8" onClick={onCreate}>Thêm hồ sơ</Button>}
        </div>
      </div>

      {showAdvancedFilters && <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-2">
        <Input
          placeholder="Năm"
          defaultValue={searchParams.get("year")?.toString()}
          onChange={(event) => handleTextFilter("year", event.target.value)}
          className="h-8 w-[100px]"
        />
        <Input
          placeholder="Số bản án"
          defaultValue={searchParams.get("judgmentNumber")?.toString()}
          onChange={(event) => handleTextFilter("judgmentNumber", event.target.value)}
          className="h-8 w-[140px]"
        />
        <Input
          placeholder="Đương sự"
          defaultValue={searchParams.get("party")?.toString()}
          onChange={(event) => handleTextFilter("party", event.target.value)}
          className="h-8 w-[180px]"
        />
        <div className="flex flex-wrap items-center gap-2 pl-0 md:border-l md:pl-2">
          <span className="text-xs text-muted-foreground mr-1 hidden sm:inline-block">Lưu trữ:</span>
          <Input
            placeholder="Kho"
            defaultValue={searchParams.get("warehouse")?.toString()}
            onChange={(event) => handleTextFilter("warehouse", event.target.value)}
            className="h-8 w-[100px]"
          />
          <Input
            placeholder="Dãy"
            defaultValue={searchParams.get("line")?.toString()}
            onChange={(event) => handleTextFilter("line", event.target.value)}
            className="h-8 w-[100px]"
          />
          <Input
            placeholder="Kệ"
            defaultValue={searchParams.get("shelf")?.toString()}
            onChange={(event) => handleTextFilter("shelf", event.target.value)}
            className="h-8 w-[100px]"
          />
          <Input
            placeholder="Ngăn"
            defaultValue={searchParams.get("slot")?.toString()}
            onChange={(event) => handleTextFilter("slot", event.target.value)}
            className="h-8 w-[100px]"
          />
        </div>
      </div>}
    </div>
  );
}
