'use client'

import { useState, useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Plus } from 'lucide-react'
import { type DocumentFormData } from '@/lib/actions/document'

interface ChildDocumentFormModalProps {
    fileId: string
    document?: any
    trigger?: React.ReactNode
    onSuccess?: () => void
}

export function ChildDocumentFormModal({ fileId, document, trigger, onSuccess }: ChildDocumentFormModalProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const isEdit = !!document

    const [formData, setFormData] = useState<DocumentFormData>({
        fileId: fileId,
        title: '',
        code: '',
        contentIndex: '',
        year: new Date().getFullYear(),
        pageCount: 0,
        order: 1,
        preservationTime: '',
        note: ''
    })

    useEffect(() => {
        if (open) {
            if (document) {
                setFormData({
                    id: document.id,
                    fileId: fileId,
                    title: document.title || '',
                    code: document.code || '',
                    contentIndex: document.contentIndex || '',
                    year: document.year || new Date().getFullYear(),
                    pageCount: document.pageCount || 0,
                    order: document.order || 1,
                    preservationTime: document.preservationTime || '',
                    note: document.note || ''
                })
            } else {
                setFormData({
                    fileId: fileId,
                    title: '',
                    code: '',
                    contentIndex: '',
                    year: new Date().getFullYear(),
                    pageCount: 0,
                    order: 1, // Ideally fetch max order + 1, but 1 is safe default
                    preservationTime: '',
                    note: ''
                })
            }
        }
    }, [open, document, fileId])

    const handleChange = (field: keyof DocumentFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.title) {
            toast.error('Vui lòng nhập trích yếu văn bản')
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch('/api/files/child-document', {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })
            const result = await response.json();
            if (result.success) {
                toast.success(isEdit ? 'Update successfuly!' : 'Add successfuly!')
                setOpen(false)
                // router.refresh()
                if (onSuccess) onSuccess()
            } else {
                toast.error(result.error || (isEdit ? 'Update failed!' : 'Add failed!'))
            }
        } catch (error) {
            console.error(error)
            toast.error('Có lỗi xảy ra')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Thêm thủ công
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Cập nhật văn bản' : 'Thêm văn bản mới'}</DialogTitle>
                    <DialogDescription>
                        Nhập thông tin chi tiết cho văn bản trong hồ sơ.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="title" className="text-right">
                                Trích yếu / Tên văn bản <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="title"
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                placeholder="Nhập trích yếu văn bản..."
                                className="min-h-[80px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contentIndex">MLVB (Số ký hiệu)</Label>
                            <Input
                                id="contentIndex"
                                value={formData.contentIndex}
                                onChange={(e) => handleChange('contentIndex', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="code">Mã quản lý</Label>
                            <Input
                                id="code"
                                value={formData.code}
                                onChange={(e) => handleChange('code', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="year">Năm</Label>
                            <Input
                                id="year"
                                type="number"
                                value={formData.year}
                                onChange={(e) => handleChange('year', parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pageCount">Số tờ</Label>
                            <Input
                                id="pageCount"
                                type="number"
                                value={formData.pageCount}
                                onChange={(e) => handleChange('pageCount', parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="order">Số thứ tự</Label>
                            <Input
                                id="order"
                                type="number"
                                value={formData.order}
                                onChange={(e) => handleChange('order', parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="preservationTime">Thời hạn bảo quản</Label>
                            <Input
                                id="preservationTime"
                                value={formData.preservationTime}
                                onChange={(e) => handleChange('preservationTime', e.target.value)}
                                placeholder="VD: Vĩnh viễn, 10 năm..."
                            />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="note">Ghi chú</Label>
                            <Textarea
                                id="note"
                                value={formData.note}
                                onChange={(e) => handleChange('note', e.target.value)}
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                'Lưu văn bản'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
