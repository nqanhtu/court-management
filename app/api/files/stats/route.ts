import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { requirePermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();
        const denied = requirePermission(session, 'viewFiles');
        if (denied) return denied;

        const now = new Date();
        const [total, borrowed, overdue, byType] = await Promise.all([
            db.file.count(),
            db.file.count({ where: { status: 'BORROWED' } }),
            db.borrowSlip.count({ 
                where: { 
                    OR: [
                        { status: 'OVERDUE' },
                        { status: { in: ['BORROWING', 'PARTIAL_RETURN'] }, dueDate: { lt: now } }
                    ]
                } 
            }),
            db.file.groupBy({
                by: ['type'],
                _count: true
            })
        ]);

        return NextResponse.json({ total, borrowed, overdue, byType });
    } catch (error) {
        console.error('Error fetching file stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
