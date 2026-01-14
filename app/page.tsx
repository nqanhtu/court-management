import { searchFiles, getFileStats } from '@/lib/actions/files'
import { FileTable } from '@/components/file-table'
import { SearchFilters } from '@/components/search-filters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getOverdueCount } from '@/lib/services/stats'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams
  const q = params.q
  const type = params.type
  const page = parseInt(params.page || '1')

  const { files, total } = await searchFiles({
    query: q,
    type: type !== 'all' ? type : undefined,
    limit: 10,
    offset: (page - 1) * 10
  })

  // Optional: Stats for dashboard
  const stats = await getFileStats()
  const overdue = await getOverdueCount()

  return (
    <div className="container mx-auto py-10">
      <div className="grid gap-4 md:grid-cols-3 mb-8">
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

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Tra cứu Hồ sơ</h1>
      </div>

      <SearchFilters />

      <FileTable files={files} />

      <div className="mt-4 text-sm text-muted-foreground">
        Hiển thị {files.length} / {total} kết quả
      </div>
    </div>
  )
}