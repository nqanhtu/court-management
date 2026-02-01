"use client";

import { useState, useEffect } from "react";
import {
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserModel, FileModel, BorrowSlipModel, BorrowItemModel, BorrowSlipEventModel } from "@/generated/prisma/models";
import { toast } from "sonner";
import { format } from "date-fns";
import { History, FileText } from "lucide-react";
import { Field, FieldLabel, FieldGroup } from "../ui/field";


interface BorrowSlipWithDetails extends BorrowSlipModel {
  lender: UserModel;
  items: (BorrowItemModel & { file: FileModel })[];
}

interface BorrowFormProps {
  onSuccess?: () => void;
  initialData?: BorrowSlipWithDetails;
  slipId?: string;
  initialFiles?: FileModel[];
}

export default function BorrowForm({ onSuccess, initialData, slipId, initialFiles = [] }: BorrowFormProps) {
  const [users, setUsers] = useState<UserModel[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Form State
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [borrowerTitle, setBorrowerTitle] = useState(initialData?.borrowerTitle || "");
  /* Initialize dates with lazy initialization to avoid "setState in effect" warning */
  const [borrowDate, setBorrowDate] = useState<string>(() => {
    return initialData ? new Date(initialData.borrowDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
  });
  const [dueDate, setDueDate] = useState<string>(() => {
    if (initialData) return new Date(initialData.dueDate).toISOString().split("T")[0];
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return nextWeek.toISOString().split("T")[0];
  });
  const [reason, setReason] = useState(initialData?.reason || "");

  // File State
  const [fileQuery, setFileQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileModel[]>(
    initialFiles || initialData?.items.map((item) => item.file) || []
  );
  const [isSearchingFile, setIsSearchingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // borrowEvent State
  const [borrowEvent, setBorrowEvent] = useState<(BorrowSlipEventModel & { creator: { fullName: string, username: string } | null })[]>([]);
  const [activeTab, setActiveTab] = useState<'files' | 'borrowEvent'>('files');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    if (slipId) {
      const fetchBorrowEvent = async () => {
        const res = await fetch(`/api/borrow/${slipId}/borrow-slip-event`);
        if (res.ok) {
          const data = await res.json();
          setBorrowEvent(data);
        }
      };
      fetchBorrowEvent();
    }
  }, [slipId]);

  useEffect(() => {
    if (initialData && users.length > 0 && !selectedUserId) {
      // Try to find the user by name since we only stored string name
      const found = users.find(u => u.fullName === initialData.borrowerName);
      if (found) setSelectedUserId(found.id);
    }
  }, [users, initialData, selectedUserId]);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingUsers(false);
      }
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
    let result: { files: FileModel[] } = { files: [] };
    try {
      const res = await fetch(`/api/files?q=${encodeURIComponent(fileQuery)}&limit=1`);
      if (res.ok) {
        result = await res.json();
      }
    } catch (e) {
      console.error(e);
    }
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

    try {
      const method = slipId ? 'PATCH' : 'POST';
      const body = {
        id: slipId,
        borrowerName: selectedUser?.fullName || "Unknown",
        borrowerUnit: selectedUser?.unit || "",
        borrowerTitle: borrowerTitle,
        reason: reason,
        dueDate: new Date(dueDate),
        fileIds: selectedFiles.map((f) => f.id),
      };

      const response = await fetch('/api/borrow', {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      setIsSubmitting(false);

      if (result.success) {
        toast.success("Thành công", {
          description: slipId ? "Đã cập nhật phiếu mượn" : "Đã tạo phiếu mượn thành công",
        });
        onSuccess?.();
      } else {
        toast.error("Lỗi", {
          description: result.message || "Có lỗi xảy ra",
        });
      }
    } catch (error) {
      setIsSubmitting(false);
      toast.error("Lỗi", {
        description: "Gặp lỗi khi gọi API",
      });
    }
  };

  const handleAddNote = async () => {
    setIsAddingNote(true);
    const response = await fetch(`/api/borrow/${slipId}/borrow-slip-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventType: "NOTE",
        description: noteContent,
      }),
    });
    setIsAddingNote(false);
    if (response.ok) {
      toast.success("Thành công", {
        description: "Đã thêm ghi chú",
      });
      setNoteContent("");
      setIsAddingNote(false);
      onSuccess?.();
    } else {
      toast.error("Lỗi", {
        description: response.statusText || "Có lỗi xảy ra",
      });
    }
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

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
      </form >

      {/* Right: Selected Files List or borrowEvent */}
      < div className="max-w-md w-full flex flex-col gap-4 border-l border-slate-100 pl-8" >
        <div className="flex items-center justify-between">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('files')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${activeTab === 'files' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FileText className="w-3.5 h-3.5" />
              Danh sách hồ sơ
              <span className="bg-indigo-100 text-indigo-700 px-1.5 rounded-full text-[10px]">
                {selectedFiles.length}
              </span>
            </button>
            {slipId && (
              <button
                onClick={() => setActiveTab('borrowEvent')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${activeTab === 'borrowEvent' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <History className="w-3.5 h-3.5" />
                Nhật ký
              </button>
            )}
          </div>
        </div>

        {
          activeTab === 'files' ? (
            <>
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
            </>
          ) : ( /* borrowEvent layout*/
            <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col h-full relative">
              <div className="p-2 border-b border-slate-200 bg-white flex justify-between items-center">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider pl-2">Timeline</h4>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsAddingNote(!isAddingNote)}>
                  <Plus className="w-3 h-3 mr-1" /> Thêm ghi chú
                </Button>
              </div>

              {isAddingNote && (
                <div className="p-3 bg-white border-b border-slate-200 animate-in slide-in-from-top-2">
                  <Textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Nhập ghi chú..."
                    className="mb-2 text-xs min-h-[60px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsAddingNote(false)}>Hủy</Button>
                    <Button size="sm" className="h-7 text-xs" onClick={handleAddNote} disabled={isSavingNote || !noteContent.trim()}>
                      {isSavingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : "Lưu"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="absolute inset-0 top-[44px] data-[adding=true]:top-[150px] overflow-auto p-4 transition-all" data-adding={isAddingNote}>
                <ol className="relative border-s border-indigo-200 ml-3">
                  {borrowEvent.length === 0 && (
                    <li className="mb-10 ms-6 text-slate-500 text-sm italic">Chưa có nhật ký nào.</li>
                  )}
                  {borrowEvent.map((log) => (
                    <li key={log.id} className="mb-10 ms-6">
                      <span className="absolute flex items-center justify-center w-6 h-6 bg-indigo-100 rounded-full -start-3 ring-8 ring-white">
                        <History className="w-3 h-3 text-indigo-600" />
                      </span>
                      <time className="bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium px-1.5 py-0.5 rounded">
                        {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm")}
                      </time>
                      <h3 className="flex items-center mb-1 text-sm font-semibold text-slate-800 my-2">
                        {log.eventType}
                        {/* Show user if available */}
                        {log.creator && <span className="ms-2 font-normal text-slate-500">bởi {log.creator.fullName}</span>}
                      </h3>
                      <div className="text-xs text-slate-600 mb-4 bg-white p-2 rounded border border-slate-100 shadow-sm">
                        {log.description && <p className="font-medium mb-1">{log.description}</p>}
                        <p className="truncate opacity-75">{JSON.stringify(log.details)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )
        }
      </div >
    </div >
  );
}
