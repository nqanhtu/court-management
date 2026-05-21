"use client";
"use no memo";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Laptop, Loader2, LogIn, LogOut, Search, ShieldCheck, Users, X } from "lucide-react";

import { useAccessLogs } from "@/lib/hooks/use-access-logs";
import { useUsers } from "@/lib/hooks/use-users";
import type { UserAccessLogDto } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { useDebouncedCallback } from "use-debounce";

const columns: ColumnDef<UserAccessLogDto>[] = [
  {
    accessorKey: "occurredAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Thời gian" />,
    cell: ({ row }) => (
      <div className="font-medium tabular-nums">
        {format(new Date(row.original.occurredAt), "dd/MM/yyyy HH:mm:ss")}
      </div>
    ),
  },
  {
    accessorKey: "user",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tài khoản" />,
    cell: ({ row }) => {
      const user = row.original.user;
      return (
        <div>
          <p className="font-semibold text-foreground">{user?.fullName || "Không xác định"}</p>
          <p className="text-xs text-muted-foreground">@{user?.username || row.original.userId}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "event",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sự kiện" />,
    cell: ({ row }) => row.original.event === "LOGIN"
      ? <Badge variant="success"><LogIn className="mr-1 h-3 w-3" /> Đăng nhập</Badge>
      : <Badge variant="secondary"><LogOut className="mr-1 h-3 w-3" /> Đăng xuất</Badge>,
  },
  {
    accessorKey: "ipAddress",
    header: ({ column }) => <DataTableColumnHeader column={column} title="IP" />,
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.ipAddress || "unknown"}</span>,
  },
  {
    accessorKey: "deviceType",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Thiết bị" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Laptop className="h-4 w-4 text-muted-foreground" />
        <span className="capitalize">{row.original.deviceType || "unknown"}</span>
      </div>
    ),
  },
  {
    accessorKey: "osName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Hệ điều hành" />,
    cell: ({ row }) => [row.original.osName, row.original.osVersion].filter(Boolean).join(" ") || "-",
  },
  {
    accessorKey: "browserName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Trình duyệt" />,
    cell: ({ row }) => [row.original.browserName, row.original.browserVersion].filter(Boolean).join(" ") || "-",
  },
];

export function AccessLogList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("limit")) || 20;
  const searchTerm = searchParams.get("q") || "";
  const eventFilter = searchParams.get("accessEvent") || "ALL";
  const userFilter = searchParams.get("userId") || "ALL";
  const { users } = useUsers();
  const { logs, total, summary, isLoading } = useAccessLogs({
    query: searchTerm,
    event: eventFilter,
    userId: userFilter,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "ALL") params.set(key, value);
    else params.delete(key);
    params.set("tab", "access");
    params.set("page", "1");
    router.replace(`?${params.toString()}`);
  };

  const debouncedSearch = useDebouncedCallback((value: string) => {
    updateParam("q", value);
  }, 300);

  const resetFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", "access");
    params.delete("q");
    params.delete("accessEvent");
    params.delete("userId");
    params.set("page", "1");
    router.replace(`?${params.toString()}`);
  };

  const paginationState = {
    pageIndex: page - 1,
    pageSize,
  };

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: logs,
    columns,
    pageCount: Math.ceil(total / pageSize),
    state: { pagination: paginationState },
    manualPagination: true,
    onPaginationChange: (updater) => {
      const nextState = typeof updater === "function" ? updater(paginationState) : updater;
      const params = new URLSearchParams(searchParams);
      params.set("tab", "access");
      params.set("page", (nextState.pageIndex + 1).toString());
      params.set("limit", nextState.pageSize.toString());
      router.replace(`?${params.toString()}`);
    },
    getCoreRowModel: getCoreRowModel(),
  });

  const isFiltered = !!searchTerm || eventFilter !== "ALL" || userFilter !== "ALL";
  const userOptions = users.map((user) => ({ label: `${user.fullName} (@${user.username})`, value: user.id }));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard icon={LogIn} label="Đăng nhập" value={summary.totalLogins} />
        <SummaryCard icon={LogOut} label="Đăng xuất" value={summary.totalLogouts} />
        <SummaryCard icon={Users} label="Tài khoản truy cập" value={summary.activeUsers} />
        <SummaryCard
          icon={ShieldCheck}
          label="Truy cập gần nhất"
          value={summary.lastAccessAt ? format(new Date(summary.lastAccessAt), "dd/MM HH:mm") : "-"}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm tài khoản, IP, thiết bị..."
            defaultValue={searchTerm}
            onChange={(event) => debouncedSearch(event.target.value)}
            className="h-8 w-[260px] pl-8"
          />
        </div>
        <DataTableFacetedFilter
          title="Sự kiện"
          options={[
            { label: "Đăng nhập", value: "LOGIN" },
            { label: "Đăng xuất", value: "LOGOUT" },
          ]}
          value={eventFilter !== "ALL" ? [eventFilter] : []}
          onFilter={(values) => updateParam("accessEvent", values?.[0] || "ALL")}
        />
        <DataTableFacetedFilter
          title="Tài khoản"
          options={userOptions}
          value={userFilter !== "ALL" ? [userFilter] : []}
          onFilter={(values) => updateParam("userId", values?.[0] || "ALL")}
        />
        {isFiltered && (
          <Button variant="ghost" onClick={resetFilters} className="h-8 px-2 lg:px-3">
            Đặt lại
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Không tìm thấy lịch sử truy cập phù hợp.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} totalRows={total} />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3 py-1">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-semibold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
