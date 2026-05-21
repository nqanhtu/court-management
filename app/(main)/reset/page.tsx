'use client';

import { apiFetch } from '@/lib/api/client';

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ShieldAlert, Trash2, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useSession } from '@/lib/hooks/use-auth'

interface DeletedCounts {
    files: number
    documents: number
    fileIndexes: number
    borrowSlips: number
    borrowItems: number
    borrowSlipEvents: number
}

export default function ResetPage() {
    const router = useRouter()
    const { session, isLoading } = useSession()

    const [confirmText, setConfirmText] = useState('')
    const [showDialog, setShowDialog] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [result, setResult] = useState<DeletedCounts | null>(null)

    // Chặn truy cập nếu không phải SUPER_ADMIN
    if (!isLoading && session?.role !== 'SUPER_ADMIN') {
        router.replace('/forbidden')
        return null
    }

    const canConfirm = confirmText === 'RESET'

    const handleReset = async () => {
        setShowDialog(false)
        setIsResetting(true)
        setResult(null)

        try {
            const res = await apiFetch('/api/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirm: 'RESET' }),
            })

            const data = await res.json()

            if (res.ok && data.success) {
                setResult(data.deletedCounts)
                setConfirmText('')
                toast.success('Reset dữ liệu thành công')
            } else {
                toast.error(data.error || 'Reset thất bại')
            }
        } catch {
            toast.error('Lỗi kết nối')
        } finally {
            setIsResetting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-2xl py-10 space-y-6">
            {/* Header cảnh báo */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                <ShieldAlert className="w-8 h-8 text-red-600 shrink-0" />
                <div>
                    <h1 className="text-lg font-bold text-red-800">Vùng nguy hiểm</h1>
                    <p className="text-sm text-red-600">
                        Chỉ dành cho Quản trị toàn hệ thống (SUPER_ADMIN). Thao tác này không thể hoàn tác.
                    </p>
                </div>
            </div>

            {/* Card reset */}
            <Card className="border-red-200 shadow-sm">
                <CardHeader className="border-b border-red-100 bg-red-50/50">
                    <div className="flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-red-600" />
                        <CardTitle className="text-red-800">Xóa toàn bộ dữ liệu hồ sơ</CardTitle>
                    </div>
                    <CardDescription className="text-red-600/80">
                        Thao tác này sẽ xóa vĩnh viễn toàn bộ hồ sơ, hồ sơ con, phiếu mượn và lịch sử mượn trả.
                        Tài khoản người dùng và hộp lưu trữ sẽ được giữ nguyên.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                    {/* Danh sách dữ liệu sẽ bị xóa */}
                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-700">Dữ liệu sẽ bị xóa:</p>
                        <ul className="text-sm text-slate-600 space-y-1 pl-4 list-disc">
                            <li>Tất cả <strong>Hồ sơ</strong> (File)</li>
                            <li>Tất cả <strong>Hồ sơ con / Văn bản</strong> (Document)</li>
                            <li>Tất cả <strong>Phiếu mượn</strong> (BorrowSlip)</li>
                            <li>Tất cả <strong>Chi tiết mượn</strong> (BorrowItem)</li>
                            <li>Tất cả <strong>Lịch sử mượn trả</strong> (BorrowSlipEvent)</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-700">Dữ liệu sẽ được giữ nguyên:</p>
                        <ul className="text-sm text-slate-500 space-y-1 pl-4 list-disc">
                            <li>Tài khoản người dùng</li>
                            <li>Hộp lưu trữ (StorageBox)</li>
                            <li>Phông lưu trữ (AgencyHistory)</li>
                        </ul>
                    </div>

                    {/* Ô xác nhận */}
                    <div className="space-y-2 pt-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Nhập <code className="bg-slate-100 px-1.5 py-0.5 rounded text-red-600 font-mono">RESET</code> để xác nhận
                        </label>
                        <Input
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Nhập RESET..."
                            className="border-red-200 focus-visible:ring-red-400 font-mono"
                            disabled={isResetting}
                        />
                    </div>

                    <Button
                        variant="destructive"
                        className="w-full"
                        disabled={!canConfirm || isResetting}
                        onClick={() => setShowDialog(true)}
                    >
                        {isResetting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang xóa dữ liệu...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa toàn bộ dữ liệu
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Kết quả sau khi reset */}
            {result && (
                <Card className="border-green-200 bg-green-50/50">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <CardTitle className="text-green-800 text-base">Reset thành công</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            {[
                                { label: 'Hồ sơ đã xóa', value: result.files },
                                { label: 'Hồ sơ con đã xóa', value: result.documents },
                                { label: 'Mục lục hồ sơ', value: result.fileIndexes },
                                { label: 'Phiếu mượn đã xóa', value: result.borrowSlips },
                                { label: 'Chi tiết mượn', value: result.borrowItems },
                                { label: 'Lịch sử mượn trả', value: result.borrowSlipEvents },
                            ].map((item) => (
                                <div key={item.label} className="flex justify-between items-center py-1.5 px-3 bg-white rounded-lg border border-green-100">
                                    <span className="text-slate-600">{item.label}</span>
                                    <span className="font-bold text-slate-800">{item.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Dialog xác nhận cuối */}
            <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-700">
                            <ShieldAlert className="w-5 h-5" />
                            Xác nhận xóa toàn bộ dữ liệu?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này sẽ <strong>xóa vĩnh viễn</strong> toàn bộ hồ sơ, phiếu mượn và lịch sử hệ thống.
                            Bạn không thể hoàn tác sau khi xác nhận.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={handleReset}
                        >
                            Tôi hiểu, tiến hành xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
