import { NextRequest } from 'next/server'
import { getSession } from '@/lib/session'
import { requirePermission } from '@/lib/rbac'
import { apiError, apiSuccess } from '@/lib/api-response'
import { commitExcelImport, parseExcelUpload } from '@/lib/services/excel-import'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const denied = requirePermission(session, 'manageFiles')
    if (denied) return denied

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return apiError('Vui lòng chọn file Excel', 400)
    }

    const payload = await parseExcelUpload(file)
    const result = await commitExcelImport(payload, session!.id)

    if (!result.success) {
      return apiError('File Excel còn lỗi, chưa thể nhập dữ liệu', 422, result.preview.issues)
    }

    return apiSuccess({ stats: result.stats, preview: result.preview }, 'Nhập dữ liệu thành công')
  } catch (error) {
    console.error('Excel commit error:', error)
    const message = error instanceof Error ? error.message : 'Không thể nhập dữ liệu Excel'
    return apiError(message, 500)
  }
}
