'use client'

import { useFileStats } from '@/lib/hooks/use-files'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function OverviewStats() {
    const { stats, isLoading } = useFileStats()

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map(i => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <Skeleton className="h-4 w-1/3 mb-4" />
                            <Skeleton className="h-8 w-1/2" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    const { total, borrowed } = stats
    const overdue = 0 // Placeholder until I fix API

    return (
        <div className="grid gap-4 md:grid-cols-3">
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
            <Card className={overdue > 0 ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={overdue > 0 ? "text-sm font-medium text-red-600" : "text-sm font-medium"}>Quá hạn trả</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className={overdue > 0 ? "text-2xl font-bold text-red-600" : "text-2xl font-bold"}>{overdue}</div>
                </CardContent>
            </Card>
        </div>
    )
}
