import { BarChart3, TrendingUp, AlertCircle, CheckCircle2, FileClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getReportStats } from "@/lib/actions/borrow-queries";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export async function ReportDashboard() {
    const { totalBorrows, activeBorrows, overdueBorrows, returnedRate, recentBorrows } = await getReportStats();

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
                            <TableRow>
                                <TableHead className="whitespace-nowrap">Mã mượn</TableHead>
                                <TableHead className="whitespace-nowrap">Hồ sơ số</TableHead>
                                <TableHead className="whitespace-nowrap">Ngày mượn</TableHead>
                                <TableHead className="whitespace-nowrap">Hạn trả</TableHead>
                                <TableHead className="whitespace-nowrap">Thời gian trả</TableHead>
                                <TableHead className="whitespace-nowrap">Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentBorrows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        Chưa có dữ liệu giao dịch.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                recentBorrows.map((slip) => {
                                    const isReturned = slip.status === "RETURNED";
                                    const isOverdue = slip.status === "OVERDUE" || (new Date() > new Date(slip.dueDate) && !isReturned);

                                    return (
                                        <TableRow key={slip.id}>
                                            <TableCell className="font-medium text-slate-800">{slip.code}</TableCell>
                                            <TableCell>
                                                {slip.items.length > 0 ? slip.items.map(i => i.file.code).join(", ") : "-"}
                                            </TableCell>
                                            <TableCell>{format(new Date(slip.borrowDate), "dd/MM/yyyy")}</TableCell>
                                            <TableCell>{format(new Date(slip.dueDate), "dd/MM/yyyy")}</TableCell>
                                            <TableCell>
                                                {slip.returnedDate ? format(new Date(slip.returnedDate), "dd/MM/yyyy") : "-"}
                                            </TableCell>
                                            <TableCell>
                                                {isReturned ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium border border-emerald-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Đã trả
                                                    </span>
                                                ) : isOverdue ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium border border-red-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Quá hạn
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium border border-amber-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Đang mượn
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
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
