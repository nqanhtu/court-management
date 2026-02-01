
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/services/audit-log'
import { getSession } from '@/lib/session'

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
         if (!session) {
             return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
         }
        const userId = session.id;

        const data = await request.json();
        const { fileId, ...rest } = data;

        const newDoc = await db.document.create({
            data: {
                fileId,
                title: rest.title,
                code: rest.code,
                year: rest.year,
                pageCount: rest.pageCount,
                order: rest.order || 0,
                note: rest.note,
                preservationTime: rest.preservationTime,
                contentIndex: rest.contentIndex
            }
        });

        await createAuditLog({
            action: 'CREATE',
            target: 'Document',
            targetId: newDoc.id,
            detail: { title: newDoc.title, fileId },
            userId: userId
        });

        return NextResponse.json({ success: true, data: newDoc });
    } catch (error) {
        console.error('Create document error:', error);
        return NextResponse.json({ success: false, message: 'Failed to create document' }, { status: 500 });
    }
}
