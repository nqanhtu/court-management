"use client";

import { useState } from "react";
import UserTable from "@/components/UserTable";
import Modal from "@/components/Modal";
import UserForm from "@/components/UserForm";
import { Button } from "@/components/ui/button";
import { UserModel as User } from "@/app/generated/prisma/models";

interface UsersClientProps {
  initialUsers: User[];
  currentUserRole?: string;
}

export default function UsersClient({ initialUsers, currentUserRole }: UsersClientProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';

  const handleEdit = (id: string) => {
    if (!isSuperAdmin) return;
    setEditingUserId(id);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!isSuperAdmin) return;
    if (confirm(`Bạn có chắc muốn xóa người dùng ${id}?`)) {
      console.log("Delete", id);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý người dùng</h1>
          <p className="text-slate-500 text-sm mt-1">Danh sách cán bộ và người dùng hệ thống.</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 min-h-0">
        <UserTable 
          users={initialUsers} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
          onCreate={isSuperAdmin ? () => setIsAddModalOpen(true) : undefined}
          currentUserRole={currentUserRole} 
        />
      </div>

      {/* Modals */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm người dùng mới"
        className="max-w-4xl"
      >
        <UserForm />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Chỉnh sửa thông tin ${editingUserId || ""}`}
        className="max-w-4xl"
      >
        <UserForm />
      </Modal>
    </div>
  );
}
