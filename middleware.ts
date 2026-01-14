import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth-jwt';
import type { User } from '@/lib/types/user';

export async function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get('session');
    let user = null;

    if (sessionCookie) {
        try {
            user = await decrypt(sessionCookie.value);
        } catch {
            // Invalid session
        }
    }

    const { pathname } = request.nextUrl;

    // 1. Auth Page Redirect
    // If logged in and trying to go to login, redirect to home
    if (pathname === '/login') {
        if (user) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }

    // 2. Protected Routes
    // Allow public access to public resources (if any)
    // For now, assume everything except login needs auth?
    // Or specific routes: /, /files/*, /upload, /reports, /users
    // Let's secure everything by default, then exclude login.

    if (!user && pathname !== '/login') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 3. RBAC
    if (user) {
        // Upload: Only ADMIN and UPLOAD roles
        if (pathname.startsWith('/upload')) {
            if ((user as User).role !== 'ADMIN' && (user as User).role !== 'UPLOAD') {
                return NextResponse.redirect(new URL('/', request.url)); // Or 403 page
            }
        }

        // Users/Admin Management: Only ADMIN
        if (pathname.startsWith('/users')) {
            if ((user as User).role !== 'ADMIN') {
                return NextResponse.redirect(new URL('/', request.url));
            }
        }

        // Reports: All logged in users can see? Or restricted?
        // Requirement says "Tra cứu cơ bản" only sees status.
        // Reports page has stats. Let's allow everyone for now but UI hides sensitive data.
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
