'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useFiles } from '@/lib/hooks/use-files'
import { FileTable } from '@/components/file-table'
import { Loader2 } from 'lucide-react'

interface FileListSectionProps {
    onCreate?: () => void
}

export function FileListSection({ onCreate }: FileListSectionProps) {
    const searchParams = useSearchParams()
    const q = searchParams.get('q') || undefined
    const type = searchParams.get('type') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const { files, total, isLoading } = useFiles({
        query: q,
        type,
        limit,
        offset: (page - 1) * limit
    })

    const router = useRouter()

    const handlePaginationChange = (newPage: number, newPageSize: number) => {
         const params = new URLSearchParams(searchParams)
         params.set('page', newPage.toString())
         params.set('limit', newPageSize.toString())
         router.replace(`/?${params.toString()}`)
    }

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex-1 min-h-0 overflow-auto">
            <FileTable 
                files={files} 
                onCreate={onCreate} 
                total={total}
                page={page}
                pageSize={limit}
                onPaginationChange={handlePaginationChange}
            />
        </div>
    )
}
