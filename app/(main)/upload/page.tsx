'use client'

import { useState } from 'react'
import { Upload, FileUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
// cleaned import
import { toast } from 'sonner'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
                <>
                    <FileUp className="mr-2 h-4 w-4 animate-bounce" />
                    Đang xử lý...
                </>
            ) : (
                <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Hồ sơ
                </>
            )}
        </Button>
    )
}

interface UploadResult {
    success: boolean;
    message?: string;
    stats?: {
        success: number;
        failure: number;
    };
    errors?: string[];
}

export default function UploadPage() {
    const [result, setResult] = useState<UploadResult | null>(null)

    async function action(formData: FormData) {
        try {
            const res = await fetch('/api/upload/excel', {
                method: 'POST',
                body: formData
            });
            const response = await res.json();
            
            setResult(response)
            if (response.success) {
                toast.success(`Nhập thành công ${response.stats?.success ?? 0} hồ sơ!`)
            } else {
                toast.error(response.message || 'Có lỗi xảy ra khi upload')
            }
        } catch {
            toast.error('Lỗi kết nối')
        }
    }

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Nhập liệu Hồ sơ</CardTitle>
                    <CardDescription>
                        Tải lên file Excel (.xlsx) chứa dữ liệu hồ sơ. File cần tuân thủ cấu trúc 3 Sheets: Thông tin, Văn bản con, Vị trí.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={action} className="space-y-6">
                        <div className="grid w-full items-center gap-1.5">
                            <label
                                htmlFor="file"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/5 hover:bg-muted/10 transition-colors"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault()
                                    const input = document.getElementById('file') as HTMLInputElement
                                    if (input) {
                                        input.files = e.dataTransfer.files
                                    }
                                }}
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground">
                                        <span className="font-semibold">Click để chọn</span> hoặc kéo thả file vào đây
                                    </p>
                                    <p className="text-xs text-muted-foreground">XLSX, XLS (Tối đa 10MB)</p>
                                </div>
                                <input id="file" name="file" type="file" accept=".xlsx, .xls" className="hidden" required />
                            </label>
                        </div>

                        <SubmitButton />
                    </form>

                    {result && (
                        <div className="mt-6 space-y-4">
                            {result.success && result.stats ? (
                                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <AlertTitle className="text-green-600">Hoàn tất nhập liệu</AlertTitle>
                                    <AlertDescription className="text-green-700 dark:text-green-300">
                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                            <div>
                                                <span className="font-semibold">Thành công:</span> {result.stats.success}
                                            </div>
                                            <div>
                                                <span className="font-semibold">Thất bại:</span> {result.stats.failure}
                                            </div>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Lỗi</AlertTitle>
                                    <AlertDescription>{result.message}</AlertDescription>
                                </Alert>
                            )}

                            {result.errors && result.errors.length > 0 && (
                                <div className="rounded-md bg-muted p-4">
                                    <h4 className="mb-2 text-sm font-medium">Chi tiết lỗi:</h4>
                                    <ul className="list-disc pl-4 text-sm text-muted-foreground max-h-40 overflow-y-auto">
                                        {result.errors.map((err: string, i: number) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
