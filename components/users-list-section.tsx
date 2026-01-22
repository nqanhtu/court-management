'use client'

import { useUsers } from '@/lib/hooks/use-users'
import { useSession } from '@/lib/hooks/use-auth'
import UsersClient from "@/app/users/UsersClient";
import { Loader2 } from 'lucide-react';

export function UsersListSection() {
    const { users, isLoading: isUsersLoading } = useUsers();
    const { session, isLoading: isSessionLoading } = useSession();

    if (isUsersLoading || isSessionLoading) {
        return (
            <div className="flex-1 flex items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    return <UsersClient initialUsers={users} currentUserRole={session?.role} />;
}
