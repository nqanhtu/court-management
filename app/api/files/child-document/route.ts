import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/services/audit-log'
import { getSession } from '@/lib/actions/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        const body = await request.json()

        // Validate required fields
        if (!body.fileId || !body.title) {
            return NextResponse.json(
                { error: 'Missing required fields: fileId and title are required' },
                { status: 400 }
            )
        }

        // Verify parent file exists
        const parentFile = await db.file.findUnique({
            where: { id: body.fileId }
        })

        if (!parentFile) {
            return NextResponse.json(
                { error: 'Parent file not found' },
                { status: 404 }
            )
        }

        // Create the child document
        const newDoc = await db.document.create({
            data: {
                fileId: body.fileId,
                title: body.title,
                code: body.code,
                year: body.year,
                pageCount: body.pageCount,
                order: body.order,
                contentIndex: body.contentIndex || body.indexCode, // Handle both potential field names
                preservationTime: body.preservationTime,
                note: body.note,
            }
        })

        await createAuditLog({
            action: 'CREATE',
            target: 'Document',
            targetId: newDoc.id,
            userId: session?.id,
            detail: {
                fileId: body.fileId,
                title: body.title,
                code: body.code
            }
        })

        return NextResponse.json({ success: true, document: newDoc }, { status: 201 })
    } catch (error) {
        console.error('Error creating child document:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getSession()
        const body = await request.json()

        const updatedDoc = await db.document.update({
            where: { id: body.id },
            data: {
                title: body.title,
                code: body.code,
                year: body.year,
                pageCount: body.pageCount,
                order: body.order,
                contentIndex: body.contentIndex || body.indexCode,
                preservationTime: body.preservationTime,
                note: body.note,
            }
        })

        await createAuditLog({
            action: 'UPDATE',
            target: 'Document',
            targetId: updatedDoc.id,
            userId: session?.id,
            detail: {
                changes: body
            }
        })

        return NextResponse.json({ success: true, document: updatedDoc }, { status: 200 })
    } catch (error) {
        console.error('Error updating child document:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}