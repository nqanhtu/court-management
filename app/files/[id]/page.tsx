import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { FileDetailLoader } from '@/components/files/file-detail-content'

export default function FileDetailPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <div className="flex flex-col h-full space-y-4 w-full">
            <div className="shrink-0">
                <Button variant="ghost" asChild>
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                    </Link>
                </Button>
            </div>

            <Suspense fallback={
                <div className="flex justify-center p-10">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
            }>
                <FileDetailLoader params={params} />
            </Suspense>
        </div>
    )
}
