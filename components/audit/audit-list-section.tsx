import { AuditList } from '@/components/audit/audit-list';

interface AuditListSectionProps {
    searchParams: Promise<{
        page?: string;
        q?: string;
        action?: string;
    }>;
}

export async function AuditListSection({ searchParams }: AuditListSectionProps) {
    const params = await searchParams;
    return <AuditList searchParams={params} />;
}
