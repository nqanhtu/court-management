
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { isUserRole, requirePermission } from '@/lib/rbac'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        const purpose = request.nextUrl.searchParams.get('purpose');

        if (purpose === 'borrower') {
            const denied = requirePermission(session, 'manageBorrow');
            if (denied) return denied;

            const users = await db.user.findMany({
                where: { status: true },
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    role: true,
                    unit: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: {
                    fullName: 'asc',
                },
            });
            return NextResponse.json(users)
        }

        const denied = requirePermission(session, 'manageUsers');
        if (denied) return denied;

        const users = await db.user.findMany({
            omit: {
                password: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return NextResponse.json(users)
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        const denied = requirePermission(session, 'manageUsers');
        if (denied) return denied;

        const data = await request.json();
        if (data.role && !isUserRole(data.role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        if (!data.password || typeof data.password !== 'string') {
            return NextResponse.json({ error: 'Password is required' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = await db.user.create({
            data: {
                username: String(data.username ?? '').trim(),
                fullName: String(data.fullName ?? '').trim(),
                unit: data.unit ? String(data.unit).trim() : null,
                role: data.role,
                status: data.status === true || data.status === 'active',
                password: hashedPassword,
            },
        });
        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
