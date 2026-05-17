import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth-jwt';
import { can } from '@/lib/rbac';

export async function proxy(request: NextRequest) {
    console.log('Middleware (proxy.ts) is executing for:', request.nextUrl.pathname);
    const sessionCookie = request.cookies.get('session');
    let user: { role?: string } | null = null;

    if (sessionCookie) {
        try {
            user = (await decrypt(sessionCookie.value)) as { role?: string };
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
        // Upload/import and manual file creation are file-management features.
        if (pathname.startsWith('/upload')) {
            if (!can(user.role, 'manageFiles')) {
                return NextResponse.redirect(new URL('/', request.url)); // Or 403 page
            }
        }

        // Users/Admin Management: Only SUPER_ADMIN
        if (pathname.startsWith('/users')) {
            if (!can(user.role, 'manageUsers')) {
                return NextResponse.redirect(new URL('/', request.url));
            }
        }
        if (pathname.startsWith('/admin')) {
            if (!can(user.role, 'manageAgencies')) {
                return NextResponse.redirect(new URL('/', request.url));
            }
        }
        if (pathname.startsWith('/borrow')) {
            if (!can(user.role, 'viewBorrow')) {
                return NextResponse.redirect(new URL('/', request.url)); // Or 403 page
            }
        }
        // if (pathname.startsWith('/files')) {
        //     if ((user as User).role !== 'SUPER_ADMIN' && (user as User).role !== 'COORDINATOR' && (user as User).role !== 'ADMIN') {
        //         return NextResponse.redirect(new URL('/', request.url)); // Or 403 page
        //     }
        // }
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
