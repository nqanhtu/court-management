import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const file = await db.file.findUnique({
            where: { id },
            include: {
                box: true,
                borrowItems: {
                    where: { status: 'BORROWING' },
                    include: { borrowSlip: true }
                },
                documents: {
                    orderBy: { order: 'asc' }
                }
            }
        })

        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        return NextResponse.json(file)
    } catch (error) {
        console.error('Error fetching file:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
