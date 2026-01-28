'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Box, FileText, MapPin, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useFile } from '@/lib/hooks/use-files'

import { ChildDocumentUploadModal } from './child-document-upload-modal'

// ... existing imports

export function FileDetailContent({ id }: { id: string }) {
    const { file, isLoading } = useFile(id)

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
        <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Info */}
            <Card className="md:col-span-2">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl font-bold">{file.title}</CardTitle>
                            <div className="mt-2 text-muted-foreground flex gap-4">
                                <span>Mã: <span className="font-mono text-foreground font-semibold">{file.code}</span></span>
                                <span>Năm: {file.year}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {file.status !== 'BORROWED' && (
                                <Button asChild>
                                    <Link href={`/borrow/create?files=${file.id}`}>
                                        Lập phiếu mượn
                                    </Link>
                                </Button>
                            )}
                            <Badge variant={file.status === 'BORROWED' ? 'destructive' : 'secondary'} className="text-lg">
                                {file.status === 'BORROWED' ? 'Đang mượn' : 'Lưu kho'}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4">
                        <div>
                            <dt className="text-muted-foreground">Loại án</dt>
                            <dd className="font-medium">{file.type}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Số tờ</dt>
                            <dd className="font-medium">{file.pageCount || '-'}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Thời hạn lưu trữ</dt>
                            <dd className="font-medium">{file.retention || 'Vĩnh viễn'}</dd>
                        </div>
                        {file.judgmentDate && (
                            <div>
                                <dt className="text-muted-foreground">Ngày xét xử</dt>
                                <dd className="font-medium">{new Date(file.judgmentDate as Date).toLocaleDateString('vi-VN')}</dd>
                            </div>
                        )}
                        {file.note && (
                            <div className="md:col-span-3">
                                <dt className="text-muted-foreground">Ghi chú</dt>
                                <dd className="font-medium text-amber-700">{file.note}</dd>
                            </div>
                        )}
                    </dl>
                </CardContent>
            </Card>

            {/* Location Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                        <MapPin className="mr-2 h-5 w-5 text-blue-500" />
                        Vị trí lưu kho
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {file.box ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground uppercase">Kho</span>
                                    <div className="font-medium p-2 bg-slate-50 rounded border">{file.box.warehouse}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground uppercase">Dãy</span>
                                    <div className="font-medium p-2 bg-slate-50 rounded border">{file.box.line}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground uppercase">Giá (Kệ)</span>
                                    <div className="font-medium p-2 bg-slate-50 rounded border">{file.box.shelf}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground uppercase">Ngăn</span>
                                    <div className="font-medium p-2 bg-slate-50 rounded border">{file.box.slot}</div>
                                </div>
                            </div>
                            <div className="pt-4 border-t mt-2">
                                <span className="text-sm text-muted-foreground block mb-1">Hộp Hồ Sơ</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-primary">{file.box.boxNumber}</span>
                                    <span className="text-sm text-muted-foreground">({file.box.code})</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-muted-foreground italic p-4 text-center border-2 border-dashed rounded-lg">
                            Chưa cập nhật vị trí
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Borrow Status if any */}
            {file.borrowItems && file.borrowItems.length > 0 && (
                <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10">
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg text-amber-700">
                            <Box className="mr-2 h-5 w-5" />
                            Thông tin mượn
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            <p>Người mượn: <span className="font-semibold">{file.borrowItems[0].borrowSlip.borrowerName}</span></p>
                            <p>Ngày hẹn trả: <span className="font-semibold">{new Date(file.borrowItems[0].borrowSlip.dueDate).toLocaleDateString()}</span></p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Documents List */}
            <Card className="md:col-span-2">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-lg">
                            <FileText className="mr-2 h-5 w-5" />
                            Mục lục văn bản ({file.documents.length})
                        </CardTitle>
                        <ChildDocumentUploadModal fileId={file.id} />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Order</TableHead>
                                <TableHead>Trích yếu / Tên văn bản</TableHead>
                                <TableHead>Mã VB / MLHS</TableHead>
                                <TableHead>Thời gian</TableHead>
                                <TableHead className="text-right">Số tờ</TableHead>
                                <TableHead>Ghi chú</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {file.documents.length > 0 ? (
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
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground p-8">
                                        Chưa có văn bản con
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
