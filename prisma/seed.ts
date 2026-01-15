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

  // 2. Seed Users
  const genericPassword = await bcrypt.hash('123456', 10)
  const adminPassword = await bcrypt.hash('admin@123', 10)

  // SuperAdmin
  await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      fullName: 'Quản trị hệ thống',
      role: UserRole.SUPER_ADMIN,
      password: adminPassword,
      status: true,
      unit: 'Ban Quản Trị',
    },
  })
  console.log(`Created SuperAdmin: superadmin`)

  // Admin (Chánh sán)
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      fullName: 'Nguyễn Văn A (Chánh án)',
      role: UserRole.ADMIN,
      password: genericPassword,
      status: true,
      unit: 'Lãnh đạo Tòa',
    },
  })
  console.log(`Created Admin: admin`)

  // Viewer (Thẩm phán)
  await prisma.user.upsert({
    where: { username: 'viewer' },
    update: {},
    create: {
      username: 'viewer',
      fullName: 'Trần Văn B (Thẩm phán)',
      role: UserRole.VIEWER,
      password: genericPassword,
      status: true,
      unit: 'Tòa Hình sự',
    },
  })
  console.log(`Created Viewer: viewer`)

  // Coordinator
  await prisma.user.upsert({
    where: { username: 'coordinator' },
    update: {},
    create: {
      username: 'coordinator',
      fullName: 'Lê Thị C (Điều phối)',
      role: UserRole.COORDINATOR,
      password: genericPassword,
      status: true,
      unit: 'Phòng Hành chính Tư pháp',
    },
  })
  console.log(`Created Coordinator: coordinator`)

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
