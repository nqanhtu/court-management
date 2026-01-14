'use client';

import { useEffect, useState } from 'react';
import { getAuditLogs } from '@/lib/actions/audit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, History, User, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuditLog {
    id: string;
    action: string;
    target: string;
    detail: unknown;
    createdAt: Date;
    user?: {
        fullName: string;
        username: string;
    } | null;
}

export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const res = await getAuditLogs(page);
                setLogs(res.logs);
                setTotalPages(res.totalPages);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [page]);

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'CREATE': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">THÊM MỚI</Badge>;
            case 'UPDATE': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">CẬP NHẬT</Badge>;
            case 'DELETE': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">XÓA</Badge>;
            default: return <Badge variant="outline">{action}</Badge>;
        }
    };

    return (
        <div className="container mx-auto py-6 space-y-6 max-w-6xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <History className="w-8 h-8 text-indigo-600" />
                        Nhật ký hệ thống
                    </h1>
                    <p className="text-slate-500 mt-1">Lịch sử truy vết và thao tác dữ liệu (Security Log).</p>
                </div>
                <div className="bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
                    <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Tổng số thao tác</p>
                    <p className="text-xl font-bold text-indigo-700">-</p>
                </div>
            </div>

            <Card className="shadow-sm border-slate-200">
                <CardHeader className="bg-slate-50/50">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-slate-400" />
                        Danh sách thao tác
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="w-[180px]">Thời gian</TableHead>
                                <TableHead>Tài khoản</TableHead>
                                <TableHead>Hành động</TableHead>
                                <TableHead>Đối tượng</TableHead>
                                <TableHead>Chi tiết</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-300" />
                                        <p className="text-slate-400 mt-2">Đang tải dữ liệu...</p>
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-slate-400">
                                        Chưa có nhật ký ghi lại.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                        <TableCell className="font-medium text-slate-600 tabular-nums">
                                            {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center">
                                                    <User className="w-4 h-4 text-slate-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold">{log.user?.fullName}</p>
                                                    <p className="text-xs text-slate-400">@{log.user?.username}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getActionBadge(log.action)}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                                                {log.target}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-xs">
                                            <pre className="font-sans whitespace-pre-wrap truncate max-w-xs">
                                                {JSON.stringify(log.detail)}
                                            </pre>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-slate-500">Trang {page} / {totalPages}</p>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1 || loading}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Trước
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === totalPages || loading}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Sau
                    </Button>
                </div>
            </div>
        </div>
    );
}
