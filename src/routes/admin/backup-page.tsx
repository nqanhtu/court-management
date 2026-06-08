'use client';

import { useEffect, useState } from "react";
import { useRouter } from '@/src/lib/router';
import { useSession } from "@/lib/hooks/use-auth";
import { apiFetch, apiDownload } from "@/lib/api/client";
import { toast } from "sonner";
import { 
  Database, 
  Download, 
  Upload, 
  Settings, 
  History, 
  Loader2, 
  RefreshCw, 
  Play, 
  Save, 
  AlertTriangle 
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/common/page-header";

type BackupSchedule = {
  enabled: boolean;
  frequency: string;
  timeOfDay: string;
  retentionDays: number;
  lastRunAt: string | null;
  lastStatus: string | null;
  lastMessage: string | null;
};

type BackupRun = {
  id: string;
  filename: string | null;
  size: number | null;
  status: string;
  message: string | null;
  target: string;
  startedAt: string;
  endedAt: string | null;
};

export default function BackupPage() {
  const router = useRouter();
  const { session, isLoading: isSessionLoading } = useSession();

  const [schedule, setSchedule] = useState<BackupSchedule>({
    enabled: false,
    frequency: "DAILY",
    timeOfDay: "23:00",
    retentionDays: 7,
    lastRunAt: null,
    lastStatus: null,
    lastMessage: null,
  });
  const [runs, setRuns] = useState<BackupRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  
  // Restore state
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const fetchBackupData = async () => {
    try {
      const response = await apiFetch("/api/admin/database/backup-schedule");
      if (response.ok) {
        const data = await response.json();
        if (data.schedule) setSchedule(data.schedule);
        if (data.runs) setRuns(data.runs);
      }
    } catch (error) {
      console.error("Failed to fetch backup data:", error);
      toast.error("Không thể tải thông tin sao lưu");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Quản lý Sao lưu | Court Management";
  }, []);

  useEffect(() => {
    if (!isSessionLoading && (!session || session.role !== "SUPER_ADMIN")) {
      router.replace("/forbidden");
    } else if (session?.role === "SUPER_ADMIN") {
      fetchBackupData();
    }
  }, [session, isSessionLoading, router]);

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await apiFetch("/api/admin/database/backup-schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });
      if (response.ok) {
        toast.success("Đã cập nhật cấu hình lịch sao lưu");
        fetchBackupData();
      } else {
        toast.error("Không thể lưu cấu hình");
      }
    } catch {
      toast.error("Có lỗi xảy ra khi lưu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    toast.info("Đang xuất bản sao lưu cơ sở dữ liệu...");
    try {
      const response = await apiDownload("/api/admin/database/backup", {
        method: "POST"
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const contentDisposition = response.headers.get("content-disposition");
      let filename = "court_backup.dump";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/i);
        if (match && match[1]) filename = match[1];
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Sao lưu cơ sở dữ liệu thành công");
      fetchBackupData();
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải bản sao lưu");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFile) {
      toast.error("Vui lòng chọn file sao lưu (.dump)");
      return;
    }
    if (confirmText !== "RESTORE") {
      toast.error("Vui lòng nhập chính xác chữ RESTORE để xác nhận");
      return;
    }

    setIsRestoring(true);
    const formData = new FormData();
    formData.append("file", restoreFile);
    formData.append("confirm", "RESTORE");

    try {
      const response = await apiFetch("/api/admin/database/restore", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast.success("Khôi phục cơ sở dữ liệu thành công");
        setRestoreFile(null);
        setConfirmText("");
        fetchBackupData();
      } else {
        toast.error(result.message || "Khôi phục thất bại");
      }
    } catch {
      toast.error("Có lỗi xảy ra trong quá trình khôi phục");
    } finally {
      setIsRestoring(false);
    }
  };

  if (isSessionLoading || isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || session.role !== "SUPER_ADMIN") {
    return null;
  }

  return (
    <div className="flex flex-col bg-background/50 p-6 space-y-6">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        <PageHeader
          title="Quản lý Sao lưu & Phục hồi"
          description="Lập lịch sao lưu tự động và quản lý khôi phục cơ sở dữ liệu offline để tránh mất mát dữ liệu."
          icon={<div className="p-2 bg-primary/10 rounded-lg text-primary"><Database className="h-6 w-6" /></div>}
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Quick Actions / Backup Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-blue-600" />
                Sao lưu thủ công
              </CardTitle>
              <CardDescription>
                Tải ngay bản sao lưu cơ sở dữ liệu hiện tại (.dump) về thiết bị của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Trạng thái lần chạy cuối:</span>
                  <span className={`font-semibold ${
                    schedule.lastStatus === "SUCCESS" || schedule.lastStatus === "RESTORED"
                      ? "text-emerald-600" 
                      : schedule.lastStatus 
                      ? "text-destructive" 
                      : "text-muted-foreground"
                  }`}>
                    {schedule.lastStatus === "SUCCESS" ? "Thành công" : schedule.lastStatus === "RESTORED" ? "Đã khôi phục" : schedule.lastStatus || "Chưa có"}
                  </span>
                </div>
                {schedule.lastRunAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Thời gian chạy cuối:</span>
                    <span>{new Date(schedule.lastRunAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
              <Button 
                onClick={handleBackupNow} 
                disabled={isBackingUp}
                className="w-full flex items-center justify-center gap-2"
              >
                {isBackingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Sao lưu và tải về ngay
              </Button>
            </CardContent>
          </Card>

          {/* Backup Schedule Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-600" />
                Lập lịch sao lưu tự động
              </CardTitle>
              <CardDescription>
                Thiết lập tự động sao lưu định kỳ trên máy chủ.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSchedule} className="space-y-4">
                <div className="flex items-center gap-2 py-2">
                  <Checkbox 
                    id="schedule-enabled" 
                    checked={schedule.enabled}
                    onCheckedChange={(checked) => setSchedule({ ...schedule, enabled: Boolean(checked) })}
                  />
                  <Label htmlFor="schedule-enabled" className="cursor-pointer font-medium">Bật lịch sao lưu tự động</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Tần suất</Label>
                    <Select
                      value={schedule.frequency}
                      onValueChange={(val) => setSchedule({ ...schedule, frequency: val })}
                      disabled={!schedule.enabled}
                    >
                      <SelectTrigger id="frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Hàng ngày</SelectItem>
                        <SelectItem value="WEEKLY">Hàng tuần</SelectItem>
                        <SelectItem value="MONTHLY">Hàng tháng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeOfDay">Thời điểm (Giờ:Phút)</Label>
                    <Input 
                      id="timeOfDay"
                      value={schedule.timeOfDay}
                      onChange={(e) => setSchedule({ ...schedule, timeOfDay: e.target.value })}
                      placeholder="23:00"
                      disabled={!schedule.enabled}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retentionDays">Số ngày giữ bản sao lưu</Label>
                  <Input 
                    id="retentionDays"
                    type="number"
                    value={schedule.retentionDays}
                    onChange={(e) => setSchedule({ ...schedule, retentionDays: parseInt(e.target.value) || 7 })}
                    disabled={!schedule.enabled}
                    min={1}
                  />
                </div>

                <Button type="submit" disabled={isSaving} className="w-full flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Lưu cấu hình
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Database Restore Card */}
          <Card className="md:col-span-2 border-red-200 dark:border-red-900/40">
            <CardHeader className="bg-red-50/30 dark:bg-red-950/10">
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Khôi phục cơ sở dữ liệu
              </CardTitle>
              <CardDescription>
                Tải lên bản sao lưu (.dump) để ghi đè cơ sở dữ liệu hiện có. Hành động này sẽ thay thế hoàn toàn dữ liệu cũ!
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleRestore} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="restore-file">Chọn tệp sao lưu (.dump)</Label>
                    <Input 
                      id="restore-file"
                      type="file"
                      accept=".dump"
                      onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-text">
                      Nhập chữ <span className="font-bold text-destructive">RESTORE</span> để xác nhận
                    </Label>
                    <Input 
                      id="confirm-text"
                      placeholder="Nhập chữ xác nhận..."
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  variant="destructive"
                  disabled={isRestoring || !restoreFile || confirmText !== "RESTORE"}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Tiến hành khôi phục dữ liệu
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* History of runs */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-muted-foreground" />
                  Nhật ký sao lưu & khôi phục
                </CardTitle>
                <CardDescription>Danh sách 20 lần chạy sao lưu hoặc khôi phục gần nhất.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={fetchBackupData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Tên tệp</TableHead>
                      <TableHead>Kích thước</TableHead>
                      <TableHead>Hình thức</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          Chưa có lịch sử chạy sao lưu.
                        </TableCell>
                      </TableRow>
                    ) : (
                      runs.map((run) => (
                        <TableRow key={run.id}>
                          <TableCell className="whitespace-nowrap">
                            {new Date(run.startedAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-xs max-w-[200px] truncate" title={run.filename || ""}>
                            {run.filename || "—"}
                          </TableCell>
                          <TableCell>
                            {run.size ? `${(run.size / 1024 / 1024).toFixed(2)} MB` : "—"}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs capitalize font-medium">{run.target}</span>
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              run.status === "SUCCESS" || run.status === "RESTORED"
                                ? "bg-emerald-50 text-emerald-700" 
                                : "bg-destructive/10 text-destructive"
                            }`}>
                              {run.status === "SUCCESS" 
                                ? "Sao lưu OK" 
                                : run.status === "RESTORED" 
                                ? "Khôi phục OK" 
                                : run.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={run.message || ""}>
                            {run.message || "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
