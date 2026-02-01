
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/services/audit-log'
import { getSession } from '@/lib/session'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const session = await getSession();
         if (!session) {
             return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
         }
        const userId = session.id;

        const data = await request.json();
        // data contains updated fields. Check if fileId is needed? 
        // updateDocument in action didn't use fileId for update, but passed it for revalidatePath presumably?
        // Actually, updateDocument checks if (!data.id).
        // Here ID is in params.

        const { fileId, ...rest } = data; 
        // fileId might be passed to logging? Or just ignored. 
        // The original action signature was `DocumentFormData` which included `fileId`.

        const updatedDoc = await db.document.update({
            where: { id },
            data: {
                title: rest.title,
                code: rest.code,
                year: rest.year,
                pageCount: rest.pageCount,
                order: rest.order,
                note: rest.note,
                preservationTime: rest.preservationTime,
                contentIndex: rest.contentIndex
            }
        });

        await createAuditLog({
            action: 'UPDATE',
            target: 'Document',
            targetId: updatedDoc.id,
            detail: { title: updatedDoc.title },
            userId: userId
        });

        return NextResponse.json({ success: true, data: updatedDoc });
    } catch (error) {
        console.error('Update document error:', error);
        return NextResponse.json({ success: false, message: 'Failed to update document' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
     try {
        const session = await getSession();
         if (!session) {
             return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
         }
        const userId = session.id;
        
        // We need fileId for the audit log detail in original action?
        // "detail: { title: deletedDoc.title, fileId }"
        // We can get fileId from the doc before deleting or from query param?
        // Or fetch doc first.
        
        const docToDelete = await db.document.findUnique({ where: { id }, select: { title: true, fileId: true } });
        if (!docToDelete) {
             return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });
        }

        const deletedDoc = await db.document.delete({
            where: { id }
        });

        await createAuditLog({
            action: 'DELETE',
            target: 'Document',
            targetId: id,
            detail: { title: docToDelete.title, fileId: docToDelete.fileId },
            userId: userId
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete document error:', error);
        return NextResponse.json({ success: false, message: 'Failed to delete document' }, { status: 500 });
    }
}
