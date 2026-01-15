'use server'

import { db } from '@/lib/db'
import { Prisma } from '@/app/generated/prisma/client'

export interface SearchParams {
  query?: string
  type?: string
  year?: number
  limit?: number
  offset?: number
}

export async function searchFiles(params: SearchParams) {
  const { query, type, year, limit = 20, offset = 0 } = params

  const where: Prisma.FileWhereInput = {
    AND: [
      query ? {
        OR: [
          { code: { contains: query, mode: 'insensitive' } },
          { title: { contains: query, mode: 'insensitive' } },
        ]
      } : {},
      type ? { type: { equals: type } } : {},
      year ? { year: { equals: year } } : {},
    ]
  }

  const [files, total] = await Promise.all([
    db.file.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        box: true,
      }
    }),
    db.file.count({ where })
  ])

  return { files, total }
}

export async function getFile(id: string) {
  const file = await db.file.findUnique({
    where: { id },
    include: {
      box: true,
      borrowItems: {
        where: { status: 'BORROWING' },
        include: { borrowSlip: true }
      }
    }
  })
  return file
}

export async function getFileStats() {
  const [total, borrowed, byType] = await Promise.all([
    db.file.count(),
    db.file.count({ where: { status: 'BORROWED' } }),
    db.file.groupBy({
      by: ['type'],
      _count: true
    })
  ])

  return { total, borrowed, byType }
}
