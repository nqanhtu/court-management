export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER' | 'COORDINATOR'

export type UserDto = {
  id: string
  username: string
  fullName: string
  role: UserRole | string
  unit?: string | null
  status: boolean
  createdAt?: string | Date
  updatedAt?: string | Date
}

export type StorageBoxDto = {
  id: string
  code: string
  warehouse: string
  line: string
  shelf: string
  slot: string
  boxNumber: string
  agencyId?: string | null
  agency?: AgencyHistoryDto | null
  caseType?: string | null
  year?: number | null
  fromFileCode?: string | null
  toFileCode?: string | null
  retention?: string | null
  _count?: { files: number }
}

export type AgencyHistoryDto = {
  id: string
  name: string
  startDate: string | Date
  endDate?: string | Date | null
}

export type DocumentDto = {
  id: string
  code?: string | null
  title: string
  year?: number | null
  pageCount?: number | null
  order?: number | null
  contentIndex?: string | null
  preservationTime?: string | null
  note?: string | null
  fileId: string
}

export type FileDto = {
  id: string
  code: string
  title: string
  type: string
  datetime: string | Date
  year?: number | null
  pageCount?: number | null
  details?: unknown
  judgmentDate?: string | Date | null
  retention?: string | null
  note?: string | null
  indexCode?: string | null
  judgmentNumber?: string | null
  defendants: string[]
  plaintiffs: string[]
  civilDefendants: string[]
  isLocked: boolean
  status: string
  boxId?: string | null
  box: StorageBoxDto | null
  documents?: DocumentDto[]
  borrowItems?: BorrowItemDto[]
  fileIndex?: FileIndexDto | null
  createdAt?: string | Date
  updatedAt?: string | Date
}

export type FileIndexDto = {
  id: string
  fileId: string
  attachments: string[]
  totalPage: number
  judgmentTime: string | Date
  createdAt?: string | Date
  updatedAt?: string | Date
}

export type BorrowSlipDto = {
  id: string
  code: string
  borrowerName: string
  borrowerUnit?: string | null
  borrowerTitle?: string | null
  reason?: string | null
  borrowDate: string | Date
  dueDate: string | Date
  returnedDate?: string | Date | null
  status: string
  lenderId: string
  lender?: UserDto
  items?: BorrowItemDto[]
  events?: BorrowSlipEventDto[]
  createdAt?: string | Date
  updatedAt?: string | Date
}

export type BorrowItemDto = {
  id: string
  borrowSlipId: string
  fileId: string
  file: FileDto
  borrowSlip?: BorrowSlipDto
  returnedDate?: string | Date | null
  status: string
  condition?: string | null
}

export type BorrowSlipEventDto = {
  id: string
  borrowSlipId: string
  eventType: string
  description?: string | null
  details?: unknown
  creatorId?: string | null
  creator?: Pick<UserDto, 'fullName' | 'username'>
  createdAt: string | Date
}

export type AuditLogDto = {
  id: string
  action: string
  target: string
  targetId?: string | null
  detail?: unknown
  ipAddress?: string | null
  userId?: string | null
  user?: UserDto | null
  createdAt: string | Date
}
