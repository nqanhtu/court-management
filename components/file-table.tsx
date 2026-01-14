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
import { Eye, Lock } from 'lucide-react'
import Link from 'next/link'

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

    // Basic role logic for demo: If not Admin/Viewer, hide some columns?
    // Using simple display for now.

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Mã hồ sơ</TableHead>
                        <TableHead>Tiêu đề / Về việc</TableHead>
                        <TableHead>Năm</TableHead>
                        <TableHead>Loại án</TableHead>
                        <TableHead>Hộp số</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {files.map((file) => (
                        <TableRow key={file.id}>
                            <TableCell className="font-medium">
                                {file.code}
                                {file.isLocked && <Lock className="inline-block w-3 h-3 ml-1 text-muted-foreground" />}
                            </TableCell>
                            <TableCell className="max-w-xs truncate" title={file.title}>
                                {file.title}
                            </TableCell>
                            <TableCell>{file.year}</TableCell>
                            <TableCell>
                                <Badge variant="outline">{file.type}</Badge>
                            </TableCell>
                            <TableCell>{file.box?.code || file.boxId || '-'}</TableCell>
                            <TableCell>
                                <Badge variant={file.status === 'BORROWED' ? 'destructive' : 'secondary'}>
                                    {file.status === 'BORROWED' ? 'Đang mượn' : 'Lưu kho'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/files/${file.id}`}>
                                        <Eye className="w-4 h-4 mr-1" />
                                        Xem
                                    </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
