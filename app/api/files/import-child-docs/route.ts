import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseChildDocumentsExcel } from '@/lib/excel-parser'
import { createAuditLog } from '@/lib/services/audit-log'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const session = await getSession()
        const formData = await request.formData()
        const file = formData.get('file') as File
        const fileId = formData.get('fileId') as string
        console.log(fileId)
        if (!file || !fileId) {
            return NextResponse.json({ error: 'Missing fileId or file' }, { status: 400 })
        }

        const buffer = await file.arrayBuffer()

        let documents;
        try {
            documents = await parseChildDocumentsExcel(buffer)
        } catch (e) {
            console.error('Parse error:', e)
            return NextResponse.json({ error: 'Failed to parse Excel file' }, { status: 400 })
        }

        if (documents.length === 0) {
            return NextResponse.json({ error: 'No data in file Excel' }, { status: 400 })
        }
        // console.log(fileId)
        const targetFile = await db.file.findUnique({
            where: {
                id: fileId,
            },
        })

        if (!targetFile) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        let successCount = 0;
        let failureCount = 0;
        const errors: string[] = [];

        for (const document of documents) {
            try {
                await db.document.create({
                    data: {
                        fileId: fileId,
                        code: document.code || null,
                        title: document.title || 'Untitled Document',
                        year: document.year,
                        pageCount: document.pageCount,
                        order: document.order,
                        note: document.note,
                        preservationTime: document.preservationTime,
                        contentIndex: document.contentIndex,
                    },
                })
                successCount++;
            } catch (error) {
                failureCount++;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                errors.push(`Row ${document.order}: ${errorMessage}`)
            }
        }

        await createAuditLog({
            action: 'UPLOAD',
            target: 'Document',
            targetId: fileId, // Using fileId as target since we created multiple docs under this file
            userId: session?.id,
            detail: {
                filename: file.name,
                total: documents.length,
                success: successCount,
                failed: failureCount,
                errors: errors.length > 0 ? errors : undefined
            }
        })

        return NextResponse.json({
            success: true,
            fileId: fileId,
            successCount: successCount,
            failureCount: failureCount,
            errors: errors
        })
    } catch (error) {
        console.error('Error uploading file:', error)
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }
}
