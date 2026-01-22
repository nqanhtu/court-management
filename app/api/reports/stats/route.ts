import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const totalBorrows = await db.borrowSlip.count();

        const activeBorrows = await db.borrowSlip.count({
            where: {
                status: { in: ['BORROWING', 'OVERDUE'] },
            },
        });

        const overdueBorrows = await db.borrowSlip.count({
            where: {
                OR: [
                    { status: 'OVERDUE' },
                    { status: 'BORROWING', dueDate: { lt: new Date() } },
                ],
            },
        });

        const returnedCount = await db.borrowSlip.count({
            where: { status: 'RETURNED' },
        });

        const returnedRate = totalBorrows > 0 ? Math.round((returnedCount / totalBorrows) * 100) : 0;

        const recentBorrows = await db.borrowSlip.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: { file: true },
                },
            },
        });

        return NextResponse.json({
            totalBorrows,
            activeBorrows,
            overdueBorrows,
            returnedRate,
            recentBorrows,
        });
    } catch (error) {
        console.error('Error fetching report stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
