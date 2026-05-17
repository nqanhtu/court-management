import 'dotenv/config';
import { db } from './lib/db';
import { parseExcelFile } from './lib/excel-parser';
import * as fs from 'fs';

async function run() {
    const buffer = fs.readFileSync('HS628.xlsx');
    const { files } = await parseExcelFile(buffer.buffer as ArrayBuffer);
    console.log(`Extracted ${files.length} rows from HS628.xlsx.`);

    let imported = 0;
    for (const f of files) {
        if (!f.code) continue;

        let boxId = null;
        if (f.boxCode) {
            let box = await db.storageBox.findUnique({
                where: { code: String(f.boxCode) }
            });
            if (!box) {
                box = await db.storageBox.create({
                    data: {
                        code: String(f.boxCode),
                        warehouse: 'Chưa xếp',
                        line: '-',
                        shelf: '-',
                        slot: '-',
                        boxNumber: String(f.boxCode),
                    }
                });
            }
            boxId = box.id;
        }

        try {
            const dbFile = await db.file.upsert({
                where: { code: f.code },
                update: {
                    title: f.title || 'Hồ sơ chưa có tiêu đề',
                    type: f.type || 'Không xác định',
                    year: f.year,
                    pageCount: f.pageCount,
                    retention: f.retention,
                    note: f.note,
                    indexCode: f.indexCode,
                    judgmentNumber: f.judgmentNumber,
                    judgmentDate: f.startDate,
                    datetime: f.startDate || new Date(`${f.year || new Date().getFullYear()}-01-01`),
                    defendants: f.defendants || [],
                    plaintiffs: f.plaintiffs || [],
                    civilDefendants: f.civilDefendants || [],
                    details: f.details as any,
                    boxId: boxId,
                },
                create: {
                    code: f.code,
                    title: f.title || 'Hồ sơ chưa có tiêu đề',
                    type: f.type || 'Không xác định',
                    year: f.year,
                    pageCount: f.pageCount,
                    retention: f.retention,
                    note: f.note,
                    indexCode: f.indexCode,
                    judgmentNumber: f.judgmentNumber,
                    judgmentDate: f.startDate,
                    datetime: f.startDate || new Date(`${f.year || new Date().getFullYear()}-01-01`),
                    defendants: f.defendants || [],
                    plaintiffs: f.plaintiffs || [],
                    civilDefendants: f.civilDefendants || [],
                    details: f.details as any,
                    boxId: boxId,
                    status: 'IN_STOCK',
                    isLocked: false
                }
            });
            imported++;
        } catch (err) {
            console.error(`Lỗi khi import hồ sơ ${f.code}:`, err);
        }
    }
    console.log(`Đã import xong ${imported}/${files.length} hồ sơ!`);
}

run();
