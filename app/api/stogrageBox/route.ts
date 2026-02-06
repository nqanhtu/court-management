import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseExcelFile } from '@/lib/excel-parser'
import { createAuditLog } from '@/lib/services/audit-log'
import { getAgencyForYear } from '@/lib/services/agency-history'
import { getSession } from '@/lib/session'
import type { Prisma, StorageBox } from '@/generated/prisma/client'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const yearParam = searchParams.get('year')
        const year = yearParam ? Number(yearParam) : null

        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const where: Prisma.StorageBoxWhereInput = {}

        if (year) {
            const date = new Date(year, 0, 1)
            where.agency = {
                startDate: { lte: date },
                OR: [
                    { endDate: { gte: date } },
                    { endDate: null },
                ],
            }
        }

        const storageBoxes = await db.storageBox.findMany({ where })

        return NextResponse.json(storageBoxes)
    } catch (error) {
        console.error('Error fetching storage boxes:', error)
        return NextResponse.json(
            { error: 'Failed to fetch storage boxes' },
            { status: 500 }
        )
    }
}
