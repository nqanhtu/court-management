import { decrypt } from '@/lib/auth-jwt';

export interface SessionPayload {
    id: string;
    username: string;
    role: string;
    fullName: string;
    [key: string]: unknown;
}

export async function getSession(): Promise<SessionPayload | null> {
    if (typeof document === 'undefined') return null;
    const session = document.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith('session='))
        ?.split('=')[1];
    if (!session) return null;
    try {
        return await decrypt(decodeURIComponent(session)) as SessionPayload;
    } catch {
        return null;
    }
}
