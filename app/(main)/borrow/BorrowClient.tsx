"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import { toast } from "sonner"

import { useState } from "react";
import BorrowTable from "@/components/BorrowTable";
import Modal from "@/components/Modal";
import BorrowForm from "@/components/borrow/BorrowForm";
import BorrowHistoryModal from "@/components/borrow/BorrowHistoryModal";
import { BorrowSlipWithDetails } from "@/lib/types/borrow";
import { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface BorrowClientProps {
  initialBorrowSlips: BorrowSlipWithDetails[];
  onDataChange?: () => void;
}

export default function BorrowClient({ initialBorrowSlips, onDataChange }: BorrowClientProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSlipId, setEditingSlipId] = useState<string | null>(null);

  const [returnSlipId, setReturnSlipId] = useState<string | null>(null);

  // History State
  const [historySlipId, setHistorySlipId] = useState<string | null>(null);

  const handleReturn = (id: string) => {
    setReturnSlipId(id);
  };

  const confirmReturn = async () => {
    if (returnSlipId) {
      try {
        const response = await fetch('/api/borrow', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: returnSlipId })
        })
        const result = await response.json()

        if (result.success) {
          toast.success("Đã trả hồ sơ thành công")
          onDataChange?.();
        } else {
          toast.error("Lỗi khi trả hồ sơ", {
            description: result.message
          })
        }
      } catch (error) {
        toast.error("Lỗi kết nối")
      }
      setReturnSlipId(null);
    }
  };

  const handleEdit = (id: string) => {
    setEditingSlipId(id);
    setIsEditModalOpen(true);
  };

  const handleViewHistory = (id: string) => {
    setHistorySlipId(id);
  };

  const handleDelete = (id: string) => {
    console.log("Delete", id);
  };

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
          borrowSlips={initialBorrowSlips}
          onReturn={handleReturn}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewHistory={handleViewHistory}
          onCreate={() => setIsAddModalOpen(true)}
        />
      </div>

      {/* Modals */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tạo phiếu mượn hồ sơ"
        className="max-w-5xl"
      >
        <BorrowForm onSuccess={() => {
          setIsAddModalOpen(false);
          onDataChange?.();
        }} />

        {/* <h1>Hello</h1> */}
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Chỉnh sửa phiếu mượn ${editingSlipId || ""}`}
        className="max-w-5xl"
      >
        <BorrowForm
          slipId={editingSlipId || undefined}
          initialData={initialBorrowSlips.find(s => s.id === editingSlipId)}
          onSuccess={() => {
            setIsEditModalOpen(false);
            onDataChange?.();
          }}
        />
      </Modal>

      {/* History Modal */}
      <BorrowHistoryModal
        isOpen={!!historySlipId}
        onClose={() => setHistorySlipId(null)}
        slipId={historySlipId}
      />

      <Dialog open={!!returnSlipId} onOpenChange={(open) => !open && setReturnSlipId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận trả hồ sơ</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn đánh dấu phiếu mượn này là đã trả? Hành động này sẽ cập nhật trạng thái của hồ sơ và phiếu mượn.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnSlipId(null)}>
              Hủy
            </Button>
            <Button
              onClick={confirmReturn}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Xác nhận trả
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


