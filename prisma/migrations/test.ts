import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../app/generated/prisma/client'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Query storage boxes with files year 2026')

  const result = await prisma.storageBox.findMany({
    where: {
      agency: {
        startDate: { lte: new Date(2026, 0, 1) },
        // OR: [
        //   { endDate: { gt: new Date(2026, 0, 1) } },
        //   { endDate: null },
        // ],
      },
    },
  })

  console.log(new Date(2026, 0, 1))
  console.dir(result, { depth: null })
}

main()
  .catch((e) => {
    console.error(e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
