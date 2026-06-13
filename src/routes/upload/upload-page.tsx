'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from '@/src/lib/router'
import { ExcelUploadForm } from '@/components/forms/excel-upload-form'
import { CaseFileForm } from '@/components/forms/case-file-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileSpreadsheet } from 'lucide-react'
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

export default function UploadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'manual-entry'
  
  const [isDirty, setIsDirty] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const handleBack = () => {
    if (isDirty) {
      setShowExitConfirm(true)
    } else {
      router.push('/')
    }
  }

  const handleConfirmExit = () => {
    setIsDirty(false)
    setShowExitConfirm(false)
    router.push('/')
  }

  if (mode === 'excel') {
    return (
      <div className="container mx-auto max-w-3xl py-10 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="space-y-1">
            <button
              onClick={() => router.push('/upload?mode=manual-entry')}
              className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Quay lại nhập thủ công
            </button>
            <h1 className="text-2xl font-bold tracking-tight">Nhập file Excel</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nhập từ file Excel</CardTitle>
            <CardDescription>
              Kiểm tra file Excel trước khi nhập để phát hiện lỗi dòng/cột, mã trùng và dữ liệu thiếu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExcelUploadForm onSuccess={() => router.push('/')} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl py-4 space-y-4">
      {/* Top area */}
      <div className="flex items-center justify-between border-b pb-3">
        <span className="text-sm font-semibold text-muted-foreground">Nhập hồ sơ thủ công</span>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (isDirty) {
                setShowExitConfirm(true)
              } else {
                router.push('/upload?mode=excel')
              }
            }}
            className="gap-2 h-8"
            size="sm"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Nhập từ Excel
          </Button>
        </div>
      </div>

      {/* Main form */}
      <CaseFileForm
        onSuccess={(fileId, action) => {
          if (action === 'save_and_add_child' && fileId) {
            router.push(`/files/${fileId}`)
          } else if (action === 'save') {
            router.push('/')
          }
        }}
        onCancel={handleBack}
        isDirty={isDirty}
        setIsDirty={setIsDirty}
      />

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận rời khỏi trang?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có các thay đổi chưa lưu. Nếu rời đi, toàn bộ thông tin đã nhập sẽ bị mất.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowExitConfirm(false)}>Hủy</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmExit}>Rời khỏi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
