'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
// cleaned import

interface ManualFileFormProps {
    onSuccess: () => void
}

export function ManualFileForm({ onSuccess }: ManualFileFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const [formData, setFormData] = useState({
        code: '',
        title: '',
        type: 'Hình sự',
        year: new Date().getFullYear(),
        retention: '10 năm',
        note: '',
        judgmentNumber: '',
        judgmentDate: '',
        pageCount: 0,
        defendants: '',
        plaintiffs: '',
        civilDefendants: ''
    })

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const splitToList = (str: string) => str ? str.split(',').map(s => s.trim()).filter(Boolean) : []

            const response = await fetch('/api/files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: formData.code,
                    title: formData.title,
                    type: formData.type,
                    year: formData.year,
                    retention: formData.retention,
                    note: formData.note,
                    datetime: new Date(),
                    judgmentNumber: formData.judgmentNumber,
                    judgmentDate: formData.judgmentDate ? new Date(formData.judgmentDate) : null,
                    pageCount: formData.pageCount,
                    defendants: splitToList(formData.defendants),
                    plaintiffs: splitToList(formData.plaintiffs),
                    civilDefendants: splitToList(formData.civilDefendants),
                })
            })
            
            const result = await response.json();

            if (response.ok && result.success) {
                toast.success('Tạo hồ sơ thành công')
                router.refresh()
                // Reset form
                setFormData({
                    code: '',
                    title: '',
                    type: 'Hình sự',
                    year: new Date().getFullYear(),
                    retention: '10 năm',
                    note: '',
                    judgmentNumber: '',
                    judgmentDate: '',
                    pageCount: 0,
                    defendants: '',
                    plaintiffs: '',
                    civilDefendants: ''
                })
                onSuccess()
            } else {
                toast.error('Tạo thất bại: ' + (result.error || 'Lỗi không xác định'))
            }
        } catch (error) {
            console.error(error)
            toast.error('Có lỗi xảy ra')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleManualSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="code" className="text-red-600 font-semibold">Mã hồ sơ *</Label>
                    <Input
                        id="code"
                        placeholder="VD: HS-001"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="type">Loại án</Label>
                    <Input
                        id="type"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="year">Năm</Label>
                    <Input
                        id="year"
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="title" className="font-semibold">Tiêu đề / Trích yếu *</Label>
                <Input
                    id="title"
                    placeholder="Về việc..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                />
            </div>

            {/* Chi tiết án */}
            <div className="grid grid-cols-2 gap-4 border p-4 rounded-md bg-muted/20">
                <div className="space-y-2">
                    <Label htmlFor="judgmentNumber">Số bản án</Label>
                    <Input
                        id="judgmentNumber"
                        placeholder="01/2024/HSST"
                        value={formData.judgmentNumber}
                        onChange={(e) => setFormData({ ...formData, judgmentNumber: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="judgmentDate">Ngày xét xử</Label>
                    <Input
                        id="judgmentDate"
                        type="date"
                        value={formData.judgmentDate}
                        onChange={(e) => setFormData({ ...formData, judgmentDate: e.target.value })}
                    />
                </div>
                <div className="space-y-2 col-span-2">
                    <Label htmlFor="defendants" className="text-red-600">Bị cáo (cách nhau bởi dấu phẩy)</Label>
                    <Input
                        id="defendants"
                        placeholder="Nguyen Van A, Tran Van B"
                        value={formData.defendants}
                        onChange={(e) => setFormData({ ...formData, defendants: e.target.value })}
                    />
                </div>
                <div className="space-y-2 col-span-2">
                    <Label htmlFor="plaintiffs" className="text-blue-600">Nguyên đơn (cách nhau bởi dấu phẩy)</Label>
                    <Input
                        id="plaintiffs"
                        placeholder="Le Thi C"
                        value={formData.plaintiffs}
                        onChange={(e) => setFormData({ ...formData, plaintiffs: e.target.value })}
                    />
                </div>
                <div className="space-y-2 col-span-2">
                    <Label htmlFor="civilDefendants" className="text-orange-600">Bị đơn (cách nhau bởi dấu phẩy)</Label>
                    <Input
                        id="civilDefendants"
                        placeholder="Cong ty X"
                        value={formData.civilDefendants}
                        onChange={(e) => setFormData({ ...formData, civilDefendants: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="retention">Bảo quản</Label>
                    <Input
                        id="retention"
                        placeholder="10 năm"
                        value={formData.retention}
                        onChange={(e) => setFormData({ ...formData, retention: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="pageCount">Số tờ</Label>
                    <Input
                        id="pageCount"
                        type="number"
                        value={formData.pageCount}
                        onChange={(e) => setFormData({ ...formData, pageCount: parseInt(e.target.value || '0') })}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="boxCode">Hộp số (Mã hộp)</Label>
                    <Input
                        id="boxCode"
                        placeholder="Box code..."
                        disabled
                        title="Tính năng chọn hộp sẽ cập nhật sau"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="note">Ghi chú</Label>
                <Textarea
                    id="note"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
            </div>

            <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Lưu hồ sơ
                </Button>
            </DialogFooter>
        </form>
    )
}
