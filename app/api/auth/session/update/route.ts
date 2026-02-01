
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { encrypt, decrypt } from '@/lib/auth-jwt';

// Based on updateSession in lib/actions/auth.ts
// Note: Middleware often handles this, but since it was in actions, we migrate it here.
// However, updateSession in actions was returning a response object to be middleware-compatible or similar.
// Looking at the original code: 
// export async function updateSession(request: NextRequest) {
//     const session = request.cookies.get('session')?.value;
//     ...
//     const res = NextResponse.next();
//     res.cookies.set(...)
//     return res;
// }
// This looks like it was intended for Middleware Usage. 
// If it was used in middleware.ts, we should NOT move it to app/api but keep it in a lib.
// But the user asked to migrate `lib/actions` to `app/api`. 
// Let's implement it as a route that refreshes the cookie.

export async function POST(request: NextRequest) {
    const session = (await cookies()).get('session')?.value;
    if (!session) {
        return NextResponse.json({ success: false, message: 'No session' }, { status: 401 });
    }

    try {
        const parsed = await decrypt(session) as Record<string, unknown> & { expires?: Date };
        parsed.expires = new Date(Date.now() + 8 * 60 * 60 * 1000);
        
        const newSession = await encrypt(parsed);
        
        (await cookies()).set('session', newSession, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            expires: parsed.expires,
            path: '/',
            sameSite: 'lax',
        });

        return NextResponse.json({ success: true, expires: parsed.expires });
    } catch {
        return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });
    }
}
