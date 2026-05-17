import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseExcelFile } from '@/lib/excel-parser'
import { getSession } from '@/lib/session'
import { requirePermission } from '@/lib/rbac'
import { createAuditLog } from '@/lib/services/audit-log'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        const denied = requirePermission(session, 'manageFiles');
        if (denied) return denied;

        const formData = await request.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
            return NextResponse.json({ error: 'Không tìm thấy file tải lên' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const { files } = await parseExcelFile(buffer);

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'Không có dữ liệu hợp lệ trong file Excel' }, { status: 400 });
        }

        const createdFiles = [];
        
        for (const f of files) {
            if (!f.code) continue; // Skip rows without code

            let boxId = null;
            if (f.boxCode) {
                let box = await db.storageBox.findUnique({
                    where: { code: f.boxCode }
                });
                if (!box) {
                    box = await db.storageBox.create({
                        data: {
                            code: f.boxCode,
                            warehouse: 'Chưa xếp',
                            line: '-',
                            shelf: '-',
                            slot: '-',
                            boxNumber: f.boxCode,
                        }
                    });
                }
                boxId = box.id;
            }

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
            createdFiles.push(dbFile);
        }

        await createAuditLog({
            action: 'CREATE',
            target: 'File',
            targetId: 'batch_import',
            userId: session?.id,
            detail: {
                count: createdFiles.length,
                type: 'Excel Import'
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: `Nhập thành công ${createdFiles.length} hồ sơ`,
            count: createdFiles.length 
        });

    } catch (error: any) {
        console.error('Error importing excel:', error);
        return NextResponse.json({ success: false, error: error.message || 'Lỗi hệ thống khi nhập Excel' }, { status: 500 });
    }
}
