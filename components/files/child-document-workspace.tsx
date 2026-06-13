'use client';

import { apiFetch } from '@/lib/api/client';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AutocompleteInput } from '@/components/ui/autocomplete-input';
import { useAutocompleteSuggestions } from '@/lib/hooks/use-autocomplete-suggestions';
import { cn } from '@/lib/utils';
import { FileText, Plus, Pencil, Trash2, Loader2, Keyboard, CheckCircle2 } from 'lucide-react';
import type { DocumentDto } from '@/lib/api/types';
import { toast } from 'sonner';

export type WorkspaceMode = 'idle' | 'create' | 'edit';

export interface ChildDocumentDraft {
    id?: string;
    fileId: string;
    title: string;
    code?: string;
    year?: number;
    pageCount?: number;
    order?: number;
    note?: string;
    preservationTime?: string;
    contentIndex?: string;
}

export interface RecentChildDocument {
    id: string;
    order: number;
    title: string;
    pageCount: number;
}

interface ChildDocumentWorkspaceProps {
    fileId: string;
    parentYear?: number;
    parentRetention?: string;
    documents: DocumentDto[];
    canManage: boolean;
    onMutate: () => void;
    entryMode?: 'create' | 'idle';
}

export function ChildDocumentWorkspace({
    fileId,
    parentYear,
    parentRetention,
    documents,
    canManage,
    onMutate,
    entryMode = 'idle'
}: ChildDocumentWorkspaceProps) {
    const [mode, setMode] = useState<WorkspaceMode>('idle');
    const [draft, setDraft] = useState<ChildDocumentDraft>({
        fileId,
        title: '',
        code: '',
        contentIndex: '',
        year: parentYear || new Date().getFullYear(),
        pageCount: 0,
        order: 1,
        preservationTime: parentRetention || '',
        note: ''
    });

    const [isDirty, setIsDirty] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [recentlyAdded, setRecentlyAdded] = useState<RecentChildDocument[]>([]);
    const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const scrollToWorkspace = () => {
        setTimeout(() => {
            const el = window.document.getElementById('documents-card');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    // Synchronize entryMode URL parameter
    useEffect(() => {
        if (entryMode === 'create' && canManage) {
            setMode('create');
            const nextOrder = documents.length > 0 ? Math.max(...documents.map(d => d.order || 0)) + 1 : 1;
            setDraft({
                fileId,
                title: '',
                code: '',
                contentIndex: '',
                year: parentYear || new Date().getFullYear(),
                pageCount: 0,
                order: nextOrder,
                preservationTime: parentRetention || '',
                note: ''
            });
            setIsDirty(false);
            scrollToWorkspace();
            setTimeout(() => {
                window.document.getElementById('workspace-title')?.focus();
            }, 300);
        }
    }, [entryMode, canManage, fileId, parentYear, parentRetention, documents.length]);

    const handleStartCreate = () => {
        const nextOrder = documents.length > 0 ? Math.max(...documents.map(d => d.order || 0)) + 1 : 1;
        setDraft({
            fileId,
            title: '',
            code: '',
            contentIndex: '',
            year: parentYear || new Date().getFullYear(),
            pageCount: 0,
            order: nextOrder,
            preservationTime: parentRetention || '',
            note: ''
        });
        setIsDirty(false);
        setMode('create');
        setSuccessMessage(null);
        scrollToWorkspace();
        setTimeout(() => {
            window.document.getElementById('workspace-title')?.focus();
        }, 100);
    };

    const handleStartEdit = (doc: DocumentDto) => {
        if (isDirty) {
            toast.warning('Vui lòng hoàn thành hoặc hủy bỏ văn bản đang nhập dở.');
            return;
        }
        setDraft({
            id: doc.id,
            fileId,
            title: doc.title || '',
            code: doc.code || '',
            contentIndex: doc.contentIndex || '',
            year: doc.year || parentYear || new Date().getFullYear(),
            pageCount: doc.pageCount || 0,
            order: doc.order || 1,
            preservationTime: doc.preservationTime || parentRetention || '',
            note: doc.note || ''
        });
        setIsDirty(false);
        setMode('edit');
        setSuccessMessage(null);
        scrollToWorkspace();
        setTimeout(() => {
            window.document.getElementById('workspace-title')?.focus();
        }, 100);
    };

    const handleDraftChange = <K extends keyof ChildDocumentDraft>(key: K, value: ChildDocumentDraft[K]) => {
        setDraft(prev => ({ ...prev, [key]: value }));
        setIsDirty(true);
    };

    const handleCancel = () => {
        if (isDirty) {
            setShowConfirm(true);
        } else {
            setMode('idle');
            setSuccessMessage(null);
        }
    };

    const handleConfirmCancel = () => {
        setIsDirty(false);
        setShowConfirm(false);
        setMode('idle');
        setSuccessMessage(null);
    };

    const handleSave = async (continueAfterSave = false) => {
        if (!draft.title.trim()) {
            toast.error('Vui lòng nhập trích yếu văn bản');
            window.document.getElementById('workspace-title')?.focus();
            return;
        }

        setIsLoading(true);
        try {
            const isEdit = mode === 'edit';
            const url = isEdit ? `/api/documents/${draft.id}` : '/api/documents';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await apiFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(draft)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast.success(isEdit ? 'Cập nhật văn bản thành công' : 'Thêm văn bản thành công');
                setIsDirty(false);
                onMutate();

                const savedId = result.document?.id || draft.id || '';
                setHighlightedRowId(savedId);
                setTimeout(() => setHighlightedRowId(null), 3000);

                if (!isEdit) {
                    const newRecent: RecentChildDocument = {
                        id: savedId,
                        order: Number(draft.order) || 1,
                        title: draft.title,
                        pageCount: Number(draft.pageCount) || 0
                    };
                    setRecentlyAdded(prev => [newRecent, ...prev].slice(0, 5));
                }

                if (!isEdit && continueAfterSave) {
                    setSuccessMessage(`Đã thêm thành công văn bản TT ${draft.order}`);
                    setDraft(prev => ({
                        fileId: prev.fileId,
                        title: '',
                        code: '',
                        contentIndex: '',
                        year: prev.year,
                        pageCount: 0,
                        order: (prev.order || 0) + 1,
                        preservationTime: prev.preservationTime,
                        note: ''
                    }));
                    setTimeout(() => {
                        window.document.getElementById('workspace-title')?.focus();
                    }, 50);
                } else {
                    setMode('idle');
                    setSuccessMessage(null);
                }
            } else {
                toast.error(result.message || result.error || 'Lưu thất bại');
            }
        } catch (error) {
            console.error(error);
            toast.error('Có lỗi xảy ra khi lưu tài liệu');
        } finally {
            setIsLoading(false);
        }
    };

    // Keyboard trigger refs setup to comply with strict React dependencies
    const saveRef = useRef(handleSave);
    const cancelRef = useRef(handleCancel);

    useEffect(() => {
        saveRef.current = handleSave;
        cancelRef.current = handleCancel;
    });

    useEffect(() => {
        if (mode === 'idle') return;

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (isLoading) return;

            // Ctrl/Cmd + Enter -> Lưu & thêm tiếp
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (mode === 'create') {
                    saveRef.current(true);
                } else {
                    saveRef.current(false);
                }
            }

            // Ctrl/Cmd + S -> Lưu và đóng
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                saveRef.current(false);
            }

            // Esc -> Hủy / Đóng
            if (e.key === 'Escape') {
                e.preventDefault();
                cancelRef.current();
            }

            // Alt + N -> Focus trích yếu
            if (e.altKey && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                window.document.getElementById('workspace-title')?.focus();
            }

            // Alt + O -> Focus số thứ tự
            if (e.altKey && e.key.toLowerCase() === 'o') {
                e.preventDefault();
                window.document.getElementById('workspace-order')?.focus();
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => {
            window.removeEventListener('keydown', handleGlobalKeyDown);
        };
    }, [mode, isLoading]);

    const isWorkspaceActive = mode !== 'idle';

    return (
        <Card id="documents-card" className={cn("transition-all duration-300", isWorkspaceActive && "ring-1 ring-primary/20 bg-slate-50/30")}>
            <CardHeader className="border-b pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="flex items-center text-sm font-bold">
                        <FileText className="mr-2 h-4 w-4 text-primary" />
                        Mục lục văn bản ({documents.length})
                    </CardTitle>
                    {canManage && !isWorkspaceActive && (
                        <Button size="sm" onClick={handleStartCreate} className="gap-1.5 h-8 text-xs font-semibold rounded-lg">
                            <Plus className="w-3.5 h-3.5" />
                            Thêm văn bản
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                <TooltipProvider>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
                        {/* Table column */}
                        <div className={cn("transition-all duration-300", isWorkspaceActive ? "lg:col-span-8" : "lg:col-span-12")}>
                            {documents.length > 0 ? (
                                <ChildDocumentTable
                                    documents={documents}
                                    canManage={canManage}
                                    highlightedId={highlightedRowId}
                                    onEdit={handleStartEdit}
                                    onMutate={onMutate}
                                />
                            ) : (
                                <div className={cn(
                                    "flex flex-col items-center justify-center text-center border-2 border-dashed rounded-xl",
                                    isWorkspaceActive ? "p-4 py-6 bg-muted/5" : "p-8 py-12"
                                )}>
                                    <FileText className={cn("text-muted-foreground/60 mb-2", isWorkspaceActive ? "h-7 w-7" : "h-10 w-10")} />
                                    <h3 className="text-sm font-bold text-foreground mb-1">Chưa có văn bản con</h3>
                                    <p className="text-xs text-muted-foreground max-w-sm mb-3">
                                        {isWorkspaceActive ? "Văn bản vừa lưu sẽ xuất hiện tại đây." : "Nhập văn bản con để hoàn thiện mục lục tài liệu."}
                                    </p>
                                    {canManage && !isWorkspaceActive && (
                                        <Button size="sm" onClick={handleStartCreate} className="gap-1.5 h-8 text-xs font-semibold rounded-lg">
                                            <Plus className="w-3.5 h-3.5" />
                                            Thêm văn bản
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Sidebar Workspace column */}
                        {isWorkspaceActive && (
                            <div className="lg:col-span-4 lg:sticky lg:top-[90px] self-start w-full">
                                <ChildDocumentEntryPanel
                                    mode={mode}
                                    draft={draft}
                                    isLoading={isLoading}
                                    isDirty={isDirty}
                                    onDraftChange={handleDraftChange}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                    successMessage={successMessage}
                                    recentlyAdded={recentlyAdded}
                                    onEditRecent={(item) => {
                                        let match = documents.find(d => d.id === item.id);
                                        if (!match) {
                                            match = documents.find(d => d.order === item.order && d.title === item.title);
                                        }
                                        if (match) {
                                            handleStartEdit(match);
                                        } else {
                                            toast.error('Không tìm thấy tài liệu này trong bảng mục lục');
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </TooltipProvider>
            </CardContent>

            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent className="rounded-2xl max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hủy nhập văn bản?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            Thông tin đang nhập sẽ bị mất.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel onClick={() => setShowConfirm(false)} className="rounded-xl h-9">Tiếp tục nhập</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={handleConfirmCancel} className="rounded-xl h-9">Hủy</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}

// ----------------------------------------------------
// ChildDocumentTable Component
// ----------------------------------------------------
// ChildDocumentTable Component
// ----------------------------------------------------
interface TableProps {
    documents: DocumentDto[];
    canManage: boolean;
    highlightedId: string | null;
    onEdit: (doc: DocumentDto) => void;
    onMutate: () => void;
}

function ChildDocumentTable({ documents, canManage, highlightedId, onEdit, onMutate }: TableProps) {
    return (
        <div className="overflow-x-auto rounded-lg border">
            <Table className="w-full min-w-[650px]">
                <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[70px] text-xs font-semibold text-foreground py-2.5">TT</TableHead>
                        <TableHead className="text-xs font-semibold text-foreground py-2.5">Trích yếu / Tên văn bản</TableHead>
                        <TableHead className="text-xs font-semibold text-foreground py-2.5">Mã VB</TableHead>
                        <TableHead className="text-xs font-semibold text-foreground py-2.5">Thời gian</TableHead>
                        <TableHead className="text-right text-xs font-semibold text-foreground py-2.5">Số tờ</TableHead>
                        <TableHead className="text-xs font-semibold text-foreground py-2.5">Ghi chú</TableHead>
                        {canManage && <TableHead className="w-[80px] py-2.5"></TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {documents.map((doc, index) => {
                        const isHighlighted = highlightedId === doc.id;
                        return (
                            <TableRow 
                                key={doc.id} 
                                className={cn(
                                    "hover:bg-muted/20 transition-colors border-b",
                                    isHighlighted && "bg-emerald-500/10 dark:bg-emerald-500/20 animate-pulse border-emerald-500/20"
                                )}
                            >
                                <TableCell className="font-mono text-xs py-2.5 tabular-nums text-muted-foreground">{doc.order || index + 1}</TableCell>
                                <TableCell className="font-semibold text-xs text-foreground max-w-[280px] py-2.5 break-words">
                                    {doc.title}
                                    {doc.contentIndex && <div className="text-[10px] text-muted-foreground font-normal mt-1">MLVB: {doc.contentIndex}</div>}
                                </TableCell>
                                <TableCell className="text-xs py-2.5 font-mono">{doc.code || '-'}</TableCell>
                                <TableCell className="font-mono text-xs py-2.5 tabular-nums">{doc.year || '-'}</TableCell>
                                <TableCell className="text-right font-mono text-xs py-2.5 tabular-nums">{doc.pageCount || 0}</TableCell>
                                <TableCell className="text-muted-foreground text-xs max-w-[120px] truncate py-2.5" title={doc.note ?? undefined}>{doc.note || '-'}</TableCell>
                                {canManage && (
                                    <TableCell className="py-2.5">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" onClick={() => onEdit(doc)} className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md" aria-label="Chỉnh sửa văn bản">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent className="text-xs">Chỉnh sửa văn bản</TooltipContent>
                                            </Tooltip>
                                            <ChildDocumentDeleteDialog docId={doc.id} docTitle={doc.title || ''} onMutate={onMutate} />
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

// ----------------------------------------------------
// ChildDocumentDeleteDialog Component
// ----------------------------------------------------
function ChildDocumentDeleteDialog({ docId, docTitle, onMutate }: { docId: string; docTitle: string; onMutate: () => void }) {
    const handleDelete = async () => {
        try {
            const res = await apiFetch(`/api/documents/${docId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success('Xóa văn bản thành công');
                onMutate();
            } else {
                toast.error('Gặp lỗi khi xóa văn bản');
            }
        } catch {
            toast.error('Gặp lỗi khi xóa văn bản');
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Xóa văn bản" className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-md">
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">Xóa văn bản</TooltipContent>
                </Tooltip>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl max-w-[400px]">
                <AlertDialogHeader>
                    <AlertDialogTitle>Xóa văn bản?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm">
                        Hành động này không thể hoàn tác. Văn bản <span className="font-semibold text-foreground">"{docTitle}"</span> sẽ bị xóa khỏi mục lục hồ sơ.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="rounded-xl h-9">Hủy</AlertDialogCancel>
                    <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-xl h-9" onClick={handleDelete}>Xóa</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// ----------------------------------------------------
// ChildDocumentEntryPanel Component
// ----------------------------------------------------
interface EntryPanelProps {
    mode: WorkspaceMode;
    draft: ChildDocumentDraft;
    isLoading: boolean;
    isDirty: boolean;
    onDraftChange: <K extends keyof ChildDocumentDraft>(key: K, value: ChildDocumentDraft[K]) => void;
    onSave: (continueAfterSave: boolean) => void;
    onCancel: () => void;
    successMessage: string | null;
    recentlyAdded?: RecentChildDocument[];
    onEditRecent?: (item: RecentChildDocument) => void;
}

function ChildDocumentEntryPanel({
    mode,
    draft,
    isLoading,
    onDraftChange,
    onSave,
    onCancel,
    successMessage,
    recentlyAdded = [],
    onEditRecent
}: EntryPanelProps) {
    const { suggestions } = useAutocompleteSuggestions();
    const isEdit = mode === 'edit';

    return (
        <div className="rounded-xl border bg-card shadow-sm flex flex-col max-h-[calc(100vh-8rem)]">
            {/* Header: static */}
            <div className="flex items-center justify-between border-b p-4 pb-3 shrink-0">
                <div>
                    <h3 className="text-xs font-bold text-foreground">
                        {isEdit ? 'Cập nhật văn bản' : 'Nhập văn bản con'}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">TT hiện tại: {draft.order}</p>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground border px-1.5 py-0.5 rounded bg-muted/40 font-mono">
                    <Keyboard className="h-3 w-3" />
                    <span>Esc: Hủy</span>
                </div>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto p-4 pt-3 space-y-3 flex-grow min-h-0">
                {successMessage && (
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold animate-fade-in border border-emerald-500/25">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>{successMessage}</span>
                    </div>
                )}

                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                            <Label htmlFor="workspace-order" className="text-[10px] font-semibold text-foreground">Số thứ tự <span className="text-red-500">*</span></Label>
                            <Input
                                id="workspace-order"
                                type="number"
                                value={draft.order === 0 ? '' : draft.order}
                                onChange={(e) => onDraftChange('order', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                                className="h-8 text-xs font-mono rounded-md"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="workspace-year" className="text-[10px] font-semibold text-foreground">Năm</Label>
                            <Input
                                id="workspace-year"
                                type="number"
                                value={draft.year === 0 ? '' : draft.year}
                                onChange={(e) => onDraftChange('year', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                                className="h-8 text-xs font-mono rounded-md"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="workspace-title" className="text-[10px] font-semibold text-foreground">Trích yếu / Tên văn bản <span className="text-red-500">*</span></Label>
                        <AutocompleteInput
                            id="workspace-title"
                            value={draft.title}
                            suggestions={suggestions.titles}
                            onValueChange={(val) => onDraftChange('title', val)}
                            placeholder="Nhập hoặc chọn trích yếu..."
                            className="h-8 text-xs rounded-md"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                            <Label htmlFor="workspace-contentIndex" className="text-[10px] font-semibold text-foreground">MLVB (Ký hiệu)</Label>
                            <Input
                                id="workspace-contentIndex"
                                value={draft.contentIndex}
                                onChange={(e) => onDraftChange('contentIndex', e.target.value)}
                                className="h-8 text-xs rounded-md"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="workspace-code" className="text-[10px] font-semibold text-foreground">Mã quản lý</Label>
                            <Input
                                id="workspace-code"
                                value={draft.code}
                                onChange={(e) => onDraftChange('code', e.target.value)}
                                className="h-8 text-xs rounded-md"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                            <Label htmlFor="workspace-pageCount" className="text-[10px] font-semibold text-foreground">Số tờ</Label>
                            <Input
                                id="workspace-pageCount"
                                type="number"
                                value={draft.pageCount === 0 ? '' : draft.pageCount}
                                onChange={(e) => onDraftChange('pageCount', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                                className="h-8 text-xs font-mono rounded-md"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="workspace-preservationTime" className="text-[10px] font-semibold text-foreground">Bảo quản</Label>
                            <AutocompleteInput
                                id="workspace-preservationTime"
                                value={draft.preservationTime || ''}
                                suggestions={suggestions.retentions}
                                onValueChange={(val) => onDraftChange('preservationTime', val)}
                                placeholder="VD: 10 năm..."
                                className="h-8 text-xs rounded-md"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="workspace-note" className="text-[10px] font-semibold text-foreground">Ghi chú</Label>
                        <Textarea
                            id="workspace-note"
                            value={draft.note}
                            onChange={(e) => onDraftChange('note', e.target.value)}
                            className="min-h-[40px] h-10 text-xs resize-none rounded-md"
                            rows={2}
                        />
                    </div>
                </div>

                {/* Collapsible Recently Added list inside scrollable body */}
                {recentlyAdded.length > 0 && mode === 'create' && onEditRecent && (
                    <div className="pt-2 border-t mt-3">
                        <ChildDocumentRecentList items={recentlyAdded} onEdit={onEditRecent} />
                    </div>
                )}
            </div>

            {/* Sticky Action Footer */}
            <div className="border-t p-4 pt-3 pb-3 shrink-0 bg-muted/20 flex flex-wrap items-center justify-between gap-2 rounded-b-xl">
                <Button type="button" variant="outline" size="sm" onClick={onCancel} className="h-8 text-xs rounded-lg px-3.5">
                    Hủy
                </Button>
                <div className="flex items-center gap-2">
                    {!isEdit && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    type="button" 
                                    variant="secondary" 
                                    size="sm" 
                                    disabled={isLoading}
                                    onClick={() => onSave(true)}
                                    className="h-8 text-xs rounded-lg font-semibold px-3"
                                >
                                    Lưu & tiếp <span className="text-[9px] font-normal text-muted-foreground ml-1">Ctrl+Enter</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-[10px]">Lưu và tiếp tục nhập văn bản tiếp theo (Ctrl + Enter)</TooltipContent>
                        </Tooltip>
                    )}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button 
                                type="button" 
                                size="sm" 
                                disabled={isLoading}
                                onClick={() => onSave(false)}
                                className="h-8 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-3"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : isEdit ? (
                                    'Cập nhật'
                                ) : (
                                    <>Lưu & đóng <span className="text-[9px] font-normal text-primary-foreground/70 ml-1">Ctrl+S</span></>
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-[10px]">Lưu và đóng bảng nhập (Ctrl + S)</TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------
// ChildDocumentRecentList Component
// ----------------------------------------------------
interface RecentProps {
    items: RecentChildDocument[];
    onEdit: (item: RecentChildDocument) => void;
}

function ChildDocumentRecentList({ items, onEdit }: RecentProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const displayItems = items.slice(0, 3);

    return (
        <div className="rounded-lg border bg-card p-2 shadow-sm space-y-1.5">
            <button 
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex items-center justify-between w-full text-[10px] font-bold text-muted-foreground uppercase tracking-wider hover:text-foreground"
            >
                <span>Vừa thêm trong phiên ({items.length})</span>
                <span className="text-[9px] normal-case font-normal text-primary">
                    {isCollapsed ? 'Hiện' : 'Ẩn'}
                </span>
            </button>
            
            {!isCollapsed && (
                <div className="space-y-1">
                    {displayItems.map((it) => (
                        <div key={it.id || `${it.order}-${it.title}`} className="flex items-center justify-between gap-2 p-1.5 rounded border bg-muted/20 text-xs">
                            <div className="min-w-0 flex items-center gap-1.5">
                                <span className="font-mono text-[9px] text-muted-foreground shrink-0">TT {it.order}</span>
                                <span className="font-medium truncate max-w-[120px]" title={it.title}>{it.title}</span>
                                <span className="text-[9px] text-muted-foreground shrink-0 font-mono">({it.pageCount} tờ)</span>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => onEdit(it)} 
                                className="h-5 text-[9px] text-primary hover:bg-primary/10 font-bold px-1.5 rounded"
                            >
                                Sửa
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
