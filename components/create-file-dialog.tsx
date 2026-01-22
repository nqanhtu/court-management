'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import { FilePlus } from 'lucide-react'
import { ManualFileForm } from '@/components/forms/manual-file-form'
import { ExcelUploadForm } from '@/components/forms/excel-upload-form'

export function CreateFileDialog() {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <FilePlus className="mr-2 h-4 w-4" />
                    Thêm mới / Import
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Thêm mới Hồ sơ</DialogTitle>
                    <DialogDescription>
                        Tạo hồ sơ thủ công hoặc import hàng loạt từ file Excel.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="manual" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="manual">Thủ công</TabsTrigger>
                        <TabsTrigger value="excel">Import Excel</TabsTrigger>
                    </TabsList>

                    <TabsContent value="manual">
                        <ManualFileForm onSuccess={() => setOpen(false)} />
                    </TabsContent>

                    <TabsContent value="excel">
                        <ExcelUploadForm onSuccess={() => setOpen(false)} />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
