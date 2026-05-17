import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const soonDate = new Date();
        soonDate.setDate(now.getDate() + 3);

        // 1. Sync OVERDUE status for active slips that are past due
        await db.borrowSlip.updateMany({
            where: {
                status: { in: ['BORROWING', 'PARTIAL_RETURN'] },
                dueDate: { lt: now }
            },
            data: {
                status: 'OVERDUE'
            }
        });

        // 2. Fetch Overdue Slips
        const overdue = await db.borrowSlip.findMany({
            where: { status: 'OVERDUE' },
            include: { 
                lender: {
                    select: {
                        fullName: true,
                        username: true
                    }
                },
                items: {
                    include: {
                        file: {
                            select: {
                                code: true,
                                title: true
                            }
                        }
                    }
                }
            },
            orderBy: { dueDate: 'asc' }
        });

        // 3. Fetch Soon Overdue Slips (within 3 days)
        const soonOverdue = await db.borrowSlip.findMany({
            where: {
                status: { in: ['BORROWING', 'PARTIAL_RETURN'] },
                dueDate: { 
                    gte: now,
                    lte: soonDate 
                }
            },
            include: { 
                lender: {
                    select: {
                        fullName: true,
                        username: true
                    }
                },
                items: {
                    include: {
                        file: {
                            select: {
                                code: true,
                                title: true
                            }
                        }
                    }
                }
            },
            orderBy: { dueDate: 'asc' }
        });

        return NextResponse.json({
            overdueCount: overdue.length,
            soonOverdueCount: soonOverdue.length,
            overdue,
            soonOverdue
        });
    } catch (error) {
        console.error('Error fetching borrow alerts:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
