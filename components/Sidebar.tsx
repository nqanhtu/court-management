'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Upload,
  History as HistoryIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types/user';

interface SidebarProps {
  user?: User;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  const role = user?.role;
  // Define menu logic dynamically
  const menuItems = [
    {
      category: 'Quản lý',
      items: [
        { name: 'Hồ sơ', href: '/', icon: LayoutDashboard }, // All
        // Borrow: SuperAdmin, Admin, Coordinator
        ...((role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'COORDINATOR')
          ? [{ name: 'Mượn trả', href: '/borrow', icon: FileText }]
          : []),
        // Users: SuperAdmin only
        ...(role === 'SUPER_ADMIN' ? [
          { name: 'Người dùng', href: '/users', icon: Users },
          { name: 'Nhật ký', href: '/admin/audit', icon: HistoryIcon }
        ] : []),
        // Upload: SuperAdmin or Admin
        ...((role === 'SUPER_ADMIN' || role === 'ADMIN') ? [{ name: 'Nhập liệu', href: '/upload', icon: Upload }] : []),
      ],
    },
    {
      category: 'Báo cáo',
      items: [{ name: 'Thống kê', href: '/reports', icon: BarChart3 }],
    },

  ];

  return (
    <aside className='w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 transition-all duration-300'>
      <div className='flex-1 overflow-y-auto py-4 px-3 space-y-6'>
        {menuItems.map((group, idx) => (
          <div key={idx}>
            <h3 className='px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2'>
              {group.category}
            </h3>
            <div className='space-y-1'>
              {group.items.map((item, i) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={i}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4',
                        isActive ? 'text-indigo-600' : 'text-slate-400'
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
