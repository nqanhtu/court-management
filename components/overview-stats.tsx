'use client'

import { Link } from 'react-router-dom'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/lib/hooks/use-auth'
import { useFileStats } from '@/lib/hooks/use-files'
import { can } from '@/lib/rbac'
import { Archive, FileUp, AlertCircle, ListTodo, FileText, PieChart, ChevronRight } from 'lucide-react'

export function OverviewStats() {
  const { stats, isLoading } = useFileStats()
  const { session } = useSession()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <Card key={item}>
            <CardContent className="p-6">
              <Skeleton className="mb-4 h-4 w-1/3" />
              <Skeleton className="h-8 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const { total, borrowed, overdue } = stats
  const shortcuts = [
    can(session?.role, 'manageFiles') ? { href: '/upload', label: 'Nhập hồ sơ', icon: FileUp } : null,
    can(session?.role, 'manageBorrow') ? { href: '/borrow', label: overdue > 0 ? 'Xử lý quá hạn' : 'Lập phiếu mượn', icon: overdue > 0 ? AlertCircle : FileText } : null,
    can(session?.role, 'viewReports') ? { href: '/reports', label: 'Xem thống kê', icon: PieChart } : null,
  ].filter(Boolean) as Array<{ href: string; label: string; icon: any }>

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card size="sm" className="bg-indigo-50/50 dark:bg-indigo-950/20 border-y border-r border-l-4 border-indigo-100 dark:border-indigo-900 border-l-indigo-500 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
          <CardTitle className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Tổng số hồ sơ</CardTitle>
          <Archive className="h-4 w-4 text-indigo-500 opacity-70" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{total}</div>
        </CardContent>
      </Card>
      
      <Card size="sm" className="bg-blue-50/50 dark:bg-blue-950/20 border-y border-r border-l-4 border-blue-100 dark:border-blue-900 border-l-blue-500 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
          <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">Đang cho mượn</CardTitle>
          <FileUp className="h-4 w-4 text-blue-500 opacity-70" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{borrowed}</div>
        </CardContent>
      </Card>
      
      <Card size="sm" className={`border-y border-r border-l-4 shadow-sm ${overdue > 0 ? 'bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900 border-l-red-500' : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 border-l-slate-300'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
          <CardTitle className={`text-sm font-medium ${overdue > 0 ? 'text-red-800 dark:text-red-300' : 'text-slate-600 dark:text-slate-400'}`}>
            Quá hạn trả
          </CardTitle>
          <AlertCircle className={`h-4 w-4 opacity-70 ${overdue > 0 ? 'text-red-500' : 'text-slate-400'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${overdue > 0 ? 'text-red-900 dark:text-red-100' : 'text-slate-800 dark:text-slate-100'}`}>{overdue}</div>
        </CardContent>
      </Card>
      
      <Card size="sm" className="bg-emerald-50/50 dark:bg-emerald-950/20 border-y border-r border-l-4 border-emerald-100 dark:border-emerald-900 border-l-emerald-500 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
          <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Việc cần làm</CardTitle>
          <ListTodo className="h-4 w-4 text-emerald-500 opacity-70" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2 mt-1">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <Link 
                key={shortcut.href} 
                to={shortcut.href}
                className="group flex items-center justify-between rounded-md bg-white/60 dark:bg-black/20 px-2 py-1.5 text-sm text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100" />
                  <span className="font-medium">{shortcut.label}</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  )
}
