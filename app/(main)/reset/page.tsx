'use client';

import { apiFetch } from '@/lib/api/client';

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ShieldAlert, Trash2, AlertTriangle, CheckCircle2, Loader2, DatabaseBackup, Download, Upload, RotateCcw } from 'lucide-react'
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
    const [showRestoreDialog, setShowRestoreDialog] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [isBackingUp, setIsBackingUp] = useState(false)
    const [isRestoring, setIsRestoring] = useState(false)
    const [restoreConfirmText, setRestoreConfirmText] = useState('')
    const [restoreFile, setRestoreFile] = useState<File | null>(null)
    const [result, setResult] = useState<DeletedCounts | null>(null)

    // Chặn truy cập nếu không phải SUPER_ADMIN
    if (!isLoading && session?.role !== 'SUPER_ADMIN') {
        router.replace('/forbidden')
        return null
    }

    const canConfirm = confirmText === 'RESET'
    const canRestore = restoreConfirmText === 'RESTORE' && Boolean(restoreFile)

    const handleBackup = async () => {
        setIsBackingUp(true)

        try {
            const response = await apiFetch('/api/admin/database/backup', {
                method: 'POST',
            })

            if (!response.ok) {
                let message = 'Không thể tạo bản sao lưu cơ sở dữ liệu'
                try {
                    const data = await response.json()
                    if (data?.error) message = data.error
                } catch {
                    // Response is not JSON; keep the default user-facing message.
                }
                throw new Error(message)
            }

            const blob = await response.blob()
            const filename = getDownloadFilename(response.headers.get('content-disposition'))
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')

            link.href = url
            link.download = filename
            document.body.appendChild(link)
            link.click()
            link.remove()
            URL.revokeObjectURL(url)

            toast.success('Đã tạo bản sao lưu cơ sở dữ liệu')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Lỗi kết nối')
        } finally {
            setIsBackingUp(false)
        }
    }

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

    const handleRestore = async () => {
        if (!restoreFile) return

        setShowRestoreDialog(false)
        setIsRestoring(true)

        try {
            const formData = new FormData()
            formData.set('confirm', 'RESTORE')
            formData.set('file', restoreFile)

            const res = await apiFetch('/api/admin/database/restore', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Khôi phục cơ sở dữ liệu thất bại')
            }

            setRestoreConfirmText('')
            setRestoreFile(null)
            toast.success(`Đã khôi phục cơ sở dữ liệu từ ${data.filename}`)
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Lỗi kết nối')
        } finally {
            setIsRestoring(false)
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

            <Card className="border-blue-200 shadow-sm">
                <CardHeader className="border-b border-blue-100 bg-blue-50/50">
                    <div className="flex items-center gap-2">
                        <DatabaseBackup className="w-5 h-5 text-blue-600" />
                        <CardTitle className="text-blue-800">Sao lưu cơ sở dữ liệu</CardTitle>
                    </div>
                    <CardDescription className="text-blue-600/80">
                        Tải xuống bản sao lưu PostgreSQL hiện tại dưới dạng file .dump. Nên thực hiện trước các thao tác bảo trì hoặc reset dữ liệu.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="rounded-lg border border-blue-100 bg-blue-50/40 px-4 py-3 text-sm text-slate-600">
                        File sao lưu được tạo trực tiếp từ cơ sở dữ liệu và chỉ dành cho quản trị toàn hệ thống.
                    </div>

                    <Button
                        variant="outline"
                        className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                        disabled={isBackingUp || isResetting || isRestoring}
                        onClick={handleBackup}
                    >
                        {isBackingUp ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang tạo bản sao lưu...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                Tải xuống bản sao lưu
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-amber-200 shadow-sm">
                <CardHeader className="border-b border-amber-100 bg-amber-50/50">
                    <div className="flex items-center gap-2">
                        <RotateCcw className="w-5 h-5 text-amber-600" />
                        <CardTitle className="text-amber-800">Khôi phục cơ sở dữ liệu</CardTitle>
                    </div>
                    <CardDescription className="text-amber-700/80">
                        Tải lên file .dump được tạo từ chức năng sao lưu để khôi phục PostgreSQL. Thao tác này có thể ghi đè dữ liệu hiện tại.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                    <div className="rounded-lg border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm text-slate-600">
                        Chỉ dùng file backup đáng tin cậy. Sau khi khôi phục, dữ liệu trong hệ thống sẽ theo nội dung của file được tải lên.
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Upload className="w-4 h-4 text-amber-600" />
                            File sao lưu PostgreSQL
                        </label>
                        <Input
                            type="file"
                            accept=".dump"
                            disabled={isRestoring || isResetting || isBackingUp}
                            onChange={(event) => setRestoreFile(event.target.files?.[0] ?? null)}
                            className="border-amber-200 focus-visible:ring-amber-400"
                        />
                        {restoreFile && (
                            <p className="text-xs text-muted-foreground">
                                Đã chọn: <span className="font-medium text-foreground">{restoreFile.name}</span>
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Nhập <code className="bg-slate-100 px-1.5 py-0.5 rounded text-amber-700 font-mono">RESTORE</code> để xác nhận
                        </label>
                        <Input
                            value={restoreConfirmText}
                            onChange={(e) => setRestoreConfirmText(e.target.value)}
                            placeholder="Nhập RESTORE..."
                            className="border-amber-200 focus-visible:ring-amber-400 font-mono"
                            disabled={isRestoring || isResetting || isBackingUp}
                        />
                    </div>

                    <Button
                        variant="outline"
                        className="w-full border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                        disabled={!canRestore || isRestoring || isResetting || isBackingUp}
                        onClick={() => setShowRestoreDialog(true)}
                    >
                        {isRestoring ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang khôi phục cơ sở dữ liệu...
                            </>
                        ) : (
                            <>
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Khôi phục từ bản sao lưu
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

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
                        disabled={!canConfirm || isResetting || isRestoring}
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

            <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-amber-700">
                            <ShieldAlert className="w-5 h-5" />
                            Xác nhận khôi phục cơ sở dữ liệu?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này sẽ chạy restore PostgreSQL từ file <strong>{restoreFile?.name}</strong>.
                            Dữ liệu hiện tại có thể bị ghi đè hoặc xóa theo nội dung bản sao lưu.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-amber-600 hover:bg-amber-700"
                            onClick={handleRestore}
                        >
                            Tôi hiểu, tiến hành khôi phục
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function getDownloadFilename(contentDisposition: string | null) {
    const fallback = `court-management-${new Date().toISOString().replace(/[:.]/g, '-')}.dump`
    if (!contentDisposition) return fallback

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
    if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1].replace(/["]/g, ''))

    const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
    return filenameMatch?.[1] || fallback
}
