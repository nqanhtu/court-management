import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { createAuditLog } from '@/lib/services/audit-log'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const agencies = await db.agencyHistory.findMany({
            orderBy: {
                startDate: 'desc',
            },
        });
        return NextResponse.json(agencies)
    } catch (error) {
        console.error('Error fetching agencies:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const data = await request.json();
        
        // Basic validation
        if (!data.name || !data.startDate) {
            return NextResponse.json({ error: 'Name and Start Date are required' }, { status: 400 });
        }

        const agency = await db.agencyHistory.create({
            data: {
                name: data.name,
                startDate: new Date(data.startDate),
                endDate: data.endDate ? new Date(data.endDate) : null,
            },
        });

        await createAuditLog({
            action: 'CREATE',
            target: 'AgencyHistory',
            targetId: agency.id,
            userId: session.id,
            detail: {
                name: agency.name,
                startDate: agency.startDate,
                endDate: agency.endDate
            }
        });

        return NextResponse.json(agency);
    } catch (error) {
        console.error('Error creating agency:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
