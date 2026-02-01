import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/services/audit-log'
import { getSession } from '@/lib/session'
import { createBorrowSlipEvent } from '@/lib/services/borrow'
import { revalidatePath } from 'next/cache'

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
        const session = await getSession();
        if (!session?.id) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const lenderId = session.id;

        const data = await request.json()
        const { borrowerName, borrowerUnit, borrowerTitle, reason, dueDate, fileIds } = data

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
            // 1. Atomic Check & Lock
            const updatedBatch = await tx.file.updateMany({
                where: {
                    id: { in: fileIds },
                    status: 'IN_STOCK'
                },
                data: { status: 'BORROWED' }
            })

            if (updatedBatch.count !== fileIds.length) {
                throw new Error("Một hoặc nhiều hồ sơ đã được mượn bởi người khác hoặc không tồn tại.");
            }

            // 2. Create Slip
            const newSlip = await tx.borrowSlip.create({
                data: {
                    code: slipCode,
                    borrowerName,
                    borrowerUnit,
                    borrowerTitle,
                    reason,
                    dueDate: new Date(dueDate),
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

            return newSlip
        })

        await createBorrowSlipEvent({
            borrowSlipId: slip.id,
            eventType: 'CREATED',
            description: 'Tạo phiếu mượn mới',
            details: { code: slip.code, files: fileIds }
        })

        await createAuditLog({
            action: 'CREATE',
            target: 'BorrowSlip',
            targetId: slip.id,
            detail: { code: slip.code, files: fileIds },
            userId: lenderId
        })

        revalidatePath('/')
        revalidatePath('/files')
        return NextResponse.json({ success: true, slipId: slip.id })

    } catch (error: unknown) {
        console.error('Create Borrow Slip Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.id) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.id;

        const data = await request.json();
        const { id } = data; // borrowSlipId

        await db.$transaction(async (tx) => {
            const borrowSlip = await tx.borrowSlip.findUnique({
                where: { id },
                include: { items: true }
            })

            if (!borrowSlip) {
                throw new Error("Phiếu mượn không tồn tại.")
            }

            if (borrowSlip.status === 'RETURNED') {
                throw new Error("Phiếu mượn đã được trả.")
            }

            const fileIds = borrowSlip.items.map(item => item.fileId)

            await tx.borrowSlip.update({
                where: { id },
                data: { status: 'RETURNED' }
            })

            await tx.borrowItem.updateMany({
                where: { borrowSlipId: id },
                data: { status: 'RETURNED' }
            })

            await tx.file.updateMany({
                where: { id: { in: fileIds } },
                data: { status: 'IN_STOCK' }
            })
        })

        await createAuditLog({
            action: 'UPDATE',
            target: 'BorrowSlip',
            targetId: id,
            detail: { status: 'RETURNED' },
            userId: userId
        })

        return NextResponse.json({ success: true })

    } catch (error: unknown) {
        console.error('Return Borrow Slip Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 })
    }
}
