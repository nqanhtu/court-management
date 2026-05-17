import { NextRequest } from 'next/server'
import { getSession } from '@/lib/session'
import { requirePermission } from '@/lib/rbac'
import { apiError, apiSuccess } from '@/lib/api-response'
import { parseExcelUpload, previewExcelImport } from '@/lib/services/excel-import'

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
    const preview = await previewExcelImport(payload)

    return apiSuccess(preview)
  } catch (error) {
    console.error('Excel preview error:', error)
    const message = error instanceof Error ? error.message : 'Không thể đọc file Excel'
    return apiError(message, 500)
  }
}
