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

    return (
        <div className="rounded-md border border-border bg-card overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-card">
                    <TableRow>
                        <TableHead className="w-[100px] font-semibold text-muted-foreground">Mã hồ sơ</TableHead>
                        <TableHead className="max-w-[150px] font-semibold text-muted-foreground">Số bản án</TableHead>
                        <TableHead className="max-w-[200px] font-semibold text-muted-foreground">Tiêu đề / Về việc</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Năm</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Vị trí</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Trạng thái</TableHead>
                        <TableHead className="text-right font-semibold text-muted-foreground">Thao tác</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {files.map((file) => (
                        <TableRow key={file.id} className="bg-card hover:bg-muted/50 transition-colors">
                            <TableCell className="font-medium whitespace-nowrap text-foreground">
                                <div className="flex items-center gap-1">
                                    {file.code}
                                    {file.isLocked && <Lock className="w-3 h-3 text-amber-500" />}
                                </div>
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate" title={file.judgmentNumber || ''}>
                                <div className="font-medium text-foreground">{file.judgmentNumber || '-'}</div>
                                {file.indexCode && <div className="text-xs text-muted-foreground">{file.indexCode}</div>}
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                                <div className="line-clamp-2 text-foreground" title={file.title}>{file.title}</div>
                                <Badge variant="outline" className="mt-1 text-[10px] h-5 text-muted-foreground">{file.type}</Badge>
                            </TableCell>
                            <TableCell className="text-foreground">{file.year}</TableCell>
                            <TableCell className="text-foreground">
                                {file.box ? (
                                    <div className="flex flex-col">
                                        <span className="font-medium">{file.box.code}</span>
                                    </div>
                                ) : (
                                    '-'
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge variant={file.status === 'BORROWED' ? 'destructive' : 'secondary'} className={file.status !== 'BORROWED' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : ''}>
                                    {file.status === 'BORROWED' ? 'Đang mượn' : 'Lưu kho'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary hover:bg-primary/10">
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
