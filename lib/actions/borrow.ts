'use server'

import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/services/audit-log'
import { revalidatePath } from 'next/cache'

interface CreateSlipParams {
    borrowerName: string
    borrowerUnit: string
    borrowerTitle: string
    reason: string
    dueDate: Date
    fileIds: string[]
    lenderId: string // The logged in user
}

export async function createBorrowSlip(params: CreateSlipParams) {
    try {
        const { borrowerName, borrowerUnit, borrowerTitle, reason, dueDate, fileIds, lenderId } = params

        // 1. Validate files availability
        const files = await db.file.findMany({
            where: { id: { in: fileIds } }
        })

        const unavailable = files.filter(f => f.status === 'BORROWED')
        if (unavailable.length > 0) {
            return { success: false, message: `Hồ sơ ${unavailable.map(f => f.code).join(', ')} đang được mượn.` }
        }

        // 2. Create Slip
        const slipCode = `PM-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`
        // In real app, use atomic counter or better generation

        // Transaction
        const slip = await db.$transaction(async (tx) => {
            const newSlip = await tx.borrowSlip.create({
                data: {
                    code: slipCode,
                    borrowerName,
                    borrowerUnit,
                    borrowerTitle,
                    reason,
                    dueDate,
                    lenderId,
                    status: 'BORROWING',
                    items: {
                        create: fileIds.map(fid => ({
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

        revalidatePath('/')
        revalidatePath('/files')
        return { success: true, slipId: slip.id }

    } catch (error: unknown) {
        console.error('Create Borrow Slip Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, message: errorMessage }
    }
}
