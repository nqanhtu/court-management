'use client';

import { useEffect, useState, useMemo } from 'react';
import { getAuditLogs } from '@/lib/actions/audit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, History, User, Activity, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('ALL');

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
            case 'CREATE': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">THÊM MỚI</Badge>;
            case 'UPDATE': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">CẬP NHẬT</Badge>;
            case 'DELETE': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">XÓA</Badge>;
            case 'LOGIN': return <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200">ĐĂNG NHẬP</Badge>;
            default: return <Badge variant="outline">{action}</Badge>;
        }
    };

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch = !searchTerm || 
                log.user?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.target.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
            
            return matchesSearch && matchesAction;
        });
    }, [logs, searchTerm, actionFilter]);

    return (
        <div className="flex flex-col h-full space-y-4 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <History className="w-6 h-6 text-indigo-600" />
                        Nhật ký hệ thống
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Lịch sử truy vết và thao tác dữ liệu (Security Log).</p>
                </div>
            </div>

            <div className='flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden'>
                {/* Filters Header */}
                <div className='p-4 border-b border-slate-200 flex flex-wrap items-center gap-3 bg-white shrink-0'>
                    <div className='flex items-center gap-2'>
                        <Filter className='w-5 h-5 text-indigo-600' />
                        <h3 className='font-bold text-slate-700'>Bộ lọc</h3>
                    </div>
                    <div className='h-6 w-px bg-slate-200 mx-2 hidden md:block'></div>

                    <div className='flex items-center gap-2'>
                        <Select value={actionFilter} onValueChange={setActionFilter}>
                            <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200 h-9">
                                <SelectValue placeholder="Hành động" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tất cả hành động</SelectItem>
                                <SelectItem value="CREATE">Thêm mới</SelectItem>
                                <SelectItem value="UPDATE">Cập nhật</SelectItem>
                                <SelectItem value="DELETE">Xóa</SelectItem>
                                <SelectItem value="LOGIN">Đăng nhập</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className='flex-1 min-w-50 relative max-w-md ml-auto'>
                        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10' />
                        <Input
                            type='text'
                            placeholder='Tìm kiếm người dùng, đối tượng...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='w-full pl-9 pr-4 py-1.5 bg-slate-50 border-slate-200 rounded-lg text-sm outline-none focus-visible:ring-indigo-500 transition-all h-9'
                        />
                    </div>
                </div>

                <div className='flex-1 overflow-auto bg-slate-50'>
                    <Table className="w-full text-sm text-left border-collapse">
                        <TableHeader className="bg-white text-slate-600 sticky top-0 shadow-sm z-10">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="px-6 py-3 font-semibold whitespace-nowrap border-b border-slate-200 bg-slate-50/90 backdrop-blur-sm">Thời gian</TableHead>
                                <TableHead className="px-6 py-3 font-semibold whitespace-nowrap border-b border-slate-200 bg-slate-50/90 backdrop-blur-sm">Tài khoản</TableHead>
                                <TableHead className="px-6 py-3 font-semibold whitespace-nowrap border-b border-slate-200 bg-slate-50/90 backdrop-blur-sm">Hành động</TableHead>
                                <TableHead className="px-6 py-3 font-semibold whitespace-nowrap border-b border-slate-200 bg-slate-50/90 backdrop-blur-sm">Đối tượng</TableHead>
                                <TableHead className="px-6 py-3 font-semibold whitespace-nowrap border-b border-slate-200 bg-slate-50/90 backdrop-blur-sm">Chi tiết</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-100 bg-white">
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                            <p className="text-slate-400 mt-2">Đang tải dữ liệu...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-slate-400">
                                        Không tìm thấy dữ liệu nhật ký phù hợp.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-indigo-50/50 transition-colors group">
                                        <TableCell className="px-6 py-3.5 font-medium text-slate-600 tabular-nums">
                                            {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                                        </TableCell>
                                        <TableCell className="px-6 py-3.5">
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
                                        <TableCell className="px-6 py-3.5">{getActionBadge(log.action)}</TableCell>
                                        <TableCell className="px-6 py-3.5">
                                            <Badge variant="secondary" className="font-mono text-[10px] uppercase bg-slate-100 text-slate-600 border-slate-200">
                                                {log.target}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-3.5 text-slate-500 text-xs">
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

                {/* Pagination Footer */}
                <div className='p-3 border-t border-slate-100 bg-white flex items-center justify-between shrink-0'>
                    <span className='text-xs text-slate-500'>
                        Trang {page} trên {totalPages}
                    </span>
                    <div className='flex gap-2'>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1 || loading}
                            onClick={() => setPage(p => p - 1)}
                            className="h-8"
                        >
                            Trước
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === totalPages || loading}
                            onClick={() => setPage(p => p + 1)}
                            className="h-8"
                        >
                            Sau
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
