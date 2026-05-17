
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { isUserRole, requirePermission } from '@/lib/rbac'
import bcrypt from 'bcryptjs'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const session = await getSession();
        const denied = requirePermission(session, 'manageUsers');
        if (denied) return denied;

        const user = await db.user.findUnique({
            where: { id },
            omit: {
                password: true,
            },
        });
        
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const session = await getSession();
        const denied = requirePermission(session, 'manageUsers');
        if (denied) return denied;

        const data = await request.json();
        if (data.role && !isUserRole(data.role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        delete data.id;
        delete data.createdAt;
        delete data.updatedAt;

        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        } else {
            delete data.password;
        }

        const user = await db.user.update({
            where: { id },
            data,
        });
        return NextResponse.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const session = await getSession();
        const denied = requirePermission(session, 'manageUsers');
        if (denied) return denied;

        const user = await db.user.delete({
            where: { id },
        });
        return NextResponse.json(user);
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
