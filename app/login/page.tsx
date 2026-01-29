'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Loader2, User, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);

        try {
            const res = await login(formData);
            if (res.success) {
                toast.success('Đăng nhập thành công');
                router.refresh();
                router.push('/');
            } else {
                setError(res.message || 'Đăng nhập thất bại');
                toast.error(res.message);
            }
        } catch {
            setError('Lỗi kết nối');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-100 rounded-full blur-[120px] opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-100 rounded-full blur-[120px] opacity-50 translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            <Card className="w-full max-w-md shadow-2xl border-slate-200 z-10 bg-white/90 backdrop-blur-sm">
                <CardHeader className="space-y-1 text-center pb-8 pt-8">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200 transform rotate-3 hover:rotate-6 transition-transform">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-800">Đăng Nhập Hệ Thống</CardTitle>
                    <CardDescription className="text-slate-500">
                        Phần mềm Quản lý Hồ sơ Toà án
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-5">
                        {error && (
                            <Alert variant="destructive" className="bg-red-50 text-red-700 border-red-200">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="username">Tên đăng nhập</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    id="username"
                                    name="username"
                                    placeholder="admin"
                                    required
                                    disabled={isLoading}
                                    className="pl-10 h-10 border-slate-200 focus:border-indigo-500 hover:border-indigo-300 transition-colors"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Mật khẩu</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    disabled={isLoading}
                                    className="pl-10 h-10 border-slate-200 focus:border-indigo-500 hover:border-indigo-300 transition-colors"
                                />
                            </div>
                        </div>

                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <span>Đăng nhập</span>
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center pb-8 pt-2">
                    <p className="text-xs text-slate-400 text-center">
                        Hệ thống lưu trữ & quản lý hồ sơ nội bộ <br />
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
