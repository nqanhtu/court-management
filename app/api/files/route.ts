import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@/generated/prisma/client'
import { createAuditLog } from '@/lib/services/audit-log'
import { getSession } from '@/lib/session'
import { requirePermission } from '@/lib/rbac'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const session = await getSession()
    const denied = requirePermission(session, 'viewFiles')
    if (denied) return denied

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || undefined
    const type = searchParams.get('type') || undefined
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
    const status = searchParams.get('status') || undefined
    const judgmentNumber = searchParams.get('judgmentNumber') || undefined
    const party = searchParams.get('party') || undefined
    const warehouse = searchParams.get('warehouse') || undefined
    const line = searchParams.get('line') || undefined
    const shelf = searchParams.get('shelf') || undefined
    const slot = searchParams.get('slot') || undefined
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Prisma.FileWhereInput = {
        AND: [
            query ? {
                OR: [
                    { code: { contains: query, mode: 'insensitive' } },
                    { title: { contains: query, mode: 'insensitive' } },
                    { judgmentNumber: { contains: query, mode: 'insensitive' } },
                    { indexCode: { contains: query, mode: 'insensitive' } },
                    { defendants: { has: query } },
                    { plaintiffs: { has: query } },
                    { civilDefendants: { has: query } },
                ]
            } : {},
            type && type !== 'all' ? { type: { equals: type } } : {},
            year ? { year: { equals: year } } : {},
            status && status !== 'all' ? { status: { equals: status } } : { NOT: { status: 'ARCHIVED' } },
            judgmentNumber ? { judgmentNumber: { contains: judgmentNumber, mode: 'insensitive' } } : {},
            party ? {
                OR: [
                    { defendants: { has: party } },
                    { plaintiffs: { has: party } },
                    { civilDefendants: { has: party } },
                ]
            } : {},
            warehouse || line || shelf || slot ? {
                box: {
                    is: {
                        ...(warehouse ? { warehouse: { contains: warehouse, mode: 'insensitive' as const } } : {}),
                        ...(line ? { line: { contains: line, mode: 'insensitive' as const } } : {}),
                        ...(shelf ? { shelf: { contains: shelf, mode: 'insensitive' as const } } : {}),
                        ...(slot ? { slot: { contains: slot, mode: 'insensitive' as const } } : {}),
                    }
                }
            } : {},
        ]
    }

    try {
        const [files, total] = await Promise.all([
            db.file.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' },
                include: {
                    box: true,
                }
            }),
            db.file.count({ where })
        ])

        return NextResponse.json({ files, total })
    } catch (error) {
        console.error('Error searching files:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        const denied = requirePermission(session, 'manageFiles')
        if (denied) return denied

        const data = await request.json()
        // TODO: Validate data with zod if possible, for now trusting inputs or basic checks

        const file = await db.file.create({
            data: {
                ...data,
                isLocked: false,
                status: 'IN_STOCK'
            }
        })

        await createAuditLog({
            action: 'CREATE',
            target: 'File',
            targetId: file.id,
            userId: session?.id,
            detail: {
                title: file.title,
                code: file.code
            }
        })

        return NextResponse.json({ success: true, file })
    } catch (error) {
        console.error('Error creating file:', error)
        return NextResponse.json({ success: false, error: 'Failed to create file' }, { status: 500 })
    }
}
