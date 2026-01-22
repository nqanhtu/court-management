import { Suspense } from 'react'
import { SearchFilters } from '@/components/search-filters'
import { CreateFileDialog } from '@/components/create-file-dialog'
import { OverviewStats } from '@/components/overview-stats'
import { FileListSection } from '@/components/file-list-section'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="h-4 w-1/3 bg-slate-100 mb-4 rounded"></div>
            <div className="h-8 w-1/2 bg-slate-100 rounded"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  )
}

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  return (
    <div className="flex flex-col h-full space-y-4">
      <Suspense fallback={<StatsSkeleton />}>
        <OverviewStats />
      </Suspense>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Tra cứu Hồ sơ</h1>
        <CreateFileDialog />
      </div>

      <SearchFilters />

      <Suspense fallback={<ListSkeleton />}>
        <FileListSection searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
