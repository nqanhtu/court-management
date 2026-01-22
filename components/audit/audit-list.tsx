'use client'

import { useSearchParams } from 'next/navigation';
import { useAudit } from '@/lib/hooks/use-audit';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Loader2 } from 'lucide-react';

export function AuditList() {
    const searchParams = useSearchParams();
    const page = Number(searchParams.get('page')) || 1;
    const searchTerm = searchParams.get('q') || '';
    const actionFilter = searchParams.get('action') || 'ALL';

    const { logs, total, isLoading } = useAudit({
        query: searchTerm,
        action: actionFilter,
        limit: 20,
        offset: (page - 1) * 20
    });

    const totalPages = Math.ceil(total / 20);

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'CREATE': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">THÊM MỚI</Badge>;
            case 'UPDATE': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">CẬP NHẬT</Badge>;
            case 'DELETE': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">XÓA</Badge>;
            case 'LOGIN': return <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200">ĐĂNG NHẬP</Badge>;
            default: return <Badge variant="outline">{action}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    return (
        <>
            <div className='flex-1 overflow-auto bg-slate-50/50'>
                <Table>
                    <TableHeader className="bg-white sticky top-0 z-10 shadow-sm">
                        <TableRow>
                            <TableHead className="w-[180px]">Thời gian</TableHead>
                            <TableHead>Tài khoản</TableHead>
                            <TableHead>Hành động</TableHead>
                            <TableHead>Đối tượng</TableHead>
                            <TableHead>Chi tiết</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                    Không tìm thấy dữ liệu nhật ký phù hợp.
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id} className="bg-white">
                                    <TableCell className="font-medium text-slate-600 tabular-nums">
                                        {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-100">
                                                {log.user?.fullName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{log.user?.fullName}</p>
                                                <p className="text-xs text-slate-400">@{log.user?.username}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getActionBadge(log.action)}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-mono text-[10px] uppercase bg-slate-100 text-slate-600 border-slate-200">
                                            {log.target}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-xs">
                                        <div className="max-w-xs truncate bg-slate-50 p-2 rounded border border-slate-100 font-mono" title={JSON.stringify(log.detail, null, 2)}>
                                            {JSON.stringify(log.detail)}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className='p-3 border-t border-slate-100 bg-white flex items-center justify-between shrink-0'>
                <PaginationControls
                    hasNextPage={page < totalPages}
                    hasPrevPage={page > 1}
                    totalPages={totalPages}
                    currentPage={page}
                />
            </div>
        </>
    );
}
