import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma, AuditAction } from '@/app/generated/prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q') || undefined
    const action = searchParams.get('action') || undefined
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Prisma.AuditLogWhereInput = {
        AND: [
            q ? {
                OR: [
                    { detail: { path: ['code'], string_contains: q } },
                ]
            } : {},
            action ? { action: { equals: action as AuditAction } } : {},
        ]
    }

    try {
        const [logs, total] = await Promise.all([
            db.auditLog.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' },
                include: { user: true }
            }),
            db.auditLog.count({ where })
        ])
        return NextResponse.json({ logs, total })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
    }
}
