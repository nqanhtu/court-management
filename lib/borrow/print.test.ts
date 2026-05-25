import { printBorrowSlip } from '@/lib/borrow/print'
import { printStorageBoxLabels } from '@/lib/storage-box/print-labels'

describe('print helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns false when borrow slip popup is blocked', () => {
    vi.spyOn(window, 'open').mockReturnValue(null)

    const result = printBorrowSlip({
      id: 'slip-1',
      code: 'PM-001',
      borrowerName: 'Nguyễn Văn A',
      borrowDate: '2026-05-22',
      dueDate: '2026-05-29',
      status: 'PENDING_APPROVAL',
      lenderId: 'user-1',
      lender: { id: 'user-1', username: 'admin', fullName: 'Admin', role: 'SUPER_ADMIN', status: true },
      items: [],
    })

    expect(result).toBe(false)
  })

  it('returns false when storage box label popup is blocked', () => {
    vi.spyOn(window, 'open').mockReturnValue(null)

    const result = printStorageBoxLabels([], 'grid')

    expect(result).toBe(false)
  })
})
