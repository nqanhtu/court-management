'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { History, Loader2 } from 'lucide-react';
import { AuditList } from '@/components/audit/audit-list';
import { useSession } from "@/lib/hooks/use-auth";

export default function AuditLogPage() {
    const router = useRouter();
    const { session, isLoading } = useSession();

    useEffect(() => {
        document.title = "Nhật ký hệ thống | Court Management";
    }, []);

    useEffect(() => {
        if (!isLoading && (!session || session.role !== "SUPER_ADMIN")) {
            router.replace("/forbidden");
        }
    }, [session, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!session || session.role !== "SUPER_ADMIN") {
        return null;
    }

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

            <AuditList />
        </div>
    );
}
