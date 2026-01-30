'use client'
'use no memo';

import * as React from 'react';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle2, FileClock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useReportStats } from "@/lib/hooks/use-reports";
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { columns, RecentBorrow } from "@/components/reports/columns";

export function ReportDashboard() {
    const { stats, isLoading } = useReportStats();

    // Memoize the data for the table
    const recentBorrows = React.useMemo(() => 
        (stats?.recentBorrows || []) as RecentBorrow[], 
    [stats]);

    const table = useReactTable({
        data: recentBorrows,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Đang tải báo cáo...</span>
            </div>
        )
    }

    const { totalBorrows, activeBorrows, overdueBorrows, returnedRate } = stats;

    return (
        <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Tổng lượt mượn", value: totalBorrows.toString(), icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Đang mượn", value: activeBorrows.toString(), icon: FileClock, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Quá hạn", value: overdueBorrows.toString(), icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
                    { label: "Đã trả đúng hạn", value: `${returnedRate}%`, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
                ].map((stat, i) => (
                    <Card key={i} className="flex items-center gap-4 p-5 hover:shadow-md transition-shadow">
                        <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Data Table Card */}
            <Card className="flex-1 overflow-hidden flex flex-col">
                <CardHeader className="border-b bg-slate-50/50 py-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-slate-400" />
                        Chi tiết giao dịch gần đây
                    </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 overflow-auto p-0">
                    <Table>
                        <TableHeader className="bg-white sticky top-0 z-10">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead key={header.id} colSpan={header.colSpan} className="whitespace-nowrap">
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
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        Chưa có dữ liệu giao dịch.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>

                {/* Pagination Footer */}
                <div className="p-4 border-t bg-slate-50/50 flex items-center justify-between shrink-0">
                    <span className="text-xs text-muted-foreground">Hiển thị {recentBorrows.length} giao dịch gần nhất</span>
                </div>
            </Card>
        </>
    );
}
