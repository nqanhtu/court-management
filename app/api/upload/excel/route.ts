
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseExcelFile } from '@/lib/excel-parser'
import { createAuditLog } from '@/lib/services/audit-log'
import { getAgencyForYear } from '@/lib/services/agency-history'
import { getSession } from '@/lib/session'
import type { Prisma } from '@/generated/prisma/client'

export const maxDuration = 300; // Increase max duration for large uploads

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.id;

        const formData = await request.formData();
        const file = formData.get('file') as File;
        if (!file) {
            return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const { files, documents, boxes } = await parseExcelFile(buffer);

        // Check for duplicate codes within the Excel file itself
        const incomingCodes = files.map(f => f.code);
        const uniqueIncomingCodes = new Set(incomingCodes);
        if (uniqueIncomingCodes.size !== incomingCodes.length) {
            const duplicates = incomingCodes.filter((item, index) => incomingCodes.indexOf(item) !== index);
            return NextResponse.json({
                success: false,
                message: `File Excel chứa các mã hồ sơ trùng lặp: ${Array.from(new Set(duplicates)).join(', ')}`
            }, { status: 400 });
        }

        // Check for duplicate codes existing in the Database
        const existingFiles = await db.file.findMany({
            where: {
                code: { in: incomingCodes }
            },
            select: { code: true }
        });

        if (existingFiles.length > 0) {
            const existingCodes = existingFiles.map(f => f.code);
            return NextResponse.json({
                success: false,
                message: `Hệ thống đã tồn tại các mã hồ sơ sau: ${existingCodes.join(', ')}. Vui lòng kiểm tra lại và không đè dữ liệu.`
            }, { status: 409 });
        }

        // 1. Upsert Boxes and determine Agency
        for (const box of boxes) {
            // Find a representing year for this box from the files in it
            const filesInBox = files.filter(f => f.boxCode === box.boxNumber || f.boxCode === `H${box.boxNumber}`);
            let agencyId: string | undefined = undefined;

            if (filesInBox.length > 0) {
                // Pick the first file's year (usually files in a box are from the same year)
                const targetYear = filesInBox[0].year;
                const agency = await getAgencyForYear(targetYear);
                agencyId = agency?.id;
            }

            await db.storageBox.upsert({
                where: { code: box.fullCode },
                update: {
                    agencyId: agencyId || undefined
                },
                create: {
                    code: box.fullCode,
                    warehouse: box.warehouse,
                    line: box.line,
                    shelf: box.shelf,
                    slot: box.slot,
                    boxNumber: box.boxNumber,
                    agencyId: agencyId || undefined
                }
            })
        }

        // 2. Create Files
        let successCount = 0;
        let failureCount = 0;
        const errors: string[] = [];

        for (const fileData of files) {
            // Find box code from the 'boxes' array we just processed
            const matchingBox = boxes.find(b => b.boxNumber === fileData.boxCode || b.boxNumber === `H${fileData.boxCode}`)
            const boxConnect = matchingBox ? { connect: { code: matchingBox.fullCode } } : undefined

            try {
                const createdFile = await db.file.create({
                    data: {
                        code: fileData.code,
                        title: fileData.title,
                        type: fileData.type,
                        year: fileData.year,
                        datetime: fileData.startDate || new Date(fileData.year, 0, 1),
                        pageCount: fileData.pageCount,
                        retention: fileData.retention,
                        judgmentDate: fileData.startDate,
                        details: fileData.details as Prisma.InputJsonValue,
                        isLocked: true, 
                        note: fileData.note,
                        indexCode: fileData.indexCode, // MLHS
                        judgmentNumber: fileData.judgmentNumber,
                        defendants: fileData.defendants,
                        plaintiffs: fileData.plaintiffs,
                        civilDefendants: fileData.civilDefendants,
                        box: boxConnect,
                        documents: {
                            create: documents
                                .filter(d => d.fileCode === fileData.code)
                                .map(d => ({
                                    title: d.title,
                                    code: d.code,
                                    year: d.year,
                                    pageCount: d.pageCount,
                                    order: d.order
                                }))
                        }
                    }
                })
                successCount++;

                await createAuditLog({
                    action: 'CREATE',
                    target: 'File',
                    targetId: createdFile.id,
                    detail: { code: createdFile.code, source: 'Excel Upload' },
                    userId: userId
                })

            } catch (e: unknown) {
                failureCount++;
                const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                errors.push(`Failed to import file ${fileData.code}: ${errorMessage}`);
            }
        }

        return NextResponse.json({
            success: true,
            stats: { success: successCount, failure: failureCount },
            errors
        });

    } catch (error: unknown) {
        console.error('Upload error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}
