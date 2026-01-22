import { getFileStats } from '@/lib/actions/files'
import { getOverdueCount } from '@/lib/services/stats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export async function OverviewStats() {
    const stats = await getFileStats()
    const overdue = await getOverdueCount()

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tổng số hồ sơ</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Đang cho mượn</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-amber-600">{stats.borrowed}</div>
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
