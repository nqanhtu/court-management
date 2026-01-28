'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { File } from '@/app/generated/prisma/client'
import { Eye, Lock, FileSpreadsheet } from 'lucide-react'
import Link from 'next/link'
import { ChildDocumentUploadModal } from './files/child-document-upload-modal'

interface FileWithBox extends File {
    box?: { code: string } | null
}

interface FileTableProps {
    files: FileWithBox[]
    role?: string // For RBAC display
}

export function FileTable({ files }: FileTableProps) {
    if (files.length === 0) {
        return <div className="text-center py-10 text-muted-foreground">Không tìm thấy hồ sơ nào.</div>
    }

    return (
        <div className="rounded-md border bg-white overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-slate-50/50">
                    <TableRow>
                        <TableHead className="w-[100px]">Mã hồ sơ</TableHead>
                        <TableHead className="max-w-[150px]">Số bản án</TableHead>
                        <TableHead className="max-w-[200px]">Tiêu đề / Về việc</TableHead>
                        <TableHead>Năm</TableHead>
                        <TableHead>Vị trí</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {files.map((file) => (
                        <TableRow key={file.id}>
                            <TableCell className="font-medium whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                    {file.code}
                                    {file.isLocked && <Lock className="w-3 h-3 text-amber-500" />}
                                </div>
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate" title={file.judgmentNumber || ''}>
                                <div className="font-medium">{file.judgmentNumber || '-'}</div>
                                {file.indexCode && <div className="text-xs text-muted-foreground">{file.indexCode}</div>}
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                                <div className="line-clamp-2" title={file.title}>{file.title}</div>
                                <Badge variant="outline" className="mt-1 text-[10px] h-5">{file.type}</Badge>
                            </TableCell>
                            <TableCell>{file.year}</TableCell>
                            <TableCell>
                                {file.box ? (
                                    <div className="flex flex-col">
                                        <span className="font-medium">{file.box.code}</span>
                                    </div>
                                ) : (
                                    '-'
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge variant={file.status === 'BORROWED' ? 'destructive' : 'secondary'}>
                                    {file.status === 'BORROWED' ? 'Đang mượn' : 'Lưu kho'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/files/${file.id}`}>
                                            <Eye className="w-4 h-4 mr-1" />
                                            Xem
                                        </Link>
                                    </Button>
                                    <ChildDocumentUploadModal
                                        fileId={file.id}
                                        trigger={
                                            <Button variant="ghost" size="icon" title="Upload bản kê văn bản">
                                                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                            </Button>
                                        }
                                    />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
