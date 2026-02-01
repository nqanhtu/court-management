
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const session = await getSession();
         if (!session) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
         }

        const borrowSlip = await db.borrowSlip.findUnique({
            where: { id },
            include: {
                lender: true,
                items: {
                    include: {
                        file: true,
                    },
                },
            },
        });

        if (!borrowSlip) {
             return NextResponse.json({ error: 'Borrow slip not found' }, { status: 404 });
        }

        return NextResponse.json(borrowSlip);
    } catch (error) {
        console.error('Error fetching borrow slip:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
