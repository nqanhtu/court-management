import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { createAuditLog } from '@/lib/services/audit-log'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const session = await getSession();
        if (!session || session.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const data = await request.json();
        
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.startDate) updateData.startDate = new Date(data.startDate);
        if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

        const agency = await db.agencyHistory.update({
            where: { id },
            data: updateData,
        });

        await createAuditLog({
            action: 'UPDATE',
            target: 'AgencyHistory',
            targetId: agency.id,
            userId: session.id,
            detail: updateData
        });

        return NextResponse.json(agency);
    } catch (error) {
        console.error('Error updating agency:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const session = await getSession();
        if (!session || session.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Check if there are related boxes before deleting
        const relatedBoxes = await db.storageBox.count({
            where: { agencyId: id }
        });

        if (relatedBoxes > 0) {
            return NextResponse.json({ 
                error: 'Cannot delete agency with associated storage boxes. Please reassign or delete the boxes first.' 
            }, { status: 400 });
        }

        const agency = await db.agencyHistory.delete({
            where: { id },
        });

        await createAuditLog({
            action: 'DELETE',
            target: 'AgencyHistory',
            targetId: agency.id,
            userId: session.id,
            detail: { name: agency.name }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting agency:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
