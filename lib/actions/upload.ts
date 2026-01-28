'use server'

import { db } from '@/lib/db'
// ... existing imports
import { parseExcelFile, parseChildDocumentsExcel } from '@/lib/excel-parser'
// ... (rest of imports)

// ... (existing uploadExcel function)

export async function uploadChildDocuments(fileId: string, formData: FormData) {
    try {
        const session = await getSession();
        if (!session) {
            return { success: false, message: 'Unauthorized' };
        }
        const userId = (session as User).id;

        const file = formData.get('file') as File
        if (!file) {
            return { success: false, message: 'No file uploaded' }
        }

        const buffer = await file.arrayBuffer()
        const documents = await parseChildDocumentsExcel(buffer)

        if (documents.length === 0) {
            return { success: false, message: 'File Excel không có dữ liệu' }
        }

        // Validate target file exists
        const targetFile = await db.file.findUnique({
            where: { id: fileId }
        })

        if (!targetFile) {
            return { success: false, message: 'Hồ sơ không tồn tại' }
        }

        let successCount = 0
        let failureCount = 0
        const errors: string[] = []

        for (const doc of documents) {
            try {
                await db.document.create({
                    data: {
                        fileId: fileId,
                        code: doc.code,
                        title: doc.title || 'Văn bản',
                        year: doc.year,
                        pageCount: doc.pageCount,
                        order: doc.order,
                        note: doc.note,
                        preservationTime: doc.preservationTime,
                        contentIndex: doc.contentIndex
                    }
                })
                successCount++
            } catch (e: unknown) {
                failureCount++
                const errorMessage = e instanceof Error ? e.message : 'Unknown error'
                errors.push(`Row ${doc.order}: ${errorMessage}`)
            }
        }

        if (successCount > 0) {
            await createAuditLog({
                action: 'UPDATE',
                target: 'File',
                targetId: fileId,
                detail: { action: 'Import Child Documents', count: successCount },
                userId: userId as string
            })
        }

        return {
            success: true,
            stats: { success: successCount, failure: failureCount },
            errors
        }

    } catch (error) {
        console.error('Upload documents error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, message: errorMessage }
    }
}
import { createAuditLog } from '@/lib/services/audit-log'
import { getAgencyForYear } from '@/lib/services/agency-history'
import type { Prisma } from '@/app/generated/prisma/client'
import type { User } from '@/lib/types/user'

import { getSession } from './auth'

export async function uploadExcel(formData: FormData) {
    try {
        const session = await getSession();
        if (!session) {
            return { success: false, message: 'Unauthorized' };
        }
        const userId = (session as User).id;

        const file = formData.get('file') as File
        if (!file) {
            return { success: false, message: 'No file uploaded' }
        }

        const buffer = await file.arrayBuffer()
        const { files, documents, boxes } = await parseExcelFile(buffer)

        // Check for duplicate codes within the Excel file itself
        const incomingCodes = files.map(f => f.code);
        const uniqueIncomingCodes = new Set(incomingCodes);
        if (uniqueIncomingCodes.size !== incomingCodes.length) {
            const duplicates = incomingCodes.filter((item, index) => incomingCodes.indexOf(item) !== index);
            return {
                success: false,
                message: `File Excel chứa các mã hồ sơ trùng lặp: ${Array.from(new Set(duplicates)).join(', ')}`
            };
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
            return {
                success: false,
                message: `Hệ thống đã tồn tại các mã hồ sơ sau: ${existingCodes.join(', ')}. Vui lòng kiểm tra lại và không đè dữ liệu.`
            };
        }

        // 1. Upsert Boxes
        // Proceed only if no duplicates found
        // Upsert Boxes and determine Agency
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
        let successCount = 0
        let failureCount = 0
        const errors: string[] = []

        for (const fileData of files) {
            // Find the box to link
            // The File Sheet has 'Hộp số', which roughly maps to 'boxNumber' or partial code?
            // The prompt says: Sheet 1 'Hộp số' ... Sheet 3 'Hộp'
            // We need to match Sheet 1's Box Ref to Sheet 3's Box Code efficiently.
            // For simplicity here, we'll try to find a box that ends with the 'Hộp số' or match exactly if provided.
            // Assuming Sheet 1 'Hộp số' is just the Box Number (e.g. '12' or 'H012') 
            // AND we rely on the specific format from Sheet 3 to define the unique box.
            // Ideally, Sheet 1 should have the FULL Location Code to link accurately.
            // If not, we might pick the first box that matches the number? 
            // Let's assume for this MVP that the Sheet 1 'Hộp số' matches the 'boxNumber' in Sheet 3 
            // OR Sheet 3 defines the *current context* of boxes being uploaded.

            // Better strategy: Since Sheet 3 defines the location, we can probably link by the generated FullCode
            // if Sheet 1 also had that. But Sheet 1 only has "Hộp số".
            // Let's search for a StorageBox created in this batch (from 'boxes') that matches.

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
                        datetime: fileData.startDate || new Date(fileData.year, 0, 1), // Fallback to Jan 1st of year if no specific date
                        pageCount: fileData.pageCount,
                        retention: fileData.retention,
                        judgmentDate: fileData.startDate,
                        details: fileData.details as Prisma.InputJsonValue,
                        isLocked: true, // Lock immediately upon import per requirement
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
                successCount++

                await createAuditLog({
                    action: 'CREATE',
                    target: 'File',
                    targetId: createdFile.id,
                    detail: { code: createdFile.code, source: 'Excel Upload' },
                    userId: userId as string
                })

            } catch (e: unknown) {
                failureCount++
                const errorMessage = e instanceof Error ? e.message : 'Unknown error'
                errors.push(`Failed to import file ${fileData.code}: ${errorMessage}`)
            }
        }

        return {
            success: true,
            stats: { success: successCount, failure: failureCount },
            errors
        }

    } catch (error: unknown) {
        console.error('Upload error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, message: errorMessage }
    }
}
