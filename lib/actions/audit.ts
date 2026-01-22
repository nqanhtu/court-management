'use server';

import { db } from '@/lib/db';
import { getSession } from './auth';
import type { User } from '@/lib/types/user';

export async function getAuditLogs(page: number = 1, limit: number = 20) {
    const session = await getSession();
    if (!session || (session as User).role !== 'SUPER_ADMIN') {
        throw new Error('Unauthorized');
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
        db.auditLog.findMany({
            include: {
                user: {
                    select: {
                        username: true,
                        fullName: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip,
            take: limit
        }),
        db.auditLog.count()
    ]);

    return {
        logs,
        total,
        totalPages: Math.ceil(total / limit)
    };
}
