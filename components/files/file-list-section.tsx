'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useFiles } from '@/lib/hooks/use-files'
import { FileTable } from '@/components/files/file-table'
import { useSWRConfig } from 'swr'
import { useSession } from '@/lib/hooks/use-auth'
import { can } from '@/lib/rbac'

interface FileListSectionProps {
    onCreate?: () => void
}

export function FileListSection({ onCreate }: FileListSectionProps) {
    const searchParams = useSearchParams()
    const q = searchParams.get('q') || undefined
    const type = searchParams.get('type') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const { files, total, isLoading, mutate } = useFiles({
        query: q,
        type,
        limit,
        offset: (page - 1) * limit
    })

    const { mutate: globalMutate } = useSWRConfig()
    const { session } = useSession()
    const canManageFiles = can(session?.role, 'manageFiles')
    const canManageBorrow = can(session?.role, 'manageBorrow')

    const router = useRouter()

    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        const params = new URLSearchParams(searchParams)
        params.set('page', newPage.toString())
        params.set('limit', newPageSize.toString())
        router.replace(`/?${params.toString()}`)
    }

    return (
        <div className="flex-1 min-h-0">
            <FileTable
                files={files}
                isLoading={isLoading}
                role={session?.role}
                onCreate={canManageFiles ? onCreate : undefined}
                canBorrow={canManageBorrow}
                total={total}
                page={page}
                pageSize={limit}
                onPaginationChange={handlePaginationChange}
                onRefresh={() => {
                    mutate();
                    globalMutate('/api/files/stats');
                }}
            />
        </div>
    )
}
