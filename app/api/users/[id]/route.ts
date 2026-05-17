
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { isUserRole, requirePermission } from '@/lib/rbac'
import bcrypt from 'bcryptjs'

const USER_SELECT = {
    id: true,
    username: true,
    fullName: true,
    unit: true,
    role: true,
    status: true,
    createdAt: true,
    updatedAt: true,
} as const

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const session = await getSession()
        const denied = requirePermission(session, 'manageUsers')
        if (denied) return denied

        const user = await db.user.findUnique({
            where: { id },
            select: USER_SELECT,
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json(user)
    } catch (error: any) {
        console.error('Error fetching user:', error?.message ?? error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const session = await getSession()
        const denied = requirePermission(session, 'manageUsers')
        if (denied) return denied

        const data = await request.json()

        if (data.role && !isUserRole(data.role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
        }

        // Build updateData chỉ từ field được gửi lên (partial update)
        const updateData: Record<string, unknown> = {}

        if ('fullName' in data) updateData.fullName = String(data.fullName ?? '').trim()
        if ('unit' in data) updateData.unit = data.unit ? String(data.unit).trim() : null
        if ('role' in data) updateData.role = data.role
        if ('status' in data) {
            // Normalize: nhận boolean true/false hoặc string 'active'/'inactive'
            updateData.status = data.status === true || data.status === 'active'
        }

        if (data.password && typeof data.password === 'string' && data.password.trim()) {
            updateData.password = await bcrypt.hash(data.password, 10)
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'Không có dữ liệu để cập nhật' }, { status: 400 })
        }

        const user = await db.user.update({
            where: { id },
            data: updateData,
            select: USER_SELECT,
        })

        return NextResponse.json({ success: true, user })
    } catch (error: any) {
        console.error('Error updating user:', error?.message ?? error)
        return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const session = await getSession()
        const denied = requirePermission(session, 'manageUsers')
        if (denied) return denied

        await db.user.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting user:', error?.message ?? error)
        return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 })
    }
}
