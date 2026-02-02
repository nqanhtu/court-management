'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

import { Box, FileText, MapPin, Loader2, Pencil, Trash2, Info, Archive, CalendarDays, Gavel, User, Users } from 'lucide-react'
import Link from 'next/link'
import { useFile } from '@/lib/hooks/use-files'

import { ChildDocumentUploadModal } from './child-document-upload-modal'
import { getColumns } from './columns'
import { ChildDocumentFormModal } from './child-document-form-modal'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner'

export function FileDetailContent({ id }: { id: string }) {
    const { file, isLoading, mutate } = useFile(id)

    // Helper to format date consistent with Vietnamese format dd/MM/yyyy
    const formatDate = (date: string | Date | null | undefined, includeTime = false) => {
        if (!date) return '-'
        try {
            return format(new Date(date), includeTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy', { locale: vi })
        } catch (e) {
            return '-'
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center p-10">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        )
    }

    if (!file) {
        return <div className="text-center p-10 text-muted-foreground">Không tìm thấy hồ sơ</div>
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{file.title}</h1>
                    <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <span className="font-semibold text-foreground">{file.code}</span>
                        </div>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            <span>Năm: {file.year}</span>
                        </div>
                        <Badge variant={file.status === 'BORROWED' ? 'warning' : 'secondary'} className="ml-2">
                            {file.status === 'BORROWED' ? 'Đang mượn' : 'Lưu kho'}
                        </Badge>
                         {file.isLocked && <Badge variant="destructive" className="ml-2">Đã khóa</Badge>}
                    </div>
                </div>
                <div className="flex gap-2">
                     {file.status !== 'BORROWED' && !file.isLocked && (
                        <Button asChild>
                            <Link href={`/borrow/create?files=${file.id}`}>
                                Lập phiếu mượn
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="general">Thông tin chung</TabsTrigger>
                    <TabsTrigger value="storage">Lưu trữ</TabsTrigger>
                    <TabsTrigger value="index">Mục lục hồ sơ</TabsTrigger>
                    <TabsTrigger value="borrow">Mượn trả</TabsTrigger>
                </TabsList>

                {/* General Information Tab */}
                <TabsContent value="general" className="mt-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Info className="h-5 w-5 text-blue-500" />
                                    Thông tin cơ bản
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Loại án</p>
                                        <p className="font-medium">{file.type}</p>
                                    </div>
                                     <div>
                                        <p className="text-sm font-medium text-muted-foreground">Số bản án</p>
                                        <p className="font-medium">{file.judgmentNumber || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Số tờ</p>
                                        <p className="font-medium">{file.pageCount || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Thời hạn lưu trữ</p>
                                        <p className="font-medium">{file.retention || 'Vĩnh viễn'}</p>
                                    </div>
                                    {file.judgmentDate && (
                                        <div className="col-span-2">
                                            <p className="text-sm font-medium text-muted-foreground">Ngày xét xử</p>
                                            <p className="font-medium">{formatDate(file.judgmentDate)}</p>
                                        </div>
                                    )}
                                </div>
                                {file.note && (
                                    <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900 border border-amber-200">
                                        <span className="font-semibold">Ghi chú: </span>
                                        {file.note}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-indigo-500" />
                                    Đương sự
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {file.defendants && file.defendants.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-2">Bị cáo / Bị đơn</p>
                                        <div className="flex flex-wrap gap-2">
                                            {file.defendants.map((name: string, i: number) => (
                                                <Badge key={i} variant="outline" className="text-red-600 border-red-200 bg-red-50">
                                                    {name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {file.plaintiffs && file.plaintiffs.length > 0 && (
                                    <div>
                                        <Separator className="my-3"/>
                                        <p className="text-sm font-medium text-muted-foreground mb-2">Nguyên đơn</p>
                                         <div className="flex flex-wrap gap-2">
                                            {file.plaintiffs.map((name: string, i: number) => (
                                                <Badge key={i} variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                                                    {name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                  {file.civilDefendants && file.civilDefendants.length > 0 && (
                                    <div>
                                        <Separator className="my-3"/>
                                        <p className="text-sm font-medium text-muted-foreground mb-2">Bị đơn dân sự</p>
                                         <div className="flex flex-wrap gap-2">
                                            {file.civilDefendants.map((name: string, i: number) => (
                                                <Badge key={i} variant="outline" className="text-slate-600 border-slate-200 bg-slate-50">
                                                    {name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Storage Tab */}
                <TabsContent value="storage" className="mt-6">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Archive className="h-5 w-5 text-orange-500" />
                                Thông tin lưu trữ
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {file.box ? (
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Hộp số</p>
                                                <p className="text-2xl font-bold">{file.box.boxNumber}</p>
                                                <p className="text-xs text-muted-foreground">{file.box.code}</p>
                                            </div>
                                            <Box className="h-8 w-8 text-slate-300" />
                                        </div>
                                        {file.box.agency && (
                                             <div className="p-4 border rounded-lg">
                                                <p className="text-sm text-muted-foreground mb-1">Phông lưu trữ</p>
                                                <p className="font-semibold">{file.box.agency.name}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatDate(file.box.agency.startDate)} - 
                                                    {file.box.agency.endDate ? formatDate(file.box.agency.endDate) : 'Hiện tại'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 border rounded">
                                            <p className="text-xs text-muted-foreground uppercase">Kho</p>
                                            <p className="font-medium">{file.box.warehouse}</p>
                                        </div>
                                        <div className="p-3 border rounded">
                                            <p className="text-xs text-muted-foreground uppercase">Dãy</p>
                                            <p className="font-medium">{file.box.line}</p>
                                        </div>
                                        <div className="p-3 border rounded">
                                            <p className="text-xs text-muted-foreground uppercase">Kệ (Giá)</p>
                                            <p className="font-medium">{file.box.shelf}</p>
                                        </div>
                                        <div className="p-3 border rounded">
                                            <p className="text-xs text-muted-foreground uppercase">Ngăn</p>
                                            <p className="font-medium">{file.box.slot}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                    Hồ sơ chưa được xếp vào hộp/vị trí lưu trữ.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Index Tab */}
                <TabsContent value="index" className="mt-6">
                    {file.fileIndex ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                     <Gavel className="h-5 w-5 text-purple-500" />
                                    Mục lục hồ sơ gốc
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-muted-foreground">Tổng số bút lục</p>
                                        <p className="text-xl font-bold">{file.fileIndex.totalPage}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-muted-foreground">Thời gian xét xử</p>
                                        <p className="text-xl font-bold">{formatDate(file.fileIndex.judgmentTime)}</p>
                                    </div>
                                </div>
                                {file.fileIndex.attachments && file.fileIndex.attachments.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium mb-2">Tài liệu đính kèm</p>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                            {file.fileIndex.attachments.map((att: string, i: number) => (
                                                <li key={i}>{att}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : ( 
                        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed">
                            <p className="text-muted-foreground">Chưa có thông tin mục lục hồ sơ gốc.</p>
                        </div>
                    )}
                </TabsContent>

                {/* Borrow Tab */}
                <TabsContent value="borrow" className="mt-6">
                     {file.borrowItems && file.borrowItems.length > 0 ? (
                        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10">
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg text-amber-700">
                                    <Box className="mr-2 h-5 w-5" />
                                    Đang mượn
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {file.borrowItems.map((item: any) => (
                                        <div key={item.id} className="p-4 bg-white dark:bg-slate-950 rounded-lg border shadow-sm">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-muted-foreground uppercase">Người mượn</p>
                                                    <p className="font-semibold">{item.borrowSlip.borrowerName}</p>
                                                    <p className="text-sm text-muted-foreground">{item.borrowSlip.borrowerUnit}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground uppercase">Ngày hẹn trả</p>
                                                    <p className="font-semibold text-red-600">{formatDate(item.borrowSlip.dueDate)}</p>
                                                </div>
                                            </div>
                                             {item.borrowSlip.reason && (
                                                <div className="mt-2 pt-2 border-t">
                                                     <p className="text-xs text-muted-foreground">Lý do: {item.borrowSlip.reason}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                         <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed">
                            <p className="text-muted-foreground">Hồ sơ đang trong kho, chưa có phiếu mượn nào.</p>
                        </div>
                    )}
                </TabsContent>

                {/* Documents List - Always Visible */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center text-lg">
                                <FileText className="mr-2 h-5 w-5" />
                                Mục lục văn bản ({file.documents?.length || 0})
                            </CardTitle>
                            <div className="flex gap-2">
                                <ChildDocumentFormModal fileId={file.id} onSuccess={() => mutate()} />
                                <ChildDocumentUploadModal fileId={file.id} onSuccess={() => mutate()} />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">TT</TableHead>
                                    <TableHead>Trích yếu / Tên văn bản</TableHead>
                                    <TableHead>Mã VB / MLHS</TableHead>
                                    <TableHead>Thời gian</TableHead>
                                    <TableHead className="text-right">Số tờ</TableHead>
                                    <TableHead>Ghi chú</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {file.documents && file.documents.length > 0 ? (
                                    file.documents.map((doc: any, index: number) => (
                                        <TableRow key={doc.id}>
                                            <TableCell>{doc.order || index + 1}</TableCell>
                                            <TableCell className="font-medium max-w-[400px]">
                                                {doc.title}
                                                {doc.contentIndex && <div className="text-xs text-muted-foreground mt-1">MLVB: {doc.contentIndex}</div>}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-xs gap-1">
                                                    <span>{doc.code || '-'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{doc.year || '-'}</TableCell>
                                            <TableCell className="text-right">{doc.pageCount}</TableCell>

                                            <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate" title={doc.note}>{doc.note}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <ChildDocumentFormModal
                                                        fileId={file.id}
                                                        document={doc}
                                                        trigger={
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        }
                                                        onSuccess={() => mutate()}
                                                    />
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Hành động này không thể hoàn tác. Văn bản này sẽ bị xóa vĩnh viễn.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                                                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={async () => {
                                                                    try {
                                                                        const res = await fetch(`/api/files/child-document?id=${doc.id}`, {
                                                                            method: 'DELETE'
                                                                        })
                                                                        if (res.ok) {
                                                                            toast.success('Xóa thành công')
                                                                            mutate()
                                                                        } else {
                                                                            toast.error('Gặp lỗi khi xóa')
                                                                        }
                                                                    } catch (e) {
                                                                        toast.error('Gặp lỗi khi xóa')
                                                                    }
                                                                }}>Xóa</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground p-8">
                                            Chưa có văn bản con
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </Tabs>
        </div>
    )
}
