import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const [total, borrowed, overdue, byType] = await Promise.all([
            db.file.count(),
            db.file.count({ where: { status: 'BORROWED' } }),
            db.file.count({
                where: {
                    status: 'BORROWED',
                    borrowItems: {
                        some: {
                            status: 'BORROWING',
                            borrowSlip: {
                                dueDate: {
                                    lt: new Date()
                                }
                            }
                        }
                    }
                }
            }),
            db.file.groupBy({
                by: ['type'],
                _count: true
            })
        ])

        return NextResponse.json({ total, borrowed, overdue, byType })
    } catch (error) {
        console.error('Error fetching file stats:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
