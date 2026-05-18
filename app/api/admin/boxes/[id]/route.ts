import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { createAuditLog } from '@/lib/services/audit-log'

export async function PUT(
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

        // Validate required fields
        const required = ['warehouse', 'line', 'shelf', 'slot', 'boxNumber', 'code'];
        for (const field of required) {
            if (!data[field]) {
                return NextResponse.json({ error: `${field} is required` }, { status: 400 });
            }
        }

        // Check if code is unique (excluding current box)
        const existing = await db.storageBox.findFirst({
            where: {
                code: data.code.trim().toUpperCase(),
                NOT: { id }
            }
        });

        if (existing) {
            return NextResponse.json({ error: 'Mã hộp lưu trữ đã tồn tại trên hệ thống.' }, { status: 400 });
        }

        const box = await db.storageBox.update({
            where: { id },
            data: {
                warehouse: data.warehouse.trim(),
                line: data.line.trim(),
                shelf: data.shelf.trim(),
                slot: data.slot.trim(),
                boxNumber: data.boxNumber.trim(),
                code: data.code.trim().toUpperCase(),
                agencyId: data.agencyId || null,
                caseType: data.caseType ? data.caseType.trim() : null,
                year: data.year ? Number(data.year) : null,
                fromFileCode: data.fromFileCode ? data.fromFileCode.trim() : null,
                toFileCode: data.toFileCode ? data.toFileCode.trim() : null,
                retention: data.retention ? data.retention.trim() : null,
            },
            include: {
                agency: true,
                _count: {
                    select: { files: true }
                }
            }
        });

        await createAuditLog({
            action: 'UPDATE',
            target: 'StorageBox',
            targetId: box.id,
            userId: session.id,
            detail: {
                code: box.code,
                location: `${box.warehouse}-${box.line}-${box.shelf}-${box.slot}-${box.boxNumber}`,
                agency: box.agency?.name,
                year: box.year,
            }
        });

        return NextResponse.json(box);
    } catch (error) {
        console.error('Error updating storage box:', error);
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

        // Check if there are files in this box
        const filesCount = await db.file.count({
            where: { boxId: id }
        });

        if (filesCount > 0) {
            return NextResponse.json({
                error: `Không thể xóa hộp lưu trữ. Hộp hiện đang chứa ${filesCount} hồ sơ. Vui lòng di chuyển các hồ sơ này sang hộp khác trước khi thực hiện xóa.`
            }, { status: 400 });
        }

        // Delete associated StorageBoxLabel records first
        await db.storageBoxLabel.deleteMany({
            where: { storageBoxId: id }
        });

        const box = await db.storageBox.delete({
            where: { id },
        });

        await createAuditLog({
            action: 'DELETE',
            target: 'StorageBox',
            targetId: box.id,
            userId: session.id,
            detail: {
                code: box.code,
                location: `${box.warehouse}-${box.line}-${box.shelf}-${box.slot}-${box.boxNumber}`,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting storage box:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
