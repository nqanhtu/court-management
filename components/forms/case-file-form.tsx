'use client'

import { apiFetch } from '@/lib/api/client'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { StorageBoxDto } from '@/lib/api/types'
import { queryClient } from '@/src/lib/query-client'
import { queryKeys } from '@/src/lib/query-keys'
import { AutocompleteInput } from '@/components/ui/autocomplete-input'
import { useAutocompleteSuggestions } from '@/lib/hooks/use-autocomplete-suggestions'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface CaseFileFormProps {
  onSuccess: (fileId?: string, action?: 'save' | 'save_and_continue' | 'save_and_add_child') => void
  onCancel: () => void
  isDirty: boolean
  setIsDirty: (dirty: boolean) => void
}

export interface CaseFileFormState {
  code: string
  title: string
  type: string
  year: number | ''
  retention: string
  note: string
  judgmentNumber: string
  judgmentDate: string
  pageCount: number
  defendants: string
  plaintiffs: string
  civilDefendants: string
  boxId: string
}

export function CaseFileForm({ onSuccess, onCancel, setIsDirty }: CaseFileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isBoxesLoading, setIsBoxesLoading] = useState(false)
  const [submitAction, setSubmitAction] = useState<'save' | 'save_and_continue' | 'save_and_add_child'>('save')
  const [boxes, setBoxes] = useState<StorageBoxDto[]>([])
  const { suggestions } = useAutocompleteSuggestions()
  const codeInputRef = useRef<HTMLInputElement>(null)

  const initialFormState: CaseFileFormState = {
    code: '',
    title: '',
    type: '',
    year: new Date().getFullYear(),
    retention: '10 năm',
    note: '',
    judgmentNumber: '',
    judgmentDate: '',
    pageCount: 0,
    defendants: '',
    plaintiffs: '',
    civilDefendants: '',
    boxId: ''
  }

  const [formData, setFormData] = useState<CaseFileFormState>(initialFormState)

  const handleFieldChange = <K extends keyof CaseFileFormState>(key: K, val: CaseFileFormState[K]) => {
    setFormData((prev) => ({ ...prev, [key]: val }))
    setIsDirty(true)
  }

  const handleManualSubmit = async (e?: React.FormEvent, overrideAction?: 'save' | 'save_and_continue' | 'save_and_add_child') => {
    if (e) e.preventDefault()
    
    // Validate required fields
    if (!formData.code.trim()) {
      toast.error('Vui lòng nhập Mã hồ sơ')
      codeInputRef.current?.focus()
      return
    }
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập Tiêu đề / Trích yếu')
      window.document.getElementById('title')?.focus()
      return
    }
    
    const yearVal = formData.year;
    if (!yearVal || isNaN(Number(yearVal))) {
      toast.error('Vui lòng nhập Năm hợp lệ')
      window.document.getElementById('year')?.focus()
      return
    }

    const action = overrideAction || submitAction
    setIsLoading(true)

    try {
      const splitToList = (str: string) => str ? str.split(',').map(s => s.trim()).filter(Boolean) : []

      const response = await apiFetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code,
          title: formData.title,
          type: formData.type,
          year: Number(formData.year),
          retention: formData.retention,
          note: formData.note,
          datetime: new Date(),
          judgmentNumber: formData.judgmentNumber,
          judgmentDate: formData.judgmentDate ? new Date(formData.judgmentDate) : null,
          pageCount: Number(formData.pageCount) || 0,
          defendants: splitToList(formData.defendants),
          plaintiffs: splitToList(formData.plaintiffs),
          civilDefendants: splitToList(formData.civilDefendants),
          boxId: formData.boxId || null
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Tạo hồ sơ thành công')
        queryClient.invalidateQueries({ queryKey: queryKeys.files.all })
        queryClient.invalidateQueries({ queryKey: queryKeys.files.stats })
        queryClient.invalidateQueries({ queryKey: queryKeys.boxes.all })

        const fileId = result.file?.id

        setIsDirty(false)

        if (action === 'save_and_continue') {
          // Reset only case-specific fields, keep others
          setFormData((prev) => ({
            code: '',
            title: '',
            type: prev.type,
            year: prev.year,
            retention: prev.retention,
            note: '',
            judgmentNumber: '',
            judgmentDate: '',
            pageCount: 0,
            defendants: '',
            plaintiffs: '',
            civilDefendants: '',
            boxId: prev.boxId
          }))
          setTimeout(() => {
            codeInputRef.current?.focus()
          }, 50)
          onSuccess(fileId, 'save_and_continue')
        } else {
          onSuccess(fileId, action)
        }
      } else {
        toast.error('Tạo thất bại: ' + (result.error || 'Lỗi không xác định'))
      }
    } catch (error) {
      console.error(error)
      toast.error('Có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBoxbyYear = async (year: number | '') => {
    if (!year) {
      setBoxes([])
      return
    }
    setIsBoxesLoading(true)
    try {
      const response = await apiFetch(`/api/admin/boxes?year=${year}`)
      if (response.ok) {
        const data = await response.json()
        setBoxes(data)
      } else {
        setBoxes([])
      }
    } catch (error) {
      console.error("Failed to fetch boxes", error)
      setBoxes([])
    } finally {
      setIsBoxesLoading(false)
    }
  }

  useEffect(() => {
    handleBoxbyYear(formData.year)
  }, [formData.year])

  const boxOptions = boxes.map((b) => ({
    value: b.id,
    label: `${b.code} (Kệ: ${b.shelf}) ${b.agency?.name ? `- Phông: ${b.agency.name}` : ''}`
  }))

  // Keyboard Shortcuts handler
  const handleManualSubmitRef = useRef(handleManualSubmit)
  const onCancelRef = useRef(onCancel)

  useEffect(() => {
    handleManualSubmitRef.current = handleManualSubmit
    onCancelRef.current = onCancel
  })

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return

      // Ctrl/Cmd + S -> Lưu hồ sơ
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleManualSubmitRef.current(undefined, 'save')
      }
      // Ctrl/Cmd + Enter -> Lưu & nhập tiếp
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleManualSubmitRef.current(undefined, 'save_and_continue')
      }
      // Esc -> Quay lại danh sách
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancelRef.current()
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [isLoading])

  return (
    <form onSubmit={(e) => handleManualSubmit(e)} noValidate className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Column 1: General Info */}
        <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-foreground">Thông tin chung</h3>
            <p className="text-[11px] text-muted-foreground">Các trường thông tin phân loại lưu trữ và định dạng cơ bản của hồ sơ.</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="code" className="text-xs font-semibold text-foreground flex items-center gap-1">
                Mã hồ sơ <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={codeInputRef}
                id="code"
                placeholder="VD: HS-001"
                value={formData.code}
                onChange={(e) => handleFieldChange('code', e.target.value)}
                className="h-9 text-xs rounded-md"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="type" className="text-xs font-semibold text-foreground">Loại án</Label>
              <AutocompleteInput
                id="type"
                value={formData.type}
                suggestions={suggestions.types}
                onValueChange={(val) => handleFieldChange('type', val)}
                className="h-9 text-xs rounded-md"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="year" className="text-xs font-semibold text-foreground flex items-center gap-1">
                Năm <span className="text-red-500">*</span>
              </Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => handleFieldChange('year', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                className="h-9 text-xs rounded-md font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="title" className="text-xs font-semibold text-foreground flex items-center gap-1">
              Tiêu đề / Trích yếu <span className="text-red-500">*</span>
            </Label>
            <AutocompleteInput
              id="title"
              placeholder="Về việc..."
              value={formData.title}
              suggestions={suggestions.titles}
              onValueChange={(val) => handleFieldChange('title', val)}
              className="h-9 text-xs rounded-md"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="retention" className="text-xs font-semibold text-foreground">Bảo quản</Label>
              <AutocompleteInput
                id="retention"
                placeholder="10 năm"
                value={formData.retention}
                suggestions={suggestions.retentions}
                onValueChange={(val) => handleFieldChange('retention', val)}
                className="h-9 text-xs rounded-md"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pageCount" className="text-xs font-semibold text-foreground">Số bút lục</Label>
              <Input
                id="pageCount"
                type="number"
                value={formData.pageCount === 0 && formData.pageCount !== undefined ? '' : formData.pageCount}
                onChange={(e) => {
                  const val = e.target.value;
                  handleFieldChange('pageCount', val === '' ? 0 : parseInt(val) || 0);
                }}
                className="h-9 text-xs rounded-md font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="boxId" className="text-xs font-semibold text-foreground">Hộp số (Mã hộp)</Label>
            <AutocompleteInput
              id="boxId"
              placeholder="Tìm theo mã hộp, kệ hoặc phông..."
              value={formData.boxId}
              suggestions={boxOptions}
              onValueChange={(val) => handleFieldChange('boxId', val)}
              className="h-9 text-xs rounded-md"
            />
            {isBoxesLoading ? (
              <p className="text-[11px] text-muted-foreground animate-pulse">Đang tải hộp lưu trữ theo năm...</p>
            ) : formData.year && boxes.length === 0 ? (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Chưa có hộp lưu trữ phù hợp với năm đã chọn.</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">Tìm theo mã hộp, kệ hoặc phông lưu trữ.</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="note" className="text-xs font-semibold text-foreground">Ghi chú</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => handleFieldChange('note', e.target.value)}
              className="min-h-[72px] text-xs resize-none"
            />
          </div>
        </div>

        {/* Column 2: Case/Judgment Details */}
        <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-foreground">Chi tiết vụ án</h3>
            <p className="text-[11px] text-muted-foreground">Các trường thông tin chi tiết về nội dung xét xử và các đương sự liên quan.</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="judgmentNumber" className="text-xs font-semibold text-foreground">Số bản án/Quyết định</Label>
              <Input
                id="judgmentNumber"
                placeholder="Ví dụ: 01/2024/HSST..."
                value={formData.judgmentNumber}
                onChange={(e) => handleFieldChange('judgmentNumber', e.target.value)}
                className="h-9 text-xs rounded-md"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="judgmentDate" className="text-xs font-semibold text-foreground">Ngày xét xử</Label>
              <Input
                id="judgmentDate"
                type="date"
                value={formData.judgmentDate}
                onChange={(e) => handleFieldChange('judgmentDate', e.target.value)}
                className="h-9 text-xs rounded-md"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="plaintiffs" className="text-xs font-semibold text-foreground">Nguyên đơn</Label>
            <Input
              id="plaintiffs"
              placeholder="Ví dụ: Lê Thị C, Nguyễn Văn D..."
              value={formData.plaintiffs}
              onChange={(e) => handleFieldChange('plaintiffs', e.target.value)}
              className="h-9 text-xs rounded-md"
            />
            <p className="text-[9px] text-muted-foreground">Nhập nhiều tên bằng dấu phẩy.</p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="civilDefendants" className="text-xs font-semibold text-foreground">Bị đơn / Bị cáo</Label>
            <Input
              id="civilDefendants"
              placeholder="Ví dụ: Công ty X, Trần Văn Y..."
              value={formData.civilDefendants}
              onChange={(e) => handleFieldChange('civilDefendants', e.target.value)}
              className="h-9 text-xs rounded-md"
            />
            <p className="text-[9px] text-muted-foreground">Nhập nhiều tên bằng dấu phẩy.</p>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4 sticky bottom-0 bg-background/95 py-2 backdrop-blur-xs">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-9 text-xs font-semibold rounded-lg border-slate-300 dark:border-slate-700"
        >
          Hủy
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            variant="outline"
            disabled={isLoading}
            onClick={() => setSubmitAction('save_and_add_child')}
            className="h-9 text-xs font-semibold rounded-lg border-slate-300 dark:border-slate-700"
          >
            {isLoading && submitAction === 'save_and_add_child' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu và thêm hồ sơ con
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                variant="secondary"
                disabled={isLoading}
                onClick={() => setSubmitAction('save_and_continue')}
                className="h-9 text-xs font-semibold rounded-lg"
              >
                {isLoading && submitAction === 'save_and_continue' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu & nhập tiếp
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              Phím tắt: Ctrl + Enter
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                disabled={isLoading}
                onClick={() => setSubmitAction('save')}
                className="h-9 text-xs font-semibold rounded-lg"
              >
                {isLoading && submitAction === 'save' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu hồ sơ
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              Phím tắt: Ctrl + S
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </form>
  )
}
