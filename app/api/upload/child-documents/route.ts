
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseChildDocumentsExcel } from '@/lib/excel-parser'
import { createAuditLog } from '@/lib/services/audit-log'
import { getSession } from '@/lib/session'

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.id;

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const fileId = formData.get('fileId') as string;

        if (!file) {
            return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
        }
        // Note: The original action took `fileId` as an argument. 
        // Here we expect it in the formdata along with the file.
        if (!fileId) {
            return NextResponse.json({ success: false, message: 'Missing fileId' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const documents = await parseChildDocumentsExcel(buffer);

        if (documents.length === 0) {
            return NextResponse.json({ success: false, message: 'File Excel không có dữ liệu' }, { status: 400 });
        }

        // Validate target file exists
        const targetFile = await db.file.findUnique({
            where: { id: fileId }
        })

        if (!targetFile) {
            return NextResponse.json({ success: false, message: 'Hồ sơ không tồn tại' }, { status: 404 });
        }

        let successCount = 0;
        let failureCount = 0;
        const errors: string[] = [];

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
                successCount++;
            } catch (e: unknown) {
                failureCount++;
                const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                errors.push(`Row ${doc.order}: ${errorMessage}`);
            }
        }

        if (successCount > 0) {
            await createAuditLog({
                action: 'UPDATE',
                target: 'File',
                targetId: fileId,
                detail: { action: 'Import Child Documents', count: successCount },
                userId: userId
            })
        }

        return NextResponse.json({
            success: true,
            stats: { success: successCount, failure: failureCount },
            errors
        });

    } catch (error) {
        console.error('Upload documents error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}
