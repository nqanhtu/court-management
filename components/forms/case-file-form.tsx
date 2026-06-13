'use client'

import { apiFetch } from '@/lib/api/client'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'
import type { StorageBoxDto } from '@/lib/api/types'
import { queryClient } from '@/src/lib/query-client'
import { queryKeys } from '@/src/lib/query-keys'
import { AutocompleteInput } from '@/components/ui/autocomplete-input'
import { useAutocompleteSuggestions } from '@/lib/hooks/use-autocomplete-suggestions'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useRouter } from '@/src/lib/router'

interface CaseFileFormProps {
  onSuccess: (fileId?: string, action?: 'save' | 'save_and_continue' | 'save_and_add_child') => void
  onCancel: () => void
  isDirty: boolean
  setIsDirty: (dirty: boolean) => void
}

export function CaseFileForm({ onSuccess, onCancel, isDirty, setIsDirty }: CaseFileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [submitAction, setSubmitAction] = useState<'save' | 'save_and_continue' | 'save_and_add_child'>('save')
  const [boxes, setBoxes] = useState<StorageBoxDto[]>([])
  const { suggestions } = useAutocompleteSuggestions()
  const codeInputRef = useRef<HTMLInputElement>(null)

  const initialFormState = {
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

  const [formData, setFormData] = useState(initialFormState)

  const handleFieldChange = (key: keyof typeof initialFormState, val: any) => {
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
      return
    }
    if (!formData.year) {
      toast.error('Vui lòng nhập Năm')
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
          year: formData.year,
          retention: formData.retention,
          note: formData.note,
          datetime: new Date(),
          judgmentNumber: formData.judgmentNumber,
          judgmentDate: formData.judgmentDate ? new Date(formData.judgmentDate) : null,
          pageCount: formData.pageCount,
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

  const handleBoxbyYear = async (year: number) => {
    if (!year) return
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
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S -> Lưu hồ sơ
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        setSubmitAction('save')
        handleManualSubmit(undefined, 'save')
      }
      // Ctrl/Cmd + Enter -> Lưu & nhập tiếp
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        setSubmitAction('save_and_continue')
        handleManualSubmit(undefined, 'save_and_continue')
      }
      // Esc -> Quay lại danh sách (onCancel will trigger the confirmation dialog if dirty)
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [formData, isDirty])

  return (
    <form onSubmit={(e) => handleManualSubmit(e)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Column 1: General Info */}
        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-base font-semibold text-foreground border-b pb-2">Thông tin chung</h3>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-red-600 font-semibold flex items-center gap-1">
                Mã hồ sơ <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={codeInputRef}
                id="code"
                placeholder="VD: HS-001"
                value={formData.code}
                onChange={(e) => handleFieldChange('code', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Loại án</Label>
              <AutocompleteInput
                id="type"
                value={formData.type}
                suggestions={suggestions.types}
                onValueChange={(val) => handleFieldChange('type', val)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year" className="flex items-center gap-1 font-semibold">
                Năm <span className="text-red-500">*</span>
              </Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => handleFieldChange('year', parseInt(e.target.value) || '')}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="font-semibold flex items-center gap-1">
              Tiêu đề / Trích yếu <span className="text-red-500">*</span>
            </Label>
            <AutocompleteInput
              id="title"
              placeholder="Về việc..."
              value={formData.title}
              suggestions={suggestions.titles}
              onValueChange={(val) => handleFieldChange('title', val)}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="retention">Bảo quản</Label>
              <AutocompleteInput
                id="retention"
                placeholder="10 năm"
                value={formData.retention}
                suggestions={suggestions.retentions}
                onValueChange={(val) => handleFieldChange('retention', val)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pageCount">Số bút lục</Label>
              <Input
                id="pageCount"
                type="number"
                value={formData.pageCount}
                onChange={(e) => handleFieldChange('pageCount', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="boxId">Hộp số (Mã hộp)</Label>
            <AutocompleteInput
              id="boxId"
              placeholder="Tìm kiếm hộp lưu trữ..."
              value={formData.boxId}
              suggestions={boxOptions}
              onValueChange={(val) => handleFieldChange('boxId', val)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Ghi chú</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => handleFieldChange('note', e.target.value)}
              className="min-h-20 resize-none"
            />
          </div>
        </div>

        {/* Column 2: Case/Judgment Details */}
        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-base font-semibold text-foreground border-b pb-2">Chi tiết vụ án</h3>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="judgmentNumber">Số bản án/Quyết định</Label>
              <Input
                id="judgmentNumber"
                placeholder="01/2024/HSST"
                value={formData.judgmentNumber}
                onChange={(e) => handleFieldChange('judgmentNumber', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="judgmentDate">Ngày xét xử</Label>
              <Input
                id="judgmentDate"
                type="date"
                value={formData.judgmentDate}
                onChange={(e) => handleFieldChange('judgmentDate', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plaintiffs" className="text-blue-600 font-medium">Nguyên đơn (cách nhau bởi dấu phẩy)</Label>
            <Input
              id="plaintiffs"
              placeholder="Lê Thị C"
              value={formData.plaintiffs}
              onChange={(e) => handleFieldChange('plaintiffs', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="civilDefendants" className="text-orange-600 font-medium">Bị đơn (cách nhau bởi dấu phẩy)</Label>
            <Input
              id="civilDefendants"
              placeholder="Công ty X"
              value={formData.civilDefendants}
              onChange={(e) => handleFieldChange('civilDefendants', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Hủy
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            variant="outline"
            disabled={isLoading}
            onClick={() => setSubmitAction('save_and_add_child')}
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
              >
                {isLoading && submitAction === 'save_and_continue' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu & nhập tiếp
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Phím tắt: Ctrl + Enter
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                disabled={isLoading}
                onClick={() => setSubmitAction('save')}
              >
                {isLoading && submitAction === 'save' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu hồ sơ
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Phím tắt: Ctrl + S
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </form>
  )
}
