import { getUsers } from "@/lib/actions/users";
import { getSession } from "@/lib/actions/auth";
import UsersClient from "@/app/users/UsersClient";
import type { User } from "@/lib/types/user";

export async function UsersListSection() {
    const [users, session] = await Promise.all([
        getUsers(),
        getSession()
    ]);

    return <UsersClient initialUsers={users} currentUserRole={(session as User | null)?.role} />;
}
