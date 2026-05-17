import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'

import { apiError, apiSuccess } from '@/lib/api-response'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/services/audit-log'
import { createBorrowSlipEvent } from '@/lib/services/borrow'
import { getSession } from '@/lib/session'
import { borrowReturnSchema } from '@/lib/validation/borrow'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    const denied = requirePermission(session, 'manageBorrow')
    if (denied) return denied

    const parsed = borrowReturnSchema.safeParse(await request.json())
    if (!parsed.success) {
      return apiError('Dữ liệu trả hồ sơ không hợp lệ', 400, parsed.error.flatten())
    }

    const returnedDate = parsed.data.returnedDate ?? new Date()

    const result = await db.$transaction(async (tx) => {
      const slip = await tx.borrowSlip.findUnique({
        where: { id },
        include: { items: { include: { file: true } } },
      })

      if (!slip) throw new Error('Phiếu mượn không tồn tại')
      if (slip.status === 'RETURNED') throw new Error('Phiếu mượn đã được trả toàn bộ')

      const borrowingItems = slip.items.filter((item) => item.status === 'BORROWING')
      const requestedItemIds = parsed.data.itemIds?.length
        ? new Set(parsed.data.itemIds)
        : new Set(borrowingItems.map((item) => item.id))
      const returningItems = borrowingItems.filter((item) => requestedItemIds.has(item.id))

      if (returningItems.length === 0) throw new Error('Không có hồ sơ nào cần trả')

      await tx.borrowItem.updateMany({
        where: { id: { in: returningItems.map((item) => item.id) } },
        data: {
          status: 'RETURNED',
          returnedDate,
          condition: parsed.data.condition,
        },
      })

      await tx.file.updateMany({
        where: { id: { in: returningItems.map((item) => item.fileId) } },
        data: { status: 'IN_STOCK' },
      })

      const remainingBorrowing = borrowingItems.length - returningItems.length
      const nextStatus = remainingBorrowing > 0 ? 'PARTIAL_RETURN' : 'RETURNED'

      await tx.borrowSlip.update({
        where: { id },
        data: {
          status: nextStatus,
          returnedDate: nextStatus === 'RETURNED' ? returnedDate : null,
        },
      })

      return {
        nextStatus,
        returnedCodes: returningItems.map((item) => item.file.code),
      }
    })

    await createBorrowSlipEvent({
      borrowSlipId: id,
      eventType: result.nextStatus === 'RETURNED' ? 'RETURNED_ALL' : 'RETURNED_PARTIAL',
      description: `Trả ${result.returnedCodes.length} hồ sơ`,
      details: {
        files: result.returnedCodes,
        condition: parsed.data.condition,
        note: parsed.data.note,
        returnedDate,
      },
    })

    await createAuditLog({
      action: 'UPDATE',
      target: 'BorrowSlip',
      targetId: id,
      userId: session!.id,
      detail: {
        status: result.nextStatus,
        returnedFiles: result.returnedCodes,
      },
    })

    revalidatePath('/')
    revalidatePath('/borrow')

    return apiSuccess(result, 'Đã cập nhật trả hồ sơ')
  } catch (error) {
    console.error('Return borrow slip error:', error)
    const message = error instanceof Error ? error.message : 'Không thể trả hồ sơ'
    return apiError(message, 500)
  }
}
