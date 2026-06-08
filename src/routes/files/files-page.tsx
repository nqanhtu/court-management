'use client'

import { useState, useEffect } from 'react'

import { CreateFileDialog } from '@/components/create-file-dialog'
import { OverviewStats } from '@/components/overview-stats'
import { FileListSection } from '@/components/files/file-list-section'
import { DataPageShell } from '@/components/common/data-page-shell'
import { PageHeader } from '@/components/common/page-header'
import { useSearchParams, useRouter } from '@/src/lib/router'

export default function Home() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const createParam = searchParams.get('create')

  useEffect(() => {
    if (createParam === 'true') {
      setIsCreateModalOpen(true)
      const params = new URLSearchParams(searchParams.toString())
      params.delete('create')
      router.replace(`/?${params.toString()}`)
    }
  }, [createParam, searchParams, router])

  return (
    <DataPageShell
      header={
        <div className="space-y-3 md:space-y-4">
          <OverviewStats />
          <PageHeader
            title="Tra cứu hồ sơ"
            description="Tìm kiếm, lọc và thao tác với hồ sơ lưu trữ."
          />
        </div>
      }
    >
      <FileListSection onCreate={() => setIsCreateModalOpen(true)} />

      <CreateFileDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        trigger={<span className="hidden" />}
      />
    </DataPageShell>
  )
}
