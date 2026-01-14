import * as XLSX from 'xlsx'
import * as fs from 'fs'

const filePath = 'Chỉnh lý.xlsx'
const buffer = fs.readFileSync(filePath)
const workbook = XLSX.read(buffer, { type: 'buffer' })

console.log('Sheet Names:', workbook.SheetNames)

workbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- Sheet: ${sheetName} ---`)
    const sheet = workbook.Sheets[sheetName]
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
    if (json.length > 0) {
        console.log('Headers:', json[0])
        console.log('First 2 rows:', json.slice(1, 3))
    } else {
        console.log('Empty Sheet')
    }
})
