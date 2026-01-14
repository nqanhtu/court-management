import { getFile } from '@/lib/actions/files'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Box, FileText, MapPin } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Document {
    id: string;
    code: string | null;
    title: string;
    order: number;
    pageCount: number | null;
}

export default async function FileDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const file = await getFile(id)

    if (!file) {
        notFound()
    }

    return (
        <div className="container mx-auto py-10 max-w-5xl">
            <div className="mb-6">
                <Button variant="ghost" asChild>
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                    </Link>
                </Button>
            </div>

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
                                    <dd className="font-medium">{new Date(file.judgmentDate).toLocaleDateString('vi-VN')}</dd>
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
                            <div className="space-y-2">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Kho</span>
                                    <span className="font-medium">{file.box.warehouse}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Dãy</span>
                                    <span className="font-medium">{file.box.line}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Giá (Kệ)</span>
                                    <span className="font-medium">{file.box.shelf}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Ngăn</span>
                                    <span className="font-medium">{file.box.slot}</span>
                                </div>
                                <div className="flex justify-between pt-2">
                                    <span className="text-muted-foreground">Hộp số</span>
                                    <span className="font-bold text-primary">{file.box.boxNumber}</span>
                                </div>
                                <div className="mt-4 pt-4 border-t text-xs text-center text-muted-foreground">
                                    Mã hộp: {file.box.code}
                                </div>
                            </div>
                        ) : (
                            <div className="text-muted-foreground italic">Chưa cập nhật vị trí</div>
                        )}
                    </CardContent>
                </Card>

                {/* Borrow Status if any */}
                {file.borrowItems.length > 0 && (
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
                        <CardTitle className="flex items-center text-lg">
                            <FileText className="mr-2 h-5 w-5" />
                            Mục lục văn bản ({file.documents.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">STT</TableHead>
                                    <TableHead>Trích yếu / Tên văn bản</TableHead>
                                    <TableHead>Mã VB</TableHead>
                                    <TableHead className="text-right">Số tờ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {file.documents.length > 0 ? (
                                    file.documents.map((doc: Document) => (
                                        <TableRow key={doc.id}>
                                            <TableCell>{doc.order}</TableCell>
                                            <TableCell className="font-medium">{doc.title}</TableCell>
                                            <TableCell>{doc.code || '-'}</TableCell>
                                            <TableCell className="text-right">{doc.pageCount}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">Không có văn bản con</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
