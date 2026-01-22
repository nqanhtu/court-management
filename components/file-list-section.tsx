import { searchFiles } from '@/lib/actions/files'
import { FileTable } from '@/components/file-table'
import { PaginationControls } from '@/components/ui/pagination-controls'

interface FileListSectionProps {
    searchParams: Promise<{ [key: string]: string | undefined }>
}

export async function FileListSection({ searchParams }: FileListSectionProps) {
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
