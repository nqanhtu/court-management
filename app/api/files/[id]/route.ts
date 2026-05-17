import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { requirePermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/services/audit-log'
import { revalidatePath } from 'next/cache'

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
                box: {
                    include: {
                        agency: true
                    }
                },
                borrowItems: {
                    where: { status: 'BORROWING' },
                    include: { borrowSlip: true }
                },
                documents: {
                    orderBy: { order: 'asc' }
                },
                fileIndex: true
            }
        })

        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        return NextResponse.json(file)
    } catch (error) {
        console.error('Error fetching file:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
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
            return NextResponse.json({ success: false, message: 'File not found' }, { status: 404 })
        }

        if (file.status === 'BORROWED' || file.borrowItems.some((item) => item.status === 'BORROWING')) {
            return NextResponse.json(
                { success: false, message: 'Không thể xóa hồ sơ đang được mượn.' },
                { status: 409 }
            )
        }

        if (file.borrowItems.length > 0) {
            return NextResponse.json(
                { success: false, message: 'Không thể xóa hồ sơ đã có lịch sử mượn/trả.' },
                { status: 409 }
            )
        }

        await db.file.delete({
            where: { id },
        })

        await createAuditLog({
            action: 'DELETE',
            target: 'File',
            targetId: id,
            userId: session!.id,
            detail: {
                code: file.code,
                title: file.title,
            },
        })

        revalidatePath('/')
        revalidatePath('/files')

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting file:', error)
        return NextResponse.json({ success: false, message: 'Failed to delete file' }, { status: 500 })
    }
}
