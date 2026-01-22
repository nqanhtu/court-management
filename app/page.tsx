'use client'

import { SearchFilters } from '@/components/search-filters'
import { CreateFileDialog } from '@/components/create-file-dialog'
import { OverviewStats } from '@/components/overview-stats'
import { FileListSection } from '@/components/file-list-section'

export default function Home() {
  return (
    <div className="flex flex-col h-full space-y-4">
      <OverviewStats />

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Tra cứu Hồ sơ</h1>
        <CreateFileDialog />
      </div>

      <SearchFilters />

      <FileListSection />
    </div>
  )
}
