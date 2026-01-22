'use client'

import { useSearchParams } from 'next/navigation'
import { useFiles } from '@/lib/hooks/use-files'
import { FileTable } from '@/components/file-table'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { Loader2 } from 'lucide-react'

export function FileListSection() {
    const searchParams = useSearchParams()
    const q = searchParams.get('q') || undefined
    const type = searchParams.get('type') || undefined
    const page = parseInt(searchParams.get('page') || '1')

    const { files, total, isLoading } = useFiles({
        query: q,
        type,
        limit: 10,
        offset: (page - 1) * 10
    })

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    return (
        <>
            <div className="flex-1 min-h-0 overflow-auto">
                <FileTable files={files} />
            </div>

            <div className="flex justify-between items-center pt-2">
                <div className="text-sm text-muted-foreground">
                    Hiển thị {files.length} / {total} kết quả
                </div>

                <PaginationControls
                    hasNextPage={(page * 10) < total}
                    hasPrevPage={page > 1}
                    totalPages={Math.ceil(total / 10)}
                    currentPage={page}
                />
            </div>
        </>
    )
}
