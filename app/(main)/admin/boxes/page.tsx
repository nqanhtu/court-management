'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/hooks/use-auth";
import { 
  Archive, 
  MapPin, 
  Calendar, 
  Building2, 
  Hash, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Loader2,
  FolderOpen
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { StorageBoxDialog } from "@/components/forms/storage-box-dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function StorageBoxesPage() {
  const router = useRouter();
  const { session, isLoading: isSessionLoading } = useSession();

  const [boxes, setBoxes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBox, setSelectedBox] = useState<any>(null);
  const [boxToDelete, setBoxToDelete] = useState<any>(null);

  // Authenticate SUPER_ADMIN
  useEffect(() => {
    document.title = "Quản lý Hộp lưu trữ | Court Management";
  }, []);

  useEffect(() => {
    if (!isSessionLoading && (!session || session.role !== "SUPER_ADMIN")) {
      router.replace("/forbidden");
    }
  }, [session, isSessionLoading, router]);

  const fetchBoxes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (yearFilter) params.append("year", yearFilter);

      const response = await fetch(`/api/admin/boxes?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setBoxes(Array.isArray(data) ? data : []);
      } else {
        toast.error("Không thể tải danh sách hộp lưu trữ");
      }
    } catch (error) {
      console.error("Error fetching boxes:", error);
      toast.error("Đã xảy ra lỗi khi tải danh sách");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session && session.role === "SUPER_ADMIN") {
      fetchBoxes();
    }
  }, [session, search, yearFilter]);

  const handleDelete = async () => {
    if (!boxToDelete) return;

    // Direct check client-side just in case
    const filesCount = boxToDelete._count?.files || 0;
    if (filesCount > 0) {
      toast.error(`Không thể xóa: Hộp hiện đang chứa ${filesCount} hồ sơ.`);
      setBoxToDelete(null);
      return;
    }

    try {
      const response = await fetch(`/api/admin/boxes/${boxToDelete.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Không thể xoá hộp lưu trữ");
      }

      toast.success("Xóa hộp lưu trữ thành công");
      fetchBoxes();
    } catch (error: any) {
      toast.error(error.message || "Xóa thất bại. Vui lòng thử lại");
    } finally {
      setBoxToDelete(null);
    }
  };

  if (isSessionLoading) {
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
    <div className="flex flex-col h-full bg-background/50">
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-card p-6 rounded-2xl border shadow-sm transition-all duration-300">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Archive className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Quản lý Hộp lưu trữ</h1>
              </div>
              <p className="text-muted-foreground mt-2 text-sm max-w-2xl">
                Cấu hình thông tin vị trí lưu trữ vật lý, phân phối phông lưu trữ, loại hồ sơ và theo dõi số lượng hồ sơ được gán cho từng hộp lưu trữ trên hệ thống.
              </p>
            </div>
            <Button 
              className="h-10 px-4 rounded-xl flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              onClick={() => {
                setSelectedBox(null);
                setIsDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Thêm hộp mới
            </Button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-card p-4 rounded-xl border shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo mã hộp, kho, dãy, kệ, ngăn..."
                className="pl-9 h-9.5 rounded-lg border-input/60"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48 relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Lọc theo năm..."
                type="number"
                className="pl-9 h-9.5 rounded-lg border-input/60"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              />
            </div>
            {(search || yearFilter) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearch("");
                  setYearFilter("");
                }}
                className="h-9.5 rounded-lg text-xs"
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>

          {/* Data Table */}
          <div className="rounded-xl border bg-white dark:bg-card shadow-sm overflow-hidden transition-all duration-300">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="font-semibold text-foreground py-3">Mã QR / Hộp</TableHead>
                    <TableHead className="font-semibold text-foreground">Vị trí vật lý</TableHead>
                    <TableHead className="font-semibold text-foreground">Phông lưu trữ</TableHead>
                    <TableHead className="font-semibold text-foreground text-center">Năm</TableHead>
                    <TableHead className="font-semibold text-foreground text-center">Thời hạn</TableHead>
                    <TableHead className="font-semibold text-foreground text-center">Hồ sơ</TableHead>
                    <TableHead className="font-semibold text-foreground text-right pr-6 w-[120px]">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">Đang tải danh sách hộp lưu trữ...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : boxes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground">
                          <Archive className="h-8 w-8 opacity-40 mb-1" />
                          <span className="text-sm font-medium">Không tìm thấy hộp lưu trữ nào</span>
                          <span className="text-xs opacity-85">Thử thay đổi bộ lọc tìm kiếm hoặc thêm hộp mới.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    boxes.map((box) => {
                      const filesCount = box._count?.files || 0;
                      return (
                        <TableRow key={box.id} className="hover:bg-muted/30 transition-colors group">
                          {/* Code / QR Code */}
                          <TableCell className="py-4">
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-sm font-bold tracking-wide text-foreground group-hover:text-primary transition-colors">
                                {box.code}
                              </span>
                              {box.caseType && (
                                <span className="text-[10px] text-muted-foreground bg-muted/60 dark:bg-muted/20 px-1.5 py-0.5 rounded w-max font-medium">
                                  {box.caseType}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Coordinates / Map Pin */}
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                              <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
                                <span className="bg-muted px-1.5 py-0.5 rounded text-[11px]" title="Kho">{box.warehouse}</span>
                                <span className="text-muted-foreground font-normal">→</span>
                                <span className="bg-muted px-1.5 py-0.5 rounded text-[11px]" title="Dãy">{box.line}</span>
                                <span className="text-muted-foreground font-normal">→</span>
                                <span className="bg-muted px-1.5 py-0.5 rounded text-[11px]" title="Kệ">{box.shelf}</span>
                                <span className="text-muted-foreground font-normal">→</span>
                                <span className="bg-muted px-1.5 py-0.5 rounded text-[11px]" title="Ngăn">{box.slot}</span>
                                <span className="text-muted-foreground font-normal">→</span>
                                <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[11px]" title="Hộp">{box.boxNumber}</span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Linked Agency History */}
                          <TableCell>
                            {box.agency ? (
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-sky-600" />
                                <span className="text-xs font-medium text-foreground max-w-[200px] truncate">
                                  {box.agency.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Chưa phân phối</span>
                            )}
                          </TableCell>

                          {/* Retention Year */}
                          <TableCell className="text-center">
                            <span className="text-xs font-medium text-foreground">
                              {box.year || "—"}
                            </span>
                          </TableCell>

                          {/* Retention Period Label */}
                          <TableCell className="text-center">
                            {box.retention ? (
                              <Badge variant="outline" className="text-xs font-medium bg-muted/30 border-muted">
                                {box.retention}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>

                          {/* File Counter and Range */}
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <Badge 
                                variant={filesCount > 0 ? "secondary" : "outline"} 
                                className={`text-xs gap-1 ${
                                  filesCount > 0 
                                    ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 border-emerald-200 dark:border-emerald-900" 
                                    : "text-muted-foreground"
                                }`}
                              >
                                <FolderOpen className="h-3 w-3" />
                                {filesCount}
                              </Badge>
                              {(box.fromFileCode || box.toFileCode) && (
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  [{box.fromFileCode || "?"} - {box.toFileCode || "?"}]
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Action drop-down menu */}
                          <TableCell className="text-right pr-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg group-hover:bg-muted/80">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[160px] rounded-xl shadow-lg border">
                                <DropdownMenuLabel className="text-xs text-muted-foreground">Lựa chọn</DropdownMenuLabel>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedBox(box);
                                    setIsDialogOpen(true);
                                  }}
                                  className="text-xs cursor-pointer flex items-center gap-2"
                                >
                                  <Pencil className="h-3.5 w-3.5" /> Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className={`text-xs cursor-pointer flex items-center gap-2 ${
                                    filesCount > 0 
                                      ? "text-muted-foreground opacity-50 cursor-not-allowed" 
                                      : "text-destructive hover:text-destructive"
                                  }`}
                                  onClick={() => {
                                    if (filesCount > 0) {
                                      toast.warning(`Không thể xóa hộp lưu trữ vì đang có hồ sơ liên kết. Vui lòng di chuyển hồ sơ đi trước.`);
                                      return;
                                    }
                                    setBoxToDelete(box);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Xoá hộp
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </main>

      {/* Form Dialog for Creating and Editing Boxes */}
      <StorageBoxDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={fetchBoxes}
        box={selectedBox}
      />

      {/* Deleting Safe Confirmation Modal */}
      <AlertDialog open={!!boxToDelete} onOpenChange={() => setBoxToDelete(null)}>
        <AlertDialogContent className="rounded-2xl max-w-[450px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <Hash className="h-5 w-5 bg-destructive/10 p-1 rounded" />
              <AlertDialogTitle>Xác nhận xóa Hộp lưu trữ?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm">
              Hành động này sẽ gỡ bỏ vĩnh viễn hộp lưu trữ <strong>{boxToDelete?.code}</strong> ra khỏi hệ thống. Thao tác này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl h-9">Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl h-9"
            >
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
