import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/services/audit-log'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const borrowSlips = await db.borrowSlip.findMany({
            include: {
                lender: true,
                items: {
                    include: {
                        file: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return NextResponse.json(borrowSlips)
    } catch (error) {
        console.error('Error fetching borrow slips:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json()
        const { borrowerName, borrowerUnit, borrowerTitle, reason, dueDate, fileIds, lenderId } = data

        // 1. Validate files availability
        const files = await db.file.findMany({
            where: { id: { in: fileIds } }
        })

        const unavailable = files.filter(f => f.status === 'BORROWED')
        if (unavailable.length > 0) {
            return NextResponse.json({ success: false, message: `Hồ sơ ${unavailable.map(f => f.code).join(', ')} đang được mượn.` })
        }

        // 2. Create Slip
        const slipCode = `PM-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`

        // Transaction
        const slip = await db.$transaction(async (tx) => {
            const newSlip = await tx.borrowSlip.create({
                data: {
                    code: slipCode,
                    borrowerName,
                    borrowerUnit,
                    borrowerTitle,
                    reason,
                    dueDate: new Date(dueDate), // Ensure date is Date object
                    lenderId,
                    status: 'BORROWING',
                    items: {
                        create: fileIds.map((fid: string) => ({
                            fileId: fid,
                            status: 'BORROWING'
                        }))
                    }
                }
            })

            // Update File Status
            await tx.file.updateMany({
                where: { id: { in: fileIds } },
                data: { status: 'BORROWED' }
            })

            return newSlip
        })

        await createAuditLog({
            action: 'CREATE',
            target: 'BorrowSlip',
            targetId: slip.id,
            detail: { code: slip.code, files: fileIds },
            userId: lenderId
        })

        return NextResponse.json({ success: true, slipId: slip.id })

    } catch (error) {
        console.error('Create Borrow Slip Error:', error)
        return NextResponse.json({ success: false, message: 'Failed to create borrow slip' }, { status: 500 })
    }
}
