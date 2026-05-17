'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/lib/hooks/use-auth'
import { useFileStats } from '@/lib/hooks/use-files'
import { can } from '@/lib/rbac'

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
    can(session?.role, 'manageFiles') ? { href: '/upload', label: 'Nhập Excel' } : null,
    can(session?.role, 'manageBorrow') ? { href: '/borrow', label: overdue > 0 ? 'Xử lý quá hạn' : 'Lập phiếu mượn' } : null,
    can(session?.role, 'viewReports') ? { href: '/reports', label: 'Xem thống kê' } : null,
  ].filter(Boolean) as Array<{ href: string; label: string }>

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng số hồ sơ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Đang cho mượn</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{borrowed}</div>
        </CardContent>
      </Card>
      <Card className={overdue > 0 ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={overdue > 0 ? 'text-sm font-medium text-red-600' : 'text-sm font-medium'}>
            Quá hạn trả
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={overdue > 0 ? 'text-2xl font-bold text-red-600' : 'text-2xl font-bold'}>{overdue}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Việc cần làm</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {shortcuts.map((shortcut) => (
            <Button key={shortcut.href} asChild variant="outline" size="sm">
              <Link href={shortcut.href}>{shortcut.label}</Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
