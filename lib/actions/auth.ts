'use server';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { encrypt, decrypt } from '@/lib/auth-jwt';

export async function login(formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username || !password) {
        return { success: false, message: 'Vui lòng nhập đầy đủ thông tin' };
    }

    const user = await db.user.findUnique({
        where: { username },
    });

    if (!user || !user.status) {
        return { success: false, message: 'Tài khoản không tồn tại hoặc bị khóa' };
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
        return { success: false, message: 'Sai mật khẩu' };
    }

    // Create session
    const session = await encrypt({
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
    });

    // Set cookie
    (await cookies()).set('session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
        path: '/',
        sameSite: 'lax',
    });

    return { success: true };
}

export async function logout() {
    (await cookies()).delete('session');
}

export interface SessionPayload {
    id: string;
    username: string;
    role: string;
    fullName: string;
    [key: string]: unknown;
}

export async function getSession(): Promise<SessionPayload | null> {
    const session = (await cookies()).get('session')?.value;
    if (!session) return null;
    try {
        return await decrypt(session) as SessionPayload;
    } catch {
        return null;
    }
}

export async function updateSession(request: NextRequest) {
    const session = request.cookies.get('session')?.value;
    if (!session) return;

    // Refresh session if needed, for now just returning
    const parsed = await decrypt(session) as Record<string, unknown> & { expires?: Date };
    parsed.expires = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const res = NextResponse.next();
    res.cookies.set({
        name: 'session',
        value: await encrypt(parsed),
        httpOnly: true,
        expires: parsed.expires,
    });
    return res;
}
