'use client'

import { useState } from 'react'

import { CreateFileDialog } from '@/components/create-file-dialog'
import { OverviewStats } from '@/components/overview-stats'
import { FileListSection } from '@/components/files/file-list-section'

export default function Home() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <OverviewStats />

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Tra cứu Hồ sơ</h1>
      </div>


      <FileListSection onCreate={() => setIsCreateModalOpen(true)} />

      <CreateFileDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        trigger={<span className="hidden" />}
      />
    </div>
  )
}
