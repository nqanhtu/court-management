import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

interface CreateEventParams {
    borrowSlipId: string
    eventType: string
    description?: string
    details?: any
}

export async function createBorrowSlipEvent({ borrowSlipId, eventType, description, details }: CreateEventParams) {
    try {
        const session = await getSession()
        const creatorId = session?.id

        await db.borrowSlipEvent.create({
            data: {
                borrowSlipId,
                eventType,
                description,
                details: details ? JSON.stringify(details) : undefined,
                creatorId
            }
        })
        return { success: true }
    } catch (error) {
        console.error('Create Event Error:', error)
        return { success: false }
    }
}
