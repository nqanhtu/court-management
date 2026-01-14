import { getUsers } from "@/lib/actions/users";
import { getSession } from "@/lib/actions/auth";
import UsersClient from "./UsersClient";
import type { User } from "@/lib/types/user";

export default async function UsersPage() {
  const [users, session] = await Promise.all([
    getUsers(),
    getSession()
  ]);

  return <UsersClient initialUsers={users} currentUserRole={(session as User | null)?.role} />;
}