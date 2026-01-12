"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import ArchiveTable from "@/components/ArchiveTable";
import Modal from "@/components/Modal";
import FileForm from "@/components/FileForm";

export default function FileManagement() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // Optional: State to store the ID of the file being edited
  const [editingFileId, setEditingFileId] = useState<string | null>(null);

  const handleEdit = (id: string) => {
    setEditingFileId(id);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    // In a real app, this would show a confirmation dialog
    if (confirm(`Bạn có chắc muốn xóa hồ sơ ${id}?`)) {
      console.log("Delete", id);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý hồ sơ</h1>
          <p className="text-slate-500 text-sm mt-1">Danh sách hồ sơ lưu trữ và tra cứu nhanh.</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setIsAddModalOpen(true)}
             className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm shadow-indigo-200 transition-all"
           >
             <Plus className="w-4 h-4" /> Thêm mới
           </button>
        </div>
      </div>

      {/* Main Content: Archive Table */}
      <div className="flex-1 min-h-0">
        <ArchiveTable onEdit={handleEdit} onDelete={handleDelete} />
      </div>

      {/* Modals */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Thêm mới hồ sơ lưu trữ"
        className="max-w-6xl h-[90vh]"
      >
        <FileForm />
      </Modal>

      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title={`Chỉnh sửa hồ sơ ${editingFileId || ""}`}
        className="max-w-6xl h-[90vh]"
      >
        <FileForm />
      </Modal>
    </div>
  );
}
