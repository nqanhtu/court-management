'use client'

import { useState } from 'react'
import { useUsers } from '@/lib/hooks/use-users'
import { useSession } from '@/lib/hooks/use-auth'
import UserTable from '@/components/user-table'
import Modal from '@/components/modal'
import UserForm from '@/components/user-form'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner'

export function UsersListSection() {
    const { users, isLoading: isUsersLoading, mutate } = useUsers()
    const { session, isLoading: isSessionLoading } = useSession()

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingUserId, setEditingUserId] = useState<string | null>(null)
    const [deleteUserId, setDeleteUserId] = useState<string | null>(null)

    const isLoading = isUsersLoading || isSessionLoading
    const isSuperAdmin = session?.role === 'SUPER_ADMIN'

    const handleEdit = (id: string) => {
        if (!isSuperAdmin) return
        setEditingUserId(id)
        setIsEditModalOpen(true)
    }

    const handleDelete = (id: string) => {
        if (!isSuperAdmin) return
        setDeleteUserId(id)
    }

    const confirmDelete = async () => {
        if (!deleteUserId) return
        try {
            const res = await fetch(`/api/users/${deleteUserId}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                toast.success('Xóa người dùng thành công')
                mutate()
            } else {
                const data = await res.json()
                toast.error(data.message || 'Lỗi khi xóa người dùng')
            }
        } catch {
            toast.error('Lỗi kết nối')
        }
        setDeleteUserId(null)
    }

    const editingUser = editingUserId ? users.find(u => u.id === editingUserId) : undefined

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
                    users={users}
                    isLoading={isLoading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onCreate={isSuperAdmin ? () => setIsAddModalOpen(true) : undefined}
                    currentUserRole={session?.role}
                />
            </div>

            {/* Add Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Thêm người dùng mới"
                className="max-w-4xl"
            >
                <UserForm
                    onSuccess={() => {
                        setIsAddModalOpen(false)
                        mutate()
                    }}
                    onCancel={() => setIsAddModalOpen(false)}
                />
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false)
                    setEditingUserId(null)
                }}
                title="Chỉnh sửa thông tin người dùng"
                className="max-w-4xl"
            >
                <UserForm
                    userId={editingUserId || undefined}
                    initialData={editingUser}
                    onSuccess={() => {
                        setIsEditModalOpen(false)
                        setEditingUserId(null)
                        mutate()
                    }}
                    onCancel={() => {
                        setIsEditModalOpen(false)
                        setEditingUserId(null)
                    }}
                />
            </Modal>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa người dùng?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này không thể hoàn tác. Người dùng sẽ bị xóa vĩnh viễn khỏi hệ thống.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={confirmDelete}
                        >
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
