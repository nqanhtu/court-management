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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function BorrowListSection() {
  const { borrowSlips, isLoading, mutate } = useBorrowSlips()
  const { session } = useSession()
  const canManageBorrow = can(session?.role, 'manageBorrow')
  const canApproveBorrow = session?.role === 'SUPER_ADMIN' || session?.role === 'ADMIN'

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingSlipId, setEditingSlipId] = useState<string | null>(null)
  const [returnSlipId, setReturnSlipId] = useState<string | null>(null)
  const [historySlipId, setHistorySlipId] = useState<string | null>(null)

  const mutateWithToast = async (id: string, action: 'approve' | 'reject' | 'export') => {
    const labels = {
      approve: 'Đã duyệt yêu cầu',
      reject: 'Đã từ chối yêu cầu',
      export: 'Đã xuất hồ sơ',
    }
    try {
      const response = await apiFetch(`/api/borrow/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'reject' ? JSON.stringify({ reason: 'Từ chối bởi quản trị viên' }) : JSON.stringify({}),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || result.error || 'Thao tác thất bại')
      toast.success(labels[action])
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lỗi kết nối')
    }
  }

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

      <Tabs defaultValue="pending" className="min-h-0 flex-1">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="pending">Chờ duyệt</TabsTrigger>
          <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
          <TabsTrigger value="borrowing">Đang mượn</TabsTrigger>
          <TabsTrigger value="returned">Đã trả</TabsTrigger>
          <TabsTrigger value="closed">Từ chối/Quá hạn</TabsTrigger>
        </TabsList>
        {[
          { value: 'pending', statuses: ['PENDING_APPROVAL'] },
          { value: 'approved', statuses: ['APPROVED'] },
          { value: 'borrowing', statuses: ['EXPORTED', 'PARTIAL_RETURN'] },
          { value: 'returned', statuses: ['RETURNED'] },
          { value: 'closed', statuses: ['REJECTED', 'OVERDUE'] },
        ].map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="min-h-0">
            <BorrowTable
              borrowSlips={borrowSlips.filter((slip) => tab.statuses.includes(slip.status))}
              isLoading={isLoading}
              onReturn={setReturnSlipId}
              onApprove={(id) => mutateWithToast(id, 'approve')}
              onReject={(id) => mutateWithToast(id, 'reject')}
              onExport={(id) => mutateWithToast(id, 'export')}
              onEdit={(id) => {
                setEditingSlipId(id)
                setIsEditModalOpen(true)
              }}
              onDelete={(id) => console.log('Delete', id)}
              onViewHistory={setHistorySlipId}
              canManageBorrow={canManageBorrow}
              canApproveBorrow={canApproveBorrow}
              onCreate={canManageBorrow ? () => setIsAddModalOpen(true) : undefined}
            />
          </TabsContent>
        ))}
      </Tabs>

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
