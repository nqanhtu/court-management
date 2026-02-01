'use server'

import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/services/audit-log'
import { revalidatePath } from 'next/cache'
import { getSession } from '../session'

interface CreateSlipParams {
    borrowerName: string
    borrowerUnit: string
    borrowerTitle: string
    reason: string
    dueDate: Date
    fileIds: string[]
}

export async function createBorrowSlip(params: CreateSlipParams) {
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
        return { success: true, slipId: slip.id }

    } catch (error: unknown) {
        console.error('Create Borrow Slip Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, message: errorMessage }
    }
}

interface CreateEventParams {
    borrowSlipId: string
    eventType: string
    description?: string
    details?: any
}

export async function createBorrowSlipEvent({ borrowSlipId, eventType, description, details }: CreateEventParams) {
    try {
        const session = await getSession()
        const creatorId = session?.id

        await db.borrowSlipEvent.create({
            data: {
                borrowSlipId,
                eventType,
                description,
                details: details ? JSON.stringify(details) : undefined,
                creatorId
            }
        })
        return { success: true }
    } catch (error) {
        console.error('Create Event Error:', error)
        return { success: false }
    }
}

interface UpdateSlipParams {
    id: string
    borrowerName: string
    borrowerUnit: string
    borrowerTitle: string
    reason: string
    dueDate: Date
    fileIds: string[]
}

export async function updateBorrowSlip(params: UpdateSlipParams) {
    try {
        const session = await getSession()
        if (!session?.id) {
            return { success: false, message: 'Unauthorized' }
        }
        const editorId = session.id

        const { id, borrowerName, borrowerUnit, borrowerTitle, reason, dueDate, fileIds } = params

        // 1. Get current slip to compare files
        const currentSlip = await db.borrowSlip.findUnique({
            where: { id },
            include: { items: true }
        })

        if (!currentSlip) {
            return { success: false, message: 'Phiếu mượn không tồn tại' }
        }

        // Logic for file updates:
        const currentFileIds = currentSlip.items.map(item => item.fileId)
        const addedFileIds = fileIds.filter(fid => !currentFileIds.includes(fid))
        const removedFileIds = currentFileIds.filter(fid => !fileIds.includes(fid))

        // Check availability of added files
        if (addedFileIds.length > 0) {
            const files = await db.file.findMany({
                where: { id: { in: addedFileIds } }
            })
            const unavailable = files.filter(f => f.status === 'BORROWED')
            if (unavailable.length > 0) {
                return { success: false, message: `Hồ sơ ${unavailable.map(f => f.code).join(', ')} đang được mượn.` }
            }
        }

        await db.$transaction(async (tx) => {
            // 1. Handle Added Files
            if (addedFileIds.length > 0) {
                await tx.file.updateMany({
                    where: { id: { in: addedFileIds }, status: 'IN_STOCK' },
                    data: { status: 'BORROWED' }
                })
                await tx.borrowItem.createMany({
                    data: addedFileIds.map(fid => ({
                        borrowSlipId: id,
                        fileId: fid,
                        status: 'BORROWING'
                    }))
                })
            }

            // 2. Handle Removed Files
            if (removedFileIds.length > 0) {
                await tx.file.updateMany({
                    where: { id: { in: removedFileIds } },
                    data: { status: 'IN_STOCK' }
                })
                await tx.borrowItem.deleteMany({
                    where: {
                        borrowSlipId: id,
                        fileId: { in: removedFileIds }
                    }
                })
            }

            // 3. Update Slip Metadata
            await tx.borrowSlip.update({
                where: { id },
                data: {
                    borrowerName,
                    borrowerUnit,
                    borrowerTitle,
                    reason,
                    dueDate,
                }
            })
        })

        // Create Events
        if (addedFileIds.length > 0) {
            const addedFiles = await db.file.findMany({ where: { id: { in: addedFileIds } }, select: { code: true } });
            await createBorrowSlipEvent({
                borrowSlipId: id,
                eventType: 'ADD_FILE',
                description: `Thêm ${addedFileIds.length} hồ sơ`,
                details: { files: addedFiles.map(f => f.code) }
            })
        }

        if (removedFileIds.length > 0) {
            const removedFiles = await db.file.findMany({ where: { id: { in: removedFileIds } }, select: { code: true } });
            await createBorrowSlipEvent({
                borrowSlipId: id,
                eventType: 'REMOVE_FILE',
                description: `Đã trả/xóa ${removedFileIds.length} hồ sơ`,
                details: { files: removedFiles.map(f => f.code) }
            })
        }

        if (currentSlip.borrowerName !== borrowerName || currentSlip.reason !== reason || currentSlip.dueDate.getTime() !== dueDate.getTime()) {
            await createBorrowSlipEvent({
                borrowSlipId: id,
                eventType: 'UPDATE_INFO',
                description: 'Cập nhật thông tin phiếu',
                details: {
                    changes: {
                        borrowerName: currentSlip.borrowerName !== borrowerName ? { from: currentSlip.borrowerName, to: borrowerName } : undefined,
                        reason: currentSlip.reason !== reason ? { from: currentSlip.reason, to: reason } : undefined,
                        dueDate: currentSlip.dueDate.toISOString() !== dueDate.toISOString() ? { from: currentSlip.dueDate, to: dueDate } : undefined,
                    }
                }
            })
        }

        await createAuditLog({
            action: 'UPDATE',
            target: 'BorrowSlip',
            targetId: id,
            detail: {
                changes: {
                    borrowerName: currentSlip.borrowerName !== borrowerName ? { from: currentSlip.borrowerName, to: borrowerName } : undefined,
                    reason: currentSlip.reason !== reason ? { from: currentSlip.reason, to: reason } : undefined,
                }
            },
            userId: editorId
        })

        revalidatePath('/')
        revalidatePath('/borrow')
        return { success: true }

    } catch (error: unknown) {
        console.error('Update Borrow Slip Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, message: errorMessage }
    }
}

export async function getBorrowSlipHistory(slipId: string) {
    try {
        const events = await db.borrowSlipEvent.findMany({
            where: {
                borrowSlipId: slipId
            },
            include: {
                creator: {
                    select: { fullName: true, username: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return events;
    } catch (error) {
        console.error('Get History Error:', error);
        return [];
    }
}
