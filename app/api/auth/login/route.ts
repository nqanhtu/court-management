
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/auth-jwt';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const username = body.username as string;
        const password = body.password as string;

        if (!username || !password) {
            return NextResponse.json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' }, { status: 400 });
        }

        const user = await db.user.findUnique({
            where: { username },
        });

        if (!user || !user.status) {
            return NextResponse.json({ success: false, message: 'Tài khoản không tồn tại hoặc bị khóa' }, { status: 401 });
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return NextResponse.json({ success: false, message: 'Sai mật khẩu' }, { status: 401 });
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ success: false, message: 'Lỗi hệ thống' }, { status: 500 });
    }
}
