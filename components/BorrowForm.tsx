"use client";

import { useState, useEffect } from "react";
import {
  User,
  Calendar,
  FileStack,
  Plus,
  Trash2,
  Printer,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUsers } from "@/lib/actions/users";
import { searchFiles } from "@/lib/actions/files";
import { createBorrowSlip } from "@/lib/actions/borrow-actions";
import { UserModel, FileModel } from "@/app/generated/prisma/models";
import { toast } from "sonner";
import { Field, FieldLabel, FieldGroup } from "./ui/field";

interface BorrowFormProps {
  onSuccess?: () => void;
}

export default function BorrowForm({ onSuccess }: BorrowFormProps) {
  const [users, setUsers] = useState<UserModel[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Form State
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [borrowerTitle, setBorrowerTitle] = useState("");
  /* Initialize dates with lazy initialization to avoid "setState in effect" warning */
  const [borrowDate, setBorrowDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [dueDate, setDueDate] = useState<string>(() => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return nextWeek.toISOString().split("T")[0];
  });
  const [reason, setReason] = useState("");

  // File State
  const [fileQuery, setFileQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileModel[]>([]);
  const [isSearchingFile, setIsSearchingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      const data = await getUsers();
      setUsers(data);
      setIsLoadingUsers(false);
    };
    fetchUsers();
  }, []);

  const handleAddFile = async () => {
    if (!fileQuery.trim()) return;

    // Check if already added
    if (selectedFiles.some((f) => f.code === fileQuery || f.id === fileQuery)) {
      toast.warning("Đã thêm", {
        description: "Hồ sơ này đã có trong danh sách",
      });
      setFileQuery("");
      return;
    }

    setIsSearchingFile(true);
    // Exact match search for adding
    const result = await searchFiles({ query: fileQuery, limit: 1 });
    setIsSearchingFile(false);

    if (result.files && result.files.length > 0) {
      const file = result.files[0];
      if (file.status === "BORROWED") {
        toast.error("Không thể thêm", {
          description: `Hồ sơ ${file.code} đang được mượn`,
        });
      } else {
        setSelectedFiles((prev) => [...prev, file]);
        setFileQuery("");
      }
    } else {
      toast.error("Không tìm thấy", {
        description: "Không tìm thấy hồ sơ nào với mã này",
      });
    }
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = async () => {
    if (!selectedUserId || selectedFiles.length === 0) {
      toast.error("Thiếu thông tin", {
        description: "Vui lòng chọn người mượn và ít nhất 1 hồ sơ",
      });
      return;
    }

    setIsSubmitting(true);
    const selectedUser = users.find((u) => u.id === selectedUserId);

    const result = await createBorrowSlip({
      borrowerName: selectedUser?.fullName || "Unknown",
      borrowerUnit: selectedUser?.unit || "",
      borrowerTitle: borrowerTitle,
      reason: reason,
      dueDate: new Date(dueDate),
      fileIds: selectedFiles.map((f) => f.id),
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success("Thành công", {
        description: "Đã tạo phiếu mượn thành công",
      });
      onSuccess?.();
    } else {
      toast.error("Lỗi", {
        description: result.message || "Có lỗi xảy ra",
      });
    }
  };

  return (
    <div className="flex gap-8 h-[600px]">
      {/* Left: Form Inputs */}
      <form
        className="flex-1 flex flex-col space-y-5 overflow-y-auto px-2 max-w-md w-full"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="borrower-select">Người mượn</FieldLabel>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={isLoadingUsers}
            >
              <SelectTrigger id="borrower-select">
                <SelectValue
                  placeholder={
                    isLoadingUsers ? "Đang tải..." : "Chọn người dùng..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.fullName} {user.unit ? `- ${user.unit}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="borrower-title">
              Chức danh (Optional)
            </FieldLabel>
            <Input
              id="borrower-title"
              value={borrowerTitle}
              onChange={(e) => setBorrowerTitle(e.target.value)}
              placeholder="Ví dụ: Thẩm phán, Thư ký..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-5">
            <Field>
              <FieldLabel htmlFor="borrow-date">Ngày mượn</FieldLabel>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                <Input
                  id="borrow-date"
                  type="date"
                  value={borrowDate}
                  onChange={(e) => setBorrowDate(e.target.value)}
                  suppressHydrationWarning
                  className="w-full pl-9 pr-3 py-2 bg-white border-slate-200 rounded-lg text-sm focus-visible:ring-indigo-500 outline-none transition-colors"
                />
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="due-date">Hạn trả (Dự kiến)</FieldLabel>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  suppressHydrationWarning
                  className="w-full pl-9 pr-3 py-2 bg-white border-slate-200 rounded-lg text-sm focus-visible:ring-indigo-500 outline-none transition-colors"
                />
              </div>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="reason">Ghi chú phiếu mượn</FieldLabel>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-white border-slate-200 rounded-lg text-sm focus-visible:ring-indigo-500 outline-none transition-colors h-20 resize-none"
              placeholder="Lý do mượn, ghi chú tình trạng hồ sơ..."
            />
          </Field>

          <Field orientation="horizontal" className="pt-4 justify-end gap-3 border-t border-slate-100 mt-auto">
            <Button
              type="button"
              variant="outline"
            >
              <Printer className="w-4 h-4" /> In phiếu
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting || selectedFiles.length === 0 || !selectedUserId
              }
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Lưu phiếu mượn"
              )}
            </Button>
          </Field>
        </FieldGroup>
      </form>

      {/* Right: Selected Files List */}
      <div className="max-w-md w-full flex flex-col gap-4 border-l border-slate-100 pl-8">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-slate-800">Danh sách hồ sơ</h4>
          <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold">
            {selectedFiles.length}
          </span>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <FileStack className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
            <Input
              type="text"
              value={fileQuery}
              onChange={(e) => setFileQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddFile();
              }}
              disabled={isSearchingFile}
              placeholder="Nhập mã hoặc quét..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border-slate-200 rounded-lg text-sm focus:bg-white focus-visible:ring-indigo-500 outline-none transition-colors"
            />
          </div>
          <Button
            size="icon"
            onClick={handleAddFile}
            disabled={isSearchingFile || !fileQuery}
          >
            {isSearchingFile ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col h-full">
          <div className="flex-1 overflow-auto p-2 space-y-2">
            {selectedFiles.length === 0 && (
              <div className="text-center text-slate-400 py-10 text-sm">
                Chưa có hồ sơ nào được chọn
              </div>
            )}
            {selectedFiles.map((file) => (
              <div
                key={file.id}
                className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex items-start gap-3 group"
              >
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded">
                  <FileStack className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium text-slate-800 truncate"
                    title={file.title}
                  >
                    {file.title}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    {file.code}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveFile(file.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-slate-200 bg-white text-xs text-slate-500 text-center">
            Đã chọn {selectedFiles.length} hồ sơ
          </div>
        </div>
      </div>
    </div>
  );
}
