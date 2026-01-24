'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { UploadCloud, Loader2 } from 'lucide-react'
import { uploadExcel } from '@/lib/actions/upload'

interface ExcelUploadFormProps {
    onSuccess: () => void
}

export function ExcelUploadForm({ onSuccess }: ExcelUploadFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const router = useRouter()

    const handleExcelUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) {
            toast.error('Vui lòng chọn file Excel')
            return
        }

        setIsLoading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const result = await uploadExcel(formData)
            if (result.success) {
                toast.success(`Import thành công: ${result.stats?.success} hồ sơ`)
                if (result.stats?.failure && result.stats.failure > 0) {
                    toast.warning(`Có ${result.stats.failure} hồ sơ lỗi. Xem chi tiết trong console.`)
                    console.error(result.errors)
                }
                onSuccess()
                window.location.reload()
            } else {
                toast.error(result.message || 'Import thất bại')
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi upload')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleExcelUpload} className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => document.getElementById('file-upload')?.click()}
            >
                <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-sm font-medium">Click để chọn file hoặc kéo thả</p>
                <p className="text-xs text-muted-foreground mt-1">Hỗ trợ .xlsx, .xls</p>
                <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
            </div>
            {file && (
                <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                    <span className="font-semibold">File đã chọn:</span>
                    {file.name}
                </div>
            )}
            <DialogFooter>
                <Button type="submit" disabled={isLoading || !file}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang xử lý...
                        </>
                    ) : (
                        'Upload & Import'
                    )}
                </Button>
            </DialogFooter>
        </form>
    )
}
