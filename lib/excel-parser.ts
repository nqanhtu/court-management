import * as XLSX from 'xlsx'
import { ExtractedFile, ExtractedDocument, ExtractedLocation, ImportData } from './types/excel'

export const parseExcelFile = async (buffer: ArrayBuffer): Promise<ImportData> => {
    const workbook = XLSX.read(buffer, { type: 'array' })

    // Validate Sheets
    // Assuming Sheet Names are standardized or we use index 0, 1, 2
    // Sheet 1: Thông tin hồ sơ
    // Sheet 2: Mục lục hồ sơ (Văn bản con)
    // Sheet 3: Vị trí lưu kho

    const sheetNames = workbook.SheetNames
    if (sheetNames.length < 3) {
        throw new Error('File Excel phải có ít nhất 3 Sheets theo cấu trúc quy định.')
    }

    const filesSheet = workbook.Sheets[sheetNames[0]]
    const docsSheet = workbook.Sheets[sheetNames[1]]
    const locSheet = workbook.Sheets[sheetNames[2]]

    // Parse Sheet 1: Files
    const rawFiles = XLSX.utils.sheet_to_json<Record<string, unknown>>(filesSheet)
    const files: ExtractedFile[] = rawFiles.map((row: Record<string, unknown>) => ({
        code: row['Mã hồ sơ'] as string,
        title: (row['Tiêu đề'] || row['Tên hồ sơ']) as string,
        type: row['Loại án'] as string,
        year: parseYear(row['Thời gian']),
        pageCount: parseInt((row['Số tờ'] as string) || '0'),
        retention: row['Thời hạn bảo quản'] as string,
        boxCode: row['Hộp số'] as string, // Need to ensure this maps to Location Sheet
        details: {
            summary: row['Về việc'],
            defendants: row['Bị cáo'] ? (row['Bị cáo'] as string).split(',').map((s: string) => s.trim()) : [],
            plaintiffs: row['Nguyên đơn'] ? (row['Nguyên đơn'] as string).split(',').map((s: string) => s.trim()) : [],
            judgmentDate: row['Ngày'] ? new Date(row['Ngày'] as string | number) : null
        },
        startDate: row['Ngày'] ? new Date(row['Ngày'] as string | number) : undefined,
    }))

    // Parse Sheet 2: Documents
    const rawDocs = XLSX.utils.sheet_to_json<Record<string, unknown>>(docsSheet)
    const documents: ExtractedDocument[] = rawDocs.map((row: Record<string, unknown>, index: number) => ({
        fileCode: row['Mã hồ sơ'] as string,
        code: row['Mã hồ sơ con'] as string,
        title: row['Tiêu đề'] as string,
        pageCount: parseInt((row['Số tờ'] as string) || '0'),
        year: parseInt((row['Thời gian'] as string) || '0'),
        order: index + 1
    }))

    // Parse Sheet 3: Locations/Boxes
    const rawLocs = XLSX.utils.sheet_to_json<Record<string, unknown>>(locSheet)
    // Expected columns: Mã kho, Dãy, Giá, Ngăn, Hộp (or constructed code)
    // The user prompt example: K01-D02-G05-N03-H012
    const boxes: ExtractedLocation[] = rawLocs.map((row: Record<string, unknown>) => {
        // Assuming the Excel has these columns or we construct from components
        // Map raw columns to our structure
        // Adjust these keys based on actual Excel headers if known, otherwise assume standard
        const warehouse = (row['Kho'] || row['Mã kho'] || 'K01') as string
        const line = (row['Dãy'] || 'D01') as string
        const shelf = (row['Giá'] || 'G01') as string
        const slot = (row['Ngăn'] || 'N01') as string
        const boxNumber = (row['Hộp'] || row['Hộp số'] || 'H01') as string

        const fullCode = `${warehouse}-${line}-${shelf}-${slot}-${boxNumber}`

        return {
            warehouse,
            line,
            shelf,
            slot,
            boxNumber,
            fullCode
        }
    })

    return { files, documents, boxes }
}

function parseYear(dateStr: unknown): number {
    if (typeof dateStr === 'number') return dateStr
    if (!dateStr) return new Date().getFullYear()
    const date = new Date(dateStr as string | number)
    if (!isNaN(date.getTime())) return date.getFullYear()
    // Try regex for YYYY
    const match = dateStr.toString().match(/\d{4}/)
    return match ? parseInt(match[0]) : new Date().getFullYear()
}
