'use client';

import { Bell, Search, UserCircle, LogOut } from "lucide-react";
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/lib/actions/auth';
import type { User } from '@/lib/types/user';

interface HeaderProps {
  user?: User;
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/login') return null;

  async function handleLogout() {
    await logout();
    router.refresh();
    router.push('/login');
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
      <div className="flex items-center gap-4 flex-1">
        <h2 className="font-semibold text-slate-800 text-lg hidden md:block">Tổng quan</h2>
        <div className="max-w-md w-full relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm hồ sơ, văn bản..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-700">{user.fullName}</p>
              <p className="text-xs text-slate-500">{user.role}</p>
            </div>
            <UserCircle className="w-9 h-9 text-slate-300" />
            <button
              onClick={handleLogout}
              className="ml-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <UserCircle className="w-9 h-9 text-slate-300" />
          </div>
        )}
      </div>
    </header>
  );
}