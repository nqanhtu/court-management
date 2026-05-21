'use client';

import { apiFetch } from '@/lib/api/client';

import { useState } from 'react'
import { toast } from 'sonner'

import BorrowForm from '@/components/borrow/borrow-form'
import BorrowHistoryModal from '@/components/borrow/borrow-history-modal'
import { BorrowReturnDialog } from '@/components/borrow/borrow-return-dialog'
import BorrowTable from '@/components/borrow/borrow-table'
import Modal from '@/components/modal'
import { can } from '@/lib/rbac'
import { useSession } from '@/lib/hooks/use-auth'
import { useBorrowSlips } from '@/lib/hooks/use-borrow'
import { BorrowSlipWithDetails } from '@/lib/types/borrow'

export function BorrowListSection() {
  const { borrowSlips, isLoading, mutate } = useBorrowSlips()
  const { session } = useSession()
  const canManageBorrow = can(session?.role, 'manageBorrow')

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingSlipId, setEditingSlipId] = useState<string | null>(null)
  const [returnSlipId, setReturnSlipId] = useState<string | null>(null)
  const [historySlipId, setHistorySlipId] = useState<string | null>(null)

  const confirmReturn = async (payload: {
    itemIds: string[]
    condition?: string
    note?: string
    returnedDate?: string
  }) => {
    if (!returnSlipId) return

    try {
      const response = await apiFetch(`/api/borrow/${returnSlipId}/return`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (response.ok && result.success) {
        toast.success(result.message || 'Đã trả hồ sơ thành công')
        mutate()
        setReturnSlipId(null)
        return
      }

      toast.error('Lỗi khi trả hồ sơ', { description: result.message })
    } catch {
      toast.error('Lỗi kết nối')
    }
  }

  const editingSlip = editingSlipId
    ? borrowSlips.find((slip: BorrowSlipWithDetails) => slip.id === editingSlipId)
    : undefined
  const returnSlip = returnSlipId
    ? borrowSlips.find((slip: BorrowSlipWithDetails) => slip.id === returnSlipId)
    : undefined

  return (
    <div className="flex h-full w-full flex-col space-y-4">
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý mượn trả</h1>
          <p className="mt-1 text-sm text-slate-500">Theo dõi quá trình luân chuyển hồ sơ.</p>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <BorrowTable
          borrowSlips={borrowSlips}
          isLoading={isLoading}
          onReturn={setReturnSlipId}
          onEdit={(id) => {
            setEditingSlipId(id)
            setIsEditModalOpen(true)
          }}
          onDelete={(id) => console.log('Delete', id)}
          onViewHistory={setHistorySlipId}
          canManageBorrow={canManageBorrow}
          onCreate={canManageBorrow ? () => setIsAddModalOpen(true) : undefined}
        />
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tạo phiếu mượn hồ sơ"
        className="max-w-5xl"
      >
        <BorrowForm
          onSuccess={() => {
            setIsAddModalOpen(false)
            mutate()
          }}
        />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingSlipId(null)
        }}
        title="Chỉnh sửa phiếu mượn"
        className="max-w-5xl"
      >
        <BorrowForm
          slipId={editingSlipId || undefined}
          initialData={editingSlip}
          onSuccess={() => {
            setIsEditModalOpen(false)
            setEditingSlipId(null)
            mutate()
          }}
        />
      </Modal>

      <BorrowHistoryModal
        isOpen={!!historySlipId}
        onClose={() => setHistorySlipId(null)}
        slipId={historySlipId}
      />

      <BorrowReturnDialog
        isOpen={!!returnSlipId}
        onClose={() => setReturnSlipId(null)}
        onConfirm={confirmReturn}
        slip={returnSlip}
      />
    </div>
  )
}
