import { db } from '@/lib/db'
import { headers } from 'next/headers'

import { AuditAction } from '@/app/generated/prisma/enums'

interface CreateAuditLogParams {
    action: AuditAction
    target: string
    targetId?: string
    detail?: unknown
    userId?: string
}

export const createAuditLog = async ({
    action,
    target,
    targetId,
    detail,
    userId,
}: CreateAuditLogParams) => {
    try {
        const headersList = await headers()
        const ip = headersList.get('x-forwarded-for') || 'unknown'

        await db.auditLog.create({
            data: {
                action,
                target,
                targetId,
                detail: detail ? JSON.stringify(detail) : undefined,
                ipAddress: ip,
                userId,
            },
        })
    } catch (error) {
        console.error('Failed to create audit log:', error)
        // Don't throw error to avoid blocking main action
    }
}
