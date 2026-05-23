'use client'

import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/lib/hooks/use-auth'
import { useFileStats } from '@/lib/hooks/use-files'
import { can } from '@/lib/rbac'
import { Archive, FileUp, AlertCircle, ListTodo, FileText, PieChart, ChevronRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Shortcut = {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
  tone: string
}

export function OverviewStats() {
  const { stats, isLoading } = useFileStats()
  const { session } = useSession()

  if (isLoading) {
    return (
      <Card size="sm" className="rounded-lg border shadow-sm">
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="rounded-lg border bg-muted/20 p-4">
              <Skeleton className="mb-3 h-3 w-24" />
              <Skeleton className="h-10 w-16" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
            </div>
          </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
        </CardContent>
      </Card>
    )
  }

  const { total, borrowed, overdue } = stats
  const borrowedRate = total > 0 ? Math.round((borrowed / total) * 100) : 0
  const overdueRate = borrowed > 0 ? Math.round((overdue / borrowed) * 100) : 0
  const statusItems = [
    {
      label: 'Đang mượn',
      value: borrowed,
      icon: FileUp,
      detail: `${borrowedRate}% tổng hồ sơ`,
      className: 'border-blue-100 bg-blue-50/50 text-blue-950 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-100',
      iconClassName: 'text-blue-500',
    },
    {
      label: 'Quá hạn',
      value: overdue,
      icon: AlertCircle,
      detail: overdue > 0 ? `${overdueRate}% hồ sơ đang mượn` : 'Không có phiếu quá hạn',
      className: overdue > 0
        ? 'border-red-100 bg-red-50/50 text-red-950 dark:border-red-900 dark:bg-red-950/20 dark:text-red-100'
        : 'border-emerald-100 bg-emerald-50/50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100',
      iconClassName: overdue > 0 ? 'text-red-500' : 'text-slate-400',
    },
  ]
  const healthText = overdue > 0
    ? `${overdue} phiếu cần xử lý trước hạn vận hành`
    : 'Tình trạng mượn trả đang ổn định'
  const HealthIcon = overdue > 0 ? AlertCircle : CheckCircle2
  const shortcuts = [
    can(session?.role, 'manageFiles') ? { href: '/upload', label: 'Nhập hồ sơ', icon: FileUp, tone: 'text-sky-700 bg-sky-50 hover:bg-sky-100 dark:text-sky-200 dark:bg-sky-950/30 dark:hover:bg-sky-950/50' } : null,
    can(session?.role, 'manageBorrow') ? { href: '/borrow', label: overdue > 0 ? 'Xử lý quá hạn' : 'Lập phiếu mượn', icon: overdue > 0 ? AlertCircle : FileText, tone: overdue > 0 ? 'text-red-700 bg-red-50 hover:bg-red-100 dark:text-red-200 dark:bg-red-950/30 dark:hover:bg-red-950/50' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-200 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50' } : null,
    can(session?.role, 'viewReports') ? { href: '/reports', label: 'Xem thống kê', icon: PieChart, tone: 'text-violet-700 bg-violet-50 hover:bg-violet-100 dark:text-violet-200 dark:bg-violet-950/30 dark:hover:bg-violet-950/50' } : null,
  ].filter(Boolean) as Shortcut[]

  return (
    <Card size="sm" className="rounded-lg border shadow-sm">
      <CardContent className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="flex min-h-28 flex-col justify-between rounded-lg border border-indigo-100 bg-indigo-50/50 p-4 text-indigo-950 dark:border-indigo-900 dark:bg-indigo-950/20 dark:text-indigo-100">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700/80 dark:text-indigo-200/80">Kho hồ sơ</p>
              <Archive className="h-4 w-4 text-indigo-500" />
            </div>
            <div>
              <p className="text-4xl font-bold leading-none tabular-nums">{total}</p>
              <p className="mt-1 text-xs text-indigo-800/70 dark:text-indigo-200/70">Tổng số hồ sơ đang quản lý</p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {statusItems.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className={cn('flex min-h-28 flex-col justify-between rounded-lg border p-4', item.className)}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <Icon className={cn('h-4 w-4', item.iconClassName)} />
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-3xl font-bold leading-none tabular-nums">{item.value}</p>
                    <p className="text-right text-xs text-current/65">{item.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className={cn(
            'md:col-span-2 flex items-center gap-2 rounded-md border px-3 py-2 text-sm',
            overdue > 0
              ? 'border-red-100 bg-red-50/60 text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-200'
              : 'border-emerald-100 bg-emerald-50/60 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200'
          )}>
            <HealthIcon className="h-4 w-4 shrink-0" />
            <span className="font-medium">{healthText}</span>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Thao tác nhanh</h2>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="grid gap-2">
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon
              return (
                <Link
                  key={shortcut.href}
                  to={shortcut.href}
                  className={cn(
                    'group flex h-10 items-center justify-between rounded-md px-3 text-sm transition-colors',
                    shortcut.tone
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 opacity-80" />
                    <span className="font-medium">{shortcut.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-0 -translate-x-1 transition-all group-hover:translate-x-0 group-hover:opacity-80" />
                </Link>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
