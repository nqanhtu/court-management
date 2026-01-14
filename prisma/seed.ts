import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../app/generated/prisma/client'
import { UserRole } from '../app/generated/prisma/enums'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Start seeding...')

  // 1. Seed Agency History
  const agencies = [
    {
      name: 'TAND tỉnh Sông Bé',
      startDate: new Date('1976-01-01'),
      endDate: new Date('1996-12-31'),
    },
    {
      name: 'TAND tỉnh Bình Dương',
      startDate: new Date('1997-01-01'),
      endDate: null, // Present
    },
  ]

  for (const agency of agencies) {
    const exists = await prisma.agencyHistory.findFirst({
      where: { name: agency.name },
    })
    if (!exists) {
      await prisma.agencyHistory.create({ data: agency })
      console.log(`Created agency: ${agency.name}`)
    }
  }

  // 2. Seed Admin User
  const adminPassword = await bcrypt.hash('admin@123', 10)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      fullName: 'Quản trị viên',
      role: UserRole.ADMIN,
      password: adminPassword,
      status: true,
      unit: 'Phòng Lưu Trữ',
    },
  })
  console.log(`Created admin user: ${admin.username}`)

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
