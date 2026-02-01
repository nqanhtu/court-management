'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/actions/auth'
import { revalidatePath } from 'next/cache'
import type { User } from '@/lib/types/user'

function generateBorrowCode() {
  const date = new Date()
  const year = date.getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `PM-${year}-${random}`
}

export async function createBorrowSlip(data: {
  borrowerName: string
  borrowerUnit: string
  borrowerTitle: string
  reason: string
  dueDate: Date
  fileIds: string[]
}) {
  try {
    const session = await getSession() as User | null
    if (!session) {
      return { success: false, message: 'Unauthorized' }
    }

    const code = generateBorrowCode()

    await db.$transaction(async (tx) => {
      // 1. Create Borrow Slip
      const borrowSlip = await tx.borrowSlip.create({
        data: {
            code,
            borrowerName: data.borrowerName,
            borrowerUnit: data.borrowerUnit,
            borrowerTitle: data.borrowerTitle,
            reason: data.reason,
            dueDate: data.dueDate,
            lenderId: session.id,
            status: 'BORROWING',
            items: {
                create: data.fileIds.map((fileId) => ({
                    fileId,
                    status: 'BORROWING'
                }))
            }
        }
      })

      // 2. Update File Status
      await tx.file.updateMany({
        where: { id: { in: data.fileIds } },
        data: { status: 'BORROWED' }
      })

      // 3. Create Event
      await tx.borrowSlipEvent.create({
        data: {
            borrowSlipId: borrowSlip.id,
            eventType: 'CREATED',
            description: `Tạo phiếu mượn ${code}`,
            creatorId: session.id,
            details: { fileIds: data.fileIds }
        }
      })
    })

    revalidatePath('/borrow')
    revalidatePath('/files')
    return { success: true, message: 'Created successfully' }
  } catch (error) {
    console.error('Error creating borrow slip:', error)
    return { success: false, message: 'Failed to create borrow slip' }
  }
}
