import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { createAuditLog } from '@/lib/services/audit-log'
import { createBorrowSlipEvent } from '@/lib/services/borrow'
import { revalidatePath } from 'next/cache'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const session = await getSession();
         if (!session) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
         }

        const borrowSlip = await db.borrowSlip.findUnique({
            where: { id },
            include: {
                lender: true,
                items: {
                    include: {
                        file: true,
                    },
                },
            },
        });

        if (!borrowSlip) {
             return NextResponse.json({ error: 'Borrow slip not found' }, { status: 404 });
        }

        return NextResponse.json(borrowSlip);
    } catch (error) {
        console.error('Error fetching borrow slip:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getSession()
        if (!session?.id) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }
        const editorId = session.id

        const data = await request.json()
        const { borrowerName, borrowerUnit, borrowerTitle, reason, dueDate, fileIds } = data

        // 1. Get current slip to compare files
        const currentSlip = await db.borrowSlip.findUnique({
            where: { id },
            include: { items: true }
        })

        if (!currentSlip) {
            return NextResponse.json({ success: false, message: 'Phiếu mượn không tồn tại' }, { status: 404 })
        }

        // Logic for file updates:
        const currentFileIds = currentSlip.items.map(item => item.fileId)
        const addedFileIds = fileIds.filter((fid: string) => !currentFileIds.includes(fid))
        const removedFileIds = currentFileIds.filter(fid => !fileIds.includes(fid))

        // Check availability of added files
        if (addedFileIds.length > 0) {
            const files = await db.file.findMany({
                where: { id: { in: addedFileIds } }
            })
            const unavailable = files.filter(f => f.status === 'BORROWED')
            if (unavailable.length > 0) {
                return NextResponse.json({ success: false, message: `Hồ sơ ${unavailable.map(f => f.code).join(', ')} đang được mượn.` })
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
                    data: addedFileIds.map((fid: string) => ({
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
                    dueDate: new Date(dueDate),
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

        const newDueDate = new Date(dueDate)
        if (currentSlip.borrowerName !== borrowerName || currentSlip.reason !== reason || currentSlip.dueDate.getTime() !== newDueDate.getTime()) {
            await createBorrowSlipEvent({
                borrowSlipId: id,
                eventType: 'UPDATE_INFO',
                description: 'Cập nhật thông tin phiếu',
                details: {
                    changes: {
                        borrowerName: currentSlip.borrowerName !== borrowerName ? { from: currentSlip.borrowerName, to: borrowerName } : undefined,
                        reason: currentSlip.reason !== reason ? { from: currentSlip.reason, to: reason } : undefined,
                        dueDate: currentSlip.dueDate.toISOString() !== newDueDate.toISOString() ? { from: currentSlip.dueDate, to: newDueDate } : undefined,
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
        return NextResponse.json({ success: true })

    } catch (error: unknown) {
        console.error('Update Borrow Slip Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 })
    }
}
