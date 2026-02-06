'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface BorrowReturnDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
}

export function BorrowReturnDialog({ isOpen, onClose, onConfirm }: BorrowReturnDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Xác nhận trả hồ sơ</DialogTitle>
                    <DialogDescription>
                        Bạn có chắc chắn muốn đánh dấu phiếu mượn này là đã trả?
                        Hành động này sẽ cập nhật trạng thái của hồ sơ và phiếu mượn.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        Xác nhận trả
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
