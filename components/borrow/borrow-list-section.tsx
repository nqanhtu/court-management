'use client'

import { useState } from 'react'
import { useBorrowSlips } from '@/lib/hooks/use-borrow'
import BorrowTable from '@/components/borrow/borrow-table'
import Modal from '@/components/modal'
import BorrowForm from '@/components/borrow/borrow-form'
import BorrowHistoryModal from '@/components/borrow/borrow-history-modal'
import { BorrowReturnDialog } from '@/components/borrow/borrow-return-dialog'
import { BorrowSlipWithDetails } from '@/lib/types/borrow'
import { toast } from 'sonner'

export function BorrowListSection() {
    const { borrowSlips, isLoading, mutate } = useBorrowSlips()

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingSlipId, setEditingSlipId] = useState<string | null>(null)
    const [returnSlipId, setReturnSlipId] = useState<string | null>(null)
    const [historySlipId, setHistorySlipId] = useState<string | null>(null)

    const handleReturn = (id: string) => {
        setReturnSlipId(id)
    }

    const confirmReturn = async () => {
        if (!returnSlipId) return
        try {
            const response = await fetch('/api/borrow', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: returnSlipId })
            })
            const result = await response.json()

            if (result.success) {
                toast.success("Đã trả hồ sơ thành công")
                mutate()
            } else {
                toast.error("Lỗi khi trả hồ sơ", { description: result.message })
            }
        } catch {
            toast.error("Lỗi kết nối")
        }
        setReturnSlipId(null)
    }

    const handleEdit = (id: string) => {
        setEditingSlipId(id)
        setIsEditModalOpen(true)
    }

    const handleViewHistory = (id: string) => {
        setHistorySlipId(id)
    }

    const handleDelete = (id: string) => {
        console.log("Delete", id)
    }

    const editingSlip = editingSlipId
        ? borrowSlips.find((s: BorrowSlipWithDetails) => s.id === editingSlipId)
        : undefined

    return (
        <div className="flex flex-col h-full w-full space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Quản lý mượn trả</h1>
                    <p className="text-slate-500 text-sm mt-1">Theo dõi quá trình luân chuyển hồ sơ.</p>
                </div>
            </div>

            {/* Main Table */}
            <div className="flex-1 min-h-0">
                <BorrowTable
                    borrowSlips={borrowSlips}
                    isLoading={isLoading}
                    onReturn={handleReturn}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewHistory={handleViewHistory}
                    onCreate={() => setIsAddModalOpen(true)}
                />
            </div>

            {/* Add Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Tạo phiếu mượn hồ sơ"
                className="max-w-5xl"
            >
                <BorrowForm onSuccess={() => {
                    setIsAddModalOpen(false)
                    mutate()
                }} />
            </Modal>

            {/* Edit Modal */}
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

            {/* History Modal */}
            <BorrowHistoryModal
                isOpen={!!historySlipId}
                onClose={() => setHistorySlipId(null)}
                slipId={historySlipId}
            />

            {/* Return Confirmation Dialog */}
            <BorrowReturnDialog
                isOpen={!!returnSlipId}
                onClose={() => setReturnSlipId(null)}
                onConfirm={confirmReturn}
            />
        </div>
    )
}
