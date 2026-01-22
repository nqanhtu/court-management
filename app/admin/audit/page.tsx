'use client'

import { History } from 'lucide-react';
import { AuditFilters } from '@/components/audit/audit-filters';
import { AuditList } from '@/components/audit/audit-list';

export default function AuditLogPage() {
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
                <AuditList />
            </div>
        </div>
    );
}
