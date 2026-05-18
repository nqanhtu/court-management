import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { createAuditLog } from '@/lib/services/audit-log'
import { requirePermission } from '@/lib/rbac'
import type { Prisma } from '@/generated/prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const denied = requirePermission(session, 'viewStorage');
        if (denied) return denied;

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const yearParam = searchParams.get('year');
        const year = yearParam ? Number(yearParam) : null;

        const where: Prisma.StorageBoxWhereInput = {};

        if (year) {
            where.year = year;
        }

        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { warehouse: { contains: search, mode: 'insensitive' } },
                { line: { contains: search, mode: 'insensitive' } },
                { shelf: { contains: search, mode: 'insensitive' } },
                { slot: { contains: search, mode: 'insensitive' } },
                { boxNumber: { contains: search, mode: 'insensitive' } },
            ];
        }

        const boxes = await db.storageBox.findMany({
            where,
            include: {
                agency: true,
                _count: {
                    select: { files: true }
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(boxes);
    } catch (error) {
        console.error('Error fetching storage boxes:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
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

        // Check if code is unique
        const existing = await db.storageBox.findUnique({
            where: { code: data.code.trim() }
        });

        if (existing) {
            return NextResponse.json({ error: 'Mã hộp lưu trữ đã tồn tại trên hệ thống.' }, { status: 400 });
        }

        const box = await db.storageBox.create({
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
            action: 'CREATE',
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
        console.error('Error creating storage box:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
