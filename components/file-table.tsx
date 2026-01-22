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
                        <TableHead className="w-[100px]">Mã hồ sơ</TableHead>
                        <TableHead className="max-w-[150px]">Số bản án</TableHead>
                        <TableHead className="max-w-[200px]">Tiêu đề / Về việc</TableHead>
                        <TableHead className="max-w-[150px]">Đương sự</TableHead>
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
                            <TableCell className="max-w-[150px] text-sm">
                                {file.defendants && file.defendants.length > 0 && (
                                    <div className="mb-1">
                                        <span className="font-semibold text-xs text-red-600">Bị: </span>
                                        {file.defendants.join(', ')}
                                    </div>
                                )}
                                {file.plaintiffs && file.plaintiffs.length > 0 && (
                                    <div>
                                        <span className="font-semibold text-xs text-blue-600">Nguyên: </span>
                                        {file.plaintiffs.join(', ')}
                                    </div>
                                )}
                                {file.civilDefendants && file.civilDefendants.length > 0 && (
                                    <div>
                                        <span className="font-semibold text-xs text-orange-600">Bị đơn: </span>
                                        {file.civilDefendants.join(', ')}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>{file.year}</TableCell>
                            <TableCell>
                                {file.box ? (
                                    <div className="flex flex-col">
                                        <span className="font-medium">{file.box.code}</span>
                                        {/* <span className="text-xs text-muted-foreground">Hộp {file.box.boxNumber}</span> */}
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
