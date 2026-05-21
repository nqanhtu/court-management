'use client';

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { History, Loader2, ShieldCheck } from 'lucide-react';
import { AuditList } from '@/components/audit/audit-list';
import { AccessLogList } from '@/components/audit/access-log-list';
import { useSession } from "@/lib/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuditLogPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { session, isLoading } = useSession();
    const currentTab = searchParams.get("tab") === "access" ? "access" : "audit";

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

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value === "access") params.set("tab", "access");
        else params.delete("tab");
        params.set("page", "1");
        router.replace(`?${params.toString()}`);
    };

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

            <Tabs value={currentTab} onValueChange={handleTabChange} className="min-h-0 flex-1">
                <TabsList>
                    <TabsTrigger value="audit">
                        <History className="h-4 w-4" />
                        Nhật ký thao tác
                    </TabsTrigger>
                    <TabsTrigger value="access">
                        <ShieldCheck className="h-4 w-4" />
                        Lịch sử truy cập
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="audit" className="min-h-0">
                    <AuditList />
                </TabsContent>
                <TabsContent value="access" className="min-h-0">
                    <AccessLogList />
                </TabsContent>
            </Tabs>
        </div>
    );
}
