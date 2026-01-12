'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  Database,
  Bot,
  FolderArchive,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    category: 'Quản lý',
    items: [
      { name: 'Hồ sơ', href: '/', icon: LayoutDashboard },
      { name: 'Mượn trả', href: '/borrow', icon: FileText },
      { name: 'Người dùng', href: '/users', icon: Users },
    ],
  },
  {
    category: 'Báo cáo',
    items: [{ name: 'Thống kê', href: '/reports', icon: BarChart3 }],
  },
  {
    category: 'Hệ thống',
    items: [
      { name: 'Cấu hình', href: '#', icon: Settings },
      { name: 'Dữ liệu', href: '#', icon: Database },
      { name: 'Trợ lý AI', href: '#', icon: Bot },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className='w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 transition-all duration-300'>
      <div className='h-16 flex items-center px-6 border-b border-slate-100'>
        <div className='flex items-center gap-2 text-indigo-600 font-bold text-xl'>
          <FolderArchive className='w-6 h-6' />
          <span>Court Management</span>
        </div>
      </div>

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

      <div className='p-4 border-t border-slate-100'>
        <div className='bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white'>
          <p className='text-xs font-medium opacity-80 mb-1'>Phiên bản Pro</p>
          <p className='text-sm font-bold mb-3'>Nâng cấp ngay</p>
          <button className='w-full py-1.5 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold transition-colors'>
            Xem chi tiết
          </button>
        </div>
      </div>
    </aside>
  );
}
