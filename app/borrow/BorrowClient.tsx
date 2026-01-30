"use client";

import { useState } from "react";
import BorrowTable from "@/components/BorrowTable";
import Modal from "@/components/Modal";
import BorrowForm from "@/components/BorrowForm";
import {
  BorrowSlipModel as BorrowSlip,
  UserModel as User,
  BorrowItemModel as BorrowItem,
  FileModel as File
} from "@/app/generated/prisma/models";

type BorrowSlipWithDetails = BorrowSlip & {
  lender: User;
  items: (BorrowItem & { file: File })[];
};

interface BorrowClientProps {
  initialBorrowSlips: BorrowSlipWithDetails[];
  onDataChange?: () => void;
}

export default function BorrowClient({ initialBorrowSlips, onDataChange }: BorrowClientProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSlipId, setEditingSlipId] = useState<string | null>(null);

  const handleReturn = (id: string) => {
    if (confirm(`Xác nhận trả hồ sơ cho phiếu ${id}?`)) {
      console.log("Returned", id);
    }
  };

  const handleEdit = (id: string) => {
    setEditingSlipId(id);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(`Bạn có chắc muốn xóa phiếu mượn ${id}?`)) {
      console.log("Delete", id);
    }
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
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Chỉnh sửa phiếu mượn ${editingSlipId || ""}`}
        className="max-w-5xl"
      >
        <BorrowForm />
      </Modal>
    </div>
  );
}
