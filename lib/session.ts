
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth-jwt';

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
