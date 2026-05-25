'use client'

import { useRouter } from '@/src/lib/router'

import { ExcelUploadForm } from '@/components/forms/excel-upload-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function UploadPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto max-w-3xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Nhập liệu hồ sơ</CardTitle>
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
