'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getSession } from './auth'
import { User } from '@/lib/types/user'
import { createAuditLog } from '@/lib/services/audit-log'

export interface DocumentFormData {
    id?: string
    fileId: string
    title: string
    code?: string
    year?: number
    pageCount?: number
    order?: number
    note?: string
    preservationTime?: string
    contentIndex?: string
}

export async function createDocument(data: DocumentFormData) {
    try {
        const session = await getSession();
        if (!session) {
            return { success: false, message: 'Unauthorized' };
        }
        const userId = (session as User).id;

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
            userId: userId as string
        });

        revalidatePath(`/files/${fileId}`);
        return { success: true, data: newDoc };
    } catch (error) {
        console.error('Create document error:', error);
        return { success: false, message: 'Failed to create document' };
    }
}

export async function updateDocument(data: DocumentFormData) {
    try {
        const session = await getSession();
        if (!session) {
            return { success: false, message: 'Unauthorized' };
        }
        const userId = (session as User).id;

        if (!data.id) return { success: false, message: 'Document ID required for update' };

        const { id, fileId, ...rest } = data;

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
            userId: userId as string
        });

        revalidatePath(`/files/${fileId}`);
        return { success: true, data: updatedDoc };
    } catch (error) {
        console.error('Update document error:', error);
        return { success: false, message: 'Failed to update document' };
    }
}

export async function deleteDocument(id: string, fileId: string) {
    try {
        const session = await getSession();
        if (!session) {
            return { success: false, message: 'Unauthorized' };
        }
        const userId = (session as User).id;

        const deletedDoc = await db.document.delete({
            where: { id }
        });

        await createAuditLog({
            action: 'DELETE',
            target: 'Document',
            targetId: id,
            detail: { title: deletedDoc.title, fileId },
            userId: userId as string
        });

        revalidatePath(`/files/${fileId}`);
        return { success: true };
    } catch (error) {
        console.error('Delete document error:', error);
        return { success: false, message: 'Failed to delete document' };
    }
}
