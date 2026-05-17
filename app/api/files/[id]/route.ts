import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { requirePermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/services/audit-log'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const session = await getSession()
    const denied = requirePermission(session, 'viewFiles')
    if (denied) return denied

    const file = await db.file.findUnique({
      where: { id },
      include: {
        box: { include: { agency: true } },
        borrowItems: {
          where: { status: 'BORROWING' },
          include: { borrowSlip: true },
        },
        documents: { orderBy: { order: 'asc' } },
        fileIndex: true,
      },
    })

    if (!file) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy hồ sơ' }, { status: 404 })
    }

    return NextResponse.json(file)
  } catch (error) {
    console.error('Error fetching file:', error)
    return NextResponse.json({ success: false, message: 'Lỗi máy chủ' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const session = await getSession()
    const denied = requirePermission(session, 'manageFiles')
    if (denied) return denied

    const file = await db.file.findUnique({
      where: { id },
      include: {
        borrowItems: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    if (!file) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy hồ sơ' }, { status: 404 })
    }

    if (file.status === 'BORROWED' || file.borrowItems.some((item) => item.status === 'BORROWING')) {
      return NextResponse.json(
        { success: false, message: 'Không thể lưu trữ hồ sơ đang được mượn.' },
        { status: 409 }
      )
    }

    await db.file.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        isLocked: true,
      },
    })

    await createAuditLog({
      action: 'UPDATE',
      target: 'File',
      targetId: id,
      userId: session!.id,
      detail: {
        code: file.code,
        title: file.title,
        status: 'ARCHIVED',
        action: 'SOFT_DELETE',
      },
    })

    revalidatePath('/')
    revalidatePath('/files')

    return NextResponse.json({ success: true, message: 'Đã lưu trữ hồ sơ' })
  } catch (error) {
    console.error('Error archiving file:', error)
    return NextResponse.json({ success: false, message: 'Không thể lưu trữ hồ sơ' }, { status: 500 })
  }
}
