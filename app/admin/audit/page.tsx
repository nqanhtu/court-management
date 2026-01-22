import { Suspense } from 'react';
import { History } from 'lucide-react';
import { AuditFilters } from '@/components/audit/audit-filters';
import { AuditListSection } from '@/components/audit/audit-list-section';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

function AuditTableSkeleton() {
    return (
        <div className='flex-1 overflow-auto bg-slate-50'>
            <Table className="w-full text-sm text-left border-collapse">
                <TableHeader className="bg-white text-slate-600 sticky top-0 shadow-sm z-10">
                    <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="px-6 py-3 w-[180px]">Thời gian</TableHead>
                        <TableHead className="px-6 py-3">Tài khoản</TableHead>
                        <TableHead className="px-6 py-3">Hành động</TableHead>
                        <TableHead className="px-6 py-3">Đối tượng</TableHead>
                        <TableHead className="px-6 py-3">Chi tiết</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 bg-white">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell className="px-6 py-3.5"><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell className="px-6 py-3.5">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-3 w-24" />
                                        <Skeleton className="h-2 w-16" />
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="px-6 py-3.5"><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                            <TableCell className="px-6 py-3.5"><Skeleton className="h-4 w-16" /></TableCell>
                            <TableCell className="px-6 py-3.5"><Skeleton className="h-8 w-full max-w-xs" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

interface PageProps {
    searchParams: Promise<{
        page?: string;
        q?: string;
        action?: string;
    }>;
}

export default function AuditLogPage(props: PageProps) {
    return (
        <div className="flex flex-col h-full space-y-4 w-full">
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
                <AuditFilters />

                <Suspense fallback={<AuditTableSkeleton />}>
                    <AuditListSection searchParams={props.searchParams} />
                </Suspense>
            </div>
        </div>
    );
}
