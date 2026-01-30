'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { UploadCloud, Loader2, FileSpreadsheet } from 'lucide-react'


interface ChildDocumentUploadModalProps {
    fileId: string
    trigger?: React.ReactNode
    onSuccess?: () => void
}

export function ChildDocumentUploadModal({ fileId, trigger, onSuccess }: ChildDocumentUploadModalProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const router = useRouter()
    console.log("day: ", fileId)

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) {
            toast.error('Please select a file')
            return
        }

        setIsLoading(true)
        const formData = new FormData()
        formData.append('file', file)
        console.log("day: ", fileId)
        formData.append('fileId', fileId)

        try {
            const response = await fetch('/api/files/import-child-docs', {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()

            if (result.success) {
                toast.success(`Add successfuly! ${result.successCount} documents`)
                if (result.failureCount > 0) {
                    toast.warning(`${result.failureCount}`)
                    console.error(result.errors)
                }
                setOpen(false)
                setFile(null)
                // router.refresh()
                if (onSuccess) onSuccess()
            } else {
                toast.error(result.error || 'Upload failed!')
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button size="sm" variant="outline" className="gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        Upload bản kê
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload Mục lục văn bản</DialogTitle>
                    <DialogDescription>
                        Tải lên file Excel danh sách các văn bản con (bản kê) cho hồ sơ này.
                        <br />
                        File import sẽ được thêm vào danh sách hiện tại.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-4 py-4">
                    <div
                        className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => document.getElementById('child-doc-upload')?.click()}
                    >
                        <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
                        <p className="text-sm font-medium">Click chọn file hoặc kéo thả</p>
                        <p className="text-xs text-muted-foreground mt-1">Hỗ trợ .xlsx, .xls</p>
                        <input
                            id="child-doc-upload"
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                    </div>
                    {file && (
                        <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                            <span className="font-semibold">Đã chọn:</span>
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
                                'Tải lên'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
