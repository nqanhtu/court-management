import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding ...')

  // 1. Seed Users
  const userA = await prisma.user.create({
    data: {
      code: 'NV001',
      fullName: 'Nguyễn Văn A',
      unit: 'Phòng Hành Chính',
      phone: '0901234567',
      email: 'nguyenvana@example.com',
      cccd: '012345678901',
      address: 'Số 1, Đường ABC, TP.HCM'
    }
  })

  const userB = await prisma.user.create({
    data: {
      code: 'NV002',
      fullName: 'Lê Thị B',
      unit: 'Phòng Kế Toán',
      phone: '0909876543',
      email: 'lethib@example.com',
    }
  })

  console.log('Created Users:', userA.fullName, userB.fullName)

  // 2. Seed Files (Hồ sơ)
  const files = []
  for (let i = 1; i <= 20; i++) {
    const file = await prisma.file.create({
      data: {
        code: `HS-2025-${800 + i}`,
        title: `Hồ sơ vụ án tranh chấp đất đai số ${i}`,
        type: i % 2 === 0 ? 'Dân sự' : 'Hình sự',
        pageCount: 10 + i,
        startDate: new Date('2025-01-01'),
        retention: 'Vĩnh viễn',
        room: 'Kho A',
        shelf: 'Kệ 01',
        box: 'Hộp 05',
        status: i > 15 ? 'BORROWED' : 'IN_STOCK' // Vài hồ sơ đang mượn
      }
    })
    files.push(file)
  }
  console.log(`Created ${files.length} Files`)

  // 3. Seed Borrow Slips (Phiếu mượn)
  const slip1 = await prisma.borrowSlip.create({
    data: {
      code: 'PM-2025-001',
      userId: userA.id,
      borrowDate: new Date('2025-03-01'),
      dueDate: new Date('2025-03-08'),
      status: 'BORROWING',
      items: {
        create: [
          { fileId: files[16].id }, // Mượn hồ sơ 17
          { fileId: files[17].id }, // Mượn hồ sơ 18
        ]
      }
    }
  })

  const slip2 = await prisma.borrowSlip.create({
    data: {
      code: 'PM-2025-002',
      userId: userB.id,
      borrowDate: new Date('2025-02-20'),
      dueDate: new Date('2025-02-27'),
      returnDate: new Date('2025-02-26'),
      status: 'RETURNED',
      items: {
        create: [
          { fileId: files[0].id, status: 'RETURNED', returnDate: new Date('2025-02-26') }
        ]
      }
    }
  })

  console.log('Created Borrow Slips')
  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
