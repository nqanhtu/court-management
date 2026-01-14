import * as XLSX from 'xlsx'
import * as fs from 'fs'

const filePath = 'Chỉnh lý.xlsx'
const buffer = fs.readFileSync(filePath)
const workbook = XLSX.read(buffer, { type: 'buffer' })
const sheet = workbook.Sheets['Phần mềm']

if (sheet) {
    const json = XLSX.utils.sheet_to_json<unknown[][]>(sheet, { header: 1, defval: '' })
    // Skip to header row (row index 2 based on previous output)
    const rows = json.slice(3) // Start from row 4 (index 3) assuming header is row 3

    console.log('--- Requirements List ---')
    rows.forEach((row) => {
        const stt = row[0]
        const req = row[1]
        const detail = row[3]
        if (stt || req || detail) {
            console.log(`#${stt} ${req}: ${detail}`)
        }
    })
} else {
    console.log('Sheet "Phần mềm" not found')
}
