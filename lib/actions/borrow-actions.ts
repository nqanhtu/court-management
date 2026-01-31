'use server'

import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/services/audit-log'
import { revalidatePath } from 'next/cache'

import { getSession } from '@/lib/actions/auth'

interface CreateSlipParams {
    borrowerName: string
    borrowerUnit: string
    borrowerTitle: string
    reason: string
    dueDate: Date
    fileIds: string[]
}

export async function createBorrowSlip(params: CreateSlipParams) {
    console.log('Creating borrow slip:', params)    
    try {
        const session = await getSession()
        if (!session?.id) {
            return { success: false, message: 'Unauthorized' }
        }
        const lenderId = session.id

        const { borrowerName, borrowerUnit, borrowerTitle, reason, dueDate, fileIds } = params

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
            // 1. Atomic Check & Lock: Try to update status to BORROWED for available files
            // This prevents race conditions where someone else borrows the file between read and write
            const updatedBatch = await tx.file.updateMany({
                where: { 
                    id: { in: fileIds },
                    status: 'IN_STOCK' // Critical: Only update if still available
                },
                data: { status: 'BORROWED' }
            })

            if (updatedBatch.count !== fileIds.length) {
                // Determine which files failed (optional, for better error message)
                // Since updateMany doesn't return IDs, we re-query to find the culprits if needed
                // or just throw a generic error.
                // For better UX, let's find out which ones are unavailable.
                // Note: The logic above is tricky because we just updated them. 
                // Simplest robust way: 
                // If count mismatch, it means some were NOT 'IN_STOCK' at the moment of update.
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
