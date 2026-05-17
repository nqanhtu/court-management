import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { createAuditLog } from '@/lib/services/audit-log'

export const dynamic = 'force-dynamic'

/**
 * POST /api/reset
 * Chỉ dành cho SUPER_ADMIN.
 * Xóa toàn bộ: hồ sơ con (Document), FileIndex, BorrowSlipEvent,
 * BorrowItem, BorrowSlip và File.
 * StorageBox, User, AgencyHistory KHÔNG bị xóa.
 *
 * Body: { confirm: "RESET" }  — bắt buộc để tránh xóa nhầm.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getSession()

        if (!session) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
        }
        if (session.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Chỉ SUPER_ADMIN mới có quyền thực hiện thao tác này' }, { status: 403 })
        }

        const body = await request.json().catch(() => ({}))
        if (body?.confirm !== 'RESET') {
            return NextResponse.json(
                { error: 'Thiếu xác nhận. Gửi body { "confirm": "RESET" } để tiếp tục.' },
                { status: 400 }
            )
        }

        // Xóa theo thứ tự tránh vi phạm foreign key
        // BorrowSlipEvent và BorrowItem có onDelete: Cascade từ BorrowSlip
        // Document và FileIndex có onDelete: Cascade từ File
        // Nhưng BorrowItem còn FK -> File (không Cascade) nên phải xóa BorrowItem trước File

        const [
            deletedEvents,
            deletedItems,
            deletedSlips,
            deletedDocs,
            deletedIndexes,
            deletedFiles,
        ] = await db.$transaction([
            db.borrowSlipEvent.deleteMany({}),
            db.borrowItem.deleteMany({}),
            db.borrowSlip.deleteMany({}),
            db.document.deleteMany({}),
            db.fileIndex.deleteMany({}),
            db.file.deleteMany({}),
        ])

        // Reset status của hồ sơ — không cần vì đã xóa rồi
        // Ghi audit log
        await createAuditLog({
            action: 'DELETE',
            target: 'System',
            targetId: 'reset',
            userId: session.id,
            detail: {
                action: 'FULL_RESET',
                deletedCounts: {
                    files: deletedFiles.count,
                    documents: deletedDocs.count,
                    fileIndexes: deletedIndexes.count,
                    borrowSlips: deletedSlips.count,
                    borrowItems: deletedItems.count,
                    borrowSlipEvents: deletedEvents.count,
                },
            },
        })

        return NextResponse.json({
            success: true,
            message: 'Đã xóa toàn bộ dữ liệu hồ sơ và phiếu mượn.',
            deletedCounts: {
                files: deletedFiles.count,
                documents: deletedDocs.count,
                fileIndexes: deletedIndexes.count,
                borrowSlips: deletedSlips.count,
                borrowItems: deletedItems.count,
                borrowSlipEvents: deletedEvents.count,
            },
        })
    } catch (error: any) {
        console.error('Reset error:', error?.message ?? error)
        return NextResponse.json(
            { error: error?.message || 'Lỗi hệ thống khi reset dữ liệu' },
            { status: 500 }
        )
    }
}
