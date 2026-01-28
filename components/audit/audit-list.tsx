'use client'

import { useSearchParams } from 'next/navigation';
import { AuditLogWithUser, useAudit } from '@/lib/hooks/use-audit';
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
            case 'CREATE': return <Badge variant="outline" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">THÊM MỚI</Badge>;
            case 'UPDATE': return <Badge variant="outline" className="bg-sky-100 text-sky-700 hover:bg-sky-100 border-sky-200">CẬP NHẬT</Badge>;
            case 'DELETE': return <Badge variant="destructive">XÓA</Badge>;
            case 'LOGIN': return <Badge variant="outline" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200">ĐĂNG NHẬP</Badge>;
            default: return <Badge variant="outline">{action}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    return (
        <>
            <div className='flex-1 overflow-auto bg-muted/10'>
                <Table>
                    <TableHeader className="bg-card sticky top-0 z-10 shadow-sm">
                        <TableRow>
                            <TableHead className="w-[180px] font-semibold text-muted-foreground">Thời gian</TableHead>
                            <TableHead className="font-semibold text-muted-foreground">Tài khoản</TableHead>
                            <TableHead className="font-semibold text-muted-foreground">Hành động</TableHead>
                            <TableHead className="font-semibold text-muted-foreground">Đối tượng</TableHead>
                            <TableHead className="font-semibold text-muted-foreground">Chi tiết</TableHead>
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
                            logs.map((log: AuditLogWithUser) => (
                                <TableRow key={log.id} className="bg-card hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium text-foreground tabular-nums">
                                        {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
                                                {log.user?.fullName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">{log.user?.fullName}</p>
                                                <p className="text-xs text-muted-foreground">@{log.user?.username}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getActionBadge(log.action)}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                                            {log.target}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                        <div className="max-w-xs truncate bg-muted p-2 rounded border border-border font-mono" title={JSON.stringify(log.detail, null, 2)}>
                                            {JSON.stringify(log.detail)}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className='p-3 border-t border-border bg-card flex items-center justify-between shrink-0'>
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
