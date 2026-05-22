'use client';

import { apiFetch } from '@/lib/api/client';

import { useState } from 'react'
import { useRouter } from '@/src/lib/router'
import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader2, UploadCloud } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ExcelImportPreview } from '@/lib/validation/import'
import { queryClient } from '@/src/lib/query-client'
import { queryKeys } from '@/src/lib/query-keys'

interface ExcelUploadFormProps {
  onSuccess: () => void
}

type ApiResult<T> = {
  success: boolean
  data?: T
  message?: string
  errors?: unknown
}

export function ExcelUploadForm({ onSuccess }: ExcelUploadFormProps) {
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ExcelImportPreview | null>(null)
  const router = useRouter()

  const buildFormData = () => {
    const formData = new FormData()
    if (file) formData.append('file', file)
    return formData
  }

  const handlePreview = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!file) {
      toast.error('Vui lòng chọn file Excel')
      return
    }

    setIsPreviewing(true)
    setPreview(null)

    try {
      const response = await apiFetch('/api/upload/excel/preview', {
        method: 'POST',
        body: buildFormData(),
      })
      const result: ApiResult<ExcelImportPreview> = await response.json()

      if (response.ok && result.success && result.data) {
        setPreview(result.data)
        if (result.data.summary.errors > 0) {
          toast.warning(`File có ${result.data.summary.errors} lỗi cần xử lý trước khi nhập`)
        } else {
          toast.success('File hợp lệ, có thể nhập dữ liệu')
        }
        return
      }

      toast.error(result.message || 'Không thể kiểm tra file Excel')
    } catch {
      toast.error('Có lỗi xảy ra khi kiểm tra file')
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleCommit = async () => {
    if (!file || !preview || preview.summary.errors > 0) return

    setIsCommitting(true)
    try {
      const response = await apiFetch('/api/upload/excel/commit', {
        method: 'POST',
        body: buildFormData(),
      })
      const result: ApiResult<{ stats: { success: number; failure: number } }> = await response.json()

      if (response.ok && result.success) {
        toast.success(`Đã nhập ${result.data?.stats.success ?? 0} hồ sơ`)
        queryClient.invalidateQueries({ queryKey: queryKeys.files.all })
        queryClient.invalidateQueries({ queryKey: queryKeys.boxes.all })
        onSuccess()
        router.refresh()
        return
      }

      toast.error(result.message || 'Nhập dữ liệu thất bại')
    } catch {
      toast.error('Có lỗi xảy ra khi nhập dữ liệu')
    } finally {
      setIsCommitting(false)
    }
  }

  return (
    <form onSubmit={handlePreview} className="space-y-4 py-4">
      <div
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors hover:bg-muted/50"
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <UploadCloud className="mb-4 h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-medium">Bấm để chọn file hoặc kéo thả</p>
        <p className="mt-1 text-xs text-muted-foreground">Hỗ trợ .xlsx, .xls</p>
        <input
          id="file-upload"
          type="file"
          accept=".xlsx, .xls"
          className="hidden"
          onChange={(event) => {
            setFile(event.target.files?.[0] || null)
            setPreview(null)
          }}
        />
      </div>

      {file && (
        <div className="flex items-center gap-2 rounded-md bg-muted p-2 text-sm">
          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">Tệp đã chọn:</span>
          <span className="truncate">{file.name}</span>
        </div>
      )}

      {preview && (
        <div className="space-y-3 rounded-md border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{preview.summary.files} hồ sơ</Badge>
            <Badge variant="secondary">{preview.summary.documents} văn bản</Badge>
            <Badge variant="secondary">{preview.summary.boxes} hộp</Badge>
            {preview.summary.errors > 0 ? (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3" />
                {preview.summary.errors} lỗi
              </Badge>
            ) : (
              <Badge className="bg-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                Sẵn sàng nhập
              </Badge>
            )}
          </div>

          {preview.issues.length > 0 ? (
            <div className="max-h-56 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dòng</TableHead>
                    <TableHead>Cột</TableHead>
                    <TableHead>Mã hồ sơ</TableHead>
                    <TableHead>Lỗi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.issues.map((issue, index) => (
                    <TableRow key={`${issue.row}-${issue.column}-${index}`}>
                      <TableCell>{issue.row}</TableCell>
                      <TableCell>{issue.column}</TableCell>
                      <TableCell>{issue.code || '-'}</TableCell>
                      <TableCell>{issue.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Đã kiểm tra {preview.summary.files} hồ sơ. Bấm xác nhận để nhập dữ liệu vào hệ thống.
            </div>
          )}
        </div>
      )}

      <DialogFooter>
        <Button type="submit" variant="outline" disabled={isPreviewing || !file}>
          {isPreviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Kiểm tra file
        </Button>
        <Button
          type="button"
          disabled={!preview || preview.summary.errors > 0 || isCommitting}
          onClick={handleCommit}
        >
          {isCommitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Xác nhận nhập
        </Button>
      </DialogFooter>
    </form>
  )
}
