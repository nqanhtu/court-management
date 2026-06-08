# Quick Data Input & Autocomplete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add autocomplete/suggestions for case types, retention periods, and document titles, and implement sticky fields (pre-filling previous values) for high-speed keyboard-driven data entry.

**Architecture:** Create a new API route `/api/files/autocomplete-suggestions` on the Elysia backend to fetch distinct values. On the frontend, build an accessible `AutocompleteInput` component using CMDK and Radix Popover, and implement state saving (in localStorage) to pre-populate inputs on form reset.

**Tech Stack:** React, TypeScript, ElysiaJS, Prisma, TanStack Query, Radix UI Popover, CMDK, Tailwind CSS.

---

### Task 1: Backend API Endpoint & Tests

Create the backend endpoint `/api/files/autocomplete-suggestions` in the Elysia API server to retrieve distinct categories, retentions, and recent titles from the database.

**Files:**
- Modify: [files.routes.ts](file:///f:/projects/court-management-api/src/api-routes/files.routes.ts)
- Modify: [files.contract.test.ts](file:///f:/projects/court-management-api/src/contracts/files.contract.test.ts)

- [ ] **Step 1: Write the failing contract test**

  Open `f:/projects/court-management-api/src/contracts/files.contract.test.ts` and add the following test at the end of the `describe('files contract')` block:
  ```ts
  test('GET /api/files/autocomplete-suggestions keeps the autocomplete suggestions response shape', async () => {
    const app = createTestApp()
    const types = [{ type: 'Hình sự' }]
    const retentions = [{ retention: '10 năm' }]
    const docPreservations = [{ preservationTime: 'Vĩnh viễn' }]
    const filesForTitles = [{ title: 'Vụ án trộm cắp tài sản' }]

    setDbForTesting({
      file: {
        findMany: async (args: any) => {
          if (args.distinct && args.distinct.includes('type')) return types
          if (args.distinct && args.distinct.includes('retention')) return retentions
          if (args.distinct && args.distinct.includes('title')) return filesForTitles
          return []
        }
      },
      document: {
        findMany: async (args: any) => {
          if (args.distinct && args.distinct.includes('preservationTime')) return docPreservations
          return []
        }
      }
    })

    const response = await app.handle(jsonRequest('/api/files/autocomplete-suggestions', {
      headers: { cookie: await sessionCookie('VIEWER') },
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      types: ['Hình sự'],
      retentions: ['10 năm'],
      titles: ['Vụ án trộm cắp tài sản']
    })
  })
  ```

- [ ] **Step 2: Run test to verify it fails**

  Run: `bun test src/contracts/files.contract.test.ts`
  Expected: FAIL with route not matching (returns 404 or fails on status match).

- [ ] **Step 3: Implement route in Elysia routes**

  Open `f:/projects/court-management-api/src/api-routes/files.routes.ts` and insert the new `.get('/api/files/autocomplete-suggestions', ...)` endpoint. **IMPORTANT:** Place it BEFORE `.get('/api/files/:id', ...)` to avoid it being captured as a parameter.
  ```ts
  .get('/api/files/autocomplete-suggestions', async ({ request, set }) => {
    try {
      const { denied } = await sessionOrDenied({ request, set }, 'viewFiles')
      if (denied) return denied

      const [distinctTypes, distinctRetentions, distinctDocPreservations, recentTitles] = await Promise.all([
        db.file.findMany({ select: { type: true }, distinct: ['type'] }),
        db.file.findMany({ select: { retention: true }, distinct: ['retention'] }),
        db.document.findMany({ select: { preservationTime: true }, distinct: ['preservationTime'] }),
        db.file.findMany({
          select: { title: true },
          orderBy: { createdAt: 'desc' },
          take: 100,
          distinct: ['title']
        })
      ])

      const predefinedTypes = ['Hình sự', 'Dân sự', 'Hành chính', 'Kinh doanh thương mại', 'Lao động', 'Hôn nhân gia đình']
      const predefinedRetentions = ['10 năm', '15 năm', '20 năm', '70 năm', 'Vĩnh viễn']

      const typesSet = new Set([...predefinedTypes, ...distinctTypes.map(t => t.type).filter(Boolean)])
      const retentionsSet = new Set([
        ...predefinedRetentions,
        ...distinctRetentions.map(r => r.retention).filter(Boolean),
        ...distinctDocPreservations.map(d => d.preservationTime).filter(Boolean)
      ])

      return {
        types: Array.from(typesSet),
        retentions: Array.from(retentionsSet),
        titles: recentTitles.map(f => f.title).filter(Boolean)
      }
    } catch (error) {
      console.error('Error fetching autocomplete suggestions:', error)
      return jsonError(set, 'Internal Server Error', 500)
    }
  })
  ```

- [ ] **Step 4: Run test to verify it passes**

  Run: `bun test src/contracts/files.contract.test.ts`
  Expected: PASS.

- [ ] **Step 5: Commit backend changes**

  ```bash
  git add src/api-routes/files.routes.ts src/contracts/files.contract.test.ts
  git commit -m "feat(api): add autocomplete suggestions route and tests"
  ```

---

### Task 2: Frontend API Integration & React Hook

Add the query keys and create a React hook to fetch autocomplete suggestions.

**Files:**
- Modify: [query-keys.ts](file:///f:/projects/court-management/src/lib/query-keys.ts)
- Create: [use-autocomplete-suggestions.ts](file:///f:/projects/court-management/lib/hooks/use-autocomplete-suggestions.ts)

- [ ] **Step 1: Register query key**

  Modify `f:/projects/court-management/src/lib/query-keys.ts` to add `autocompleteSuggestions` under `files`:
  ```ts
    files: {
      all: ['files'] as const,
      list: (params?: string) => ['files', 'list', params || ''] as const,
      detail: (id: string) => ['files', 'detail', id] as const,
      stats: ['files', 'stats'] as const,
      autocompleteSuggestions: ['files', 'autocomplete-suggestions'] as const,
    },
  ```

- [ ] **Step 2: Create React hook**

  Create file `f:/projects/court-management/lib/hooks/use-autocomplete-suggestions.ts`:
  ```ts
  import { useQuery } from '@tanstack/react-query'
  import { apiJson } from '@/lib/api/client'
  import { queryKeys } from '@/src/lib/query-keys'

  export interface AutocompleteSuggestions {
    types: string[]
    retentions: string[]
    titles: string[]
  }

  export function useAutocompleteSuggestions() {
    const query = useQuery({
      queryKey: queryKeys.files.autocompleteSuggestions,
      queryFn: () => apiJson<AutocompleteSuggestions>('/api/files/autocomplete-suggestions'),
    })

    return {
      suggestions: query.data || { types: [], retentions: [], titles: [] },
      isLoading: query.isLoading,
      isError: query.error,
    }
  }
  ```

- [ ] **Step 3: Commit hook**

  ```bash
  git add src/lib/query-keys.ts lib/hooks/use-autocomplete-suggestions.ts
  git commit -m "feat(web): add useAutocompleteSuggestions hook"
  ```

---

### Task 3: Create the UI `AutocompleteInput` component

Build a customizable, keyboard-accessible autocomplete input component using CMDK and Radix Popover.

**Files:**
- Create: [autocomplete-input.tsx](file:///f:/projects/court-management/components/ui/autocomplete-input.tsx)

- [ ] **Step 1: Create AutocompleteInput**

  Create file `f:/projects/court-management/components/ui/autocomplete-input.tsx`:
  ```tsx
  import * as React from "react"
  import { Input } from "@/components/ui/input"
  import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
  import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
  import { cn } from "@/lib/utils"

  interface AutocompleteInputProps extends React.ComponentProps<"input"> {
    suggestions: string[]
    onValueChange: (val: string) => void
  }

  export function AutocompleteInput({
    suggestions,
    onValueChange,
    className,
    value,
    onChange,
    ...props
  }: AutocompleteInputProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState(String(value || ""))
    const containerRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      setInputValue(String(value || ""))
    }, [value])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setInputValue(val)
      onValueChange(val)
      if (onChange) onChange(e)
    }

    const filteredSuggestions = React.useMemo(() => {
      const cleanInput = inputValue.trim().toLowerCase()
      if (!cleanInput) return suggestions
      return suggestions.filter((item) =>
        item.toLowerCase().includes(cleanInput)
      )
    }, [suggestions, inputValue])

    return (
      <div className="relative w-full" ref={containerRef}>
        <Popover open={open && filteredSuggestions.length > 0} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Input
              {...props}
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 200)}
              className={cn("w-full", className)}
            />
          </PopoverTrigger>
          <PopoverContent
            className="w-full p-0 max-h-48 overflow-y-auto"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
            style={{
              width: containerRef.current?.getBoundingClientRect().width,
            }}
          >
            <Command>
              <CommandList>
                <CommandGroup>
                  {filteredSuggestions.map((item) => (
                    <CommandItem
                      key={item}
                      value={item}
                      onSelect={(currentValue) => {
                        setInputValue(currentValue)
                        onValueChange(currentValue)
                        setOpen(false)
                      }}
                    >
                      {item}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    )
  }
  ```

- [ ] **Step 2: Commit UI component**

  ```bash
  git add components/ui/autocomplete-input.tsx
  git commit -m "feat(web): add AutocompleteInput component"
  ```

---

### Task 4: Integrate `AutocompleteInput` into Forms

Replace simple inputs with `AutocompleteInput` for Type, Retention, and Title fields.

**Files:**
- Modify: [manual-file-form.tsx](file:///f:/projects/court-management/components/forms/manual-file-form.tsx)
- Modify: [edit-file-dialog.tsx](file:///f:/projects/court-management/components/forms/edit-file-dialog.tsx)
- Modify: [child-document-form-modal.tsx](file:///f:/projects/court-management/components/files/child-document-form-modal.tsx)

- [ ] **Step 1: Update ManualFileForm**

  Open `f:/projects/court-management/components/forms/manual-file-form.tsx`:
  - Import `AutocompleteInput` and `useAutocompleteSuggestions`.
  - Fetch suggestions:
    ```ts
    const { suggestions } = useAutocompleteSuggestions()
    ```
  - Replace `type` input:
    ```tsx
    <AutocompleteInput
        id="type"
        value={formData.type}
        suggestions={suggestions.types}
        onValueChange={(val) => setFormData({ ...formData, type: val })}
    />
    ```
  - Replace `retention` input:
    ```tsx
    <AutocompleteInput
        id="retention"
        placeholder="10 năm"
        value={formData.retention}
        suggestions={suggestions.retentions}
        onValueChange={(val) => setFormData({ ...formData, retention: val })}
    />
    ```
  - Replace `title` input:
    ```tsx
    <AutocompleteInput
        id="title"
        placeholder="Về việc..."
        value={formData.title}
        suggestions={suggestions.titles}
        onValueChange={(val) => setFormData({ ...formData, title: val })}
        required
    />
    ```

- [ ] **Step 2: Update EditFileDialog**

  Open `f:/projects/court-management/components/forms/edit-file-dialog.tsx`:
  - Fetch suggestions:
    ```ts
    const { suggestions } = useAutocompleteSuggestions()
    ```
  - Replace `type`, `retention`, and `title` inputs with `AutocompleteInput` using same logic.

- [ ] **Step 3: Update ChildDocumentFormModal**

  Open `f:/projects/court-management/components/files/child-document-form-modal.tsx`:
  - Fetch suggestions.
  - Replace `preservationTime` input with `AutocompleteInput` using `suggestions.retentions`.
  - Replace `title` textarea or input with `AutocompleteInput` (or custom input suggestions if needed, though simple `AutocompleteInput` is perfect).

- [ ] **Step 4: Commit form updates**

  ```bash
  git add components/forms/manual-file-form.tsx components/forms/edit-file-dialog.tsx components/files/child-document-form-modal.tsx
  git commit -m "feat(web): integrate AutocompleteInput into manual, edit, and document forms"
  ```

---

### Task 5: Implement Sticky Fields in `ManualFileForm`

Add the checkbox for "Nhập liên tục" and keep previous values on successful submission.

**Files:**
- Modify: [manual-file-form.tsx](file:///f:/projects/court-management/components/forms/manual-file-form.tsx)

- [ ] **Step 1: Import Checkbox and add ref**

  Open `f:/projects/court-management/components/forms/manual-file-form.tsx`:
  - Import `Checkbox` from `@/components/ui/checkbox`.
  - Create a ref to focus code input:
    ```ts
    const codeInputRef = React.useRef<HTMLInputElement>(null)
    ```
  - Pass this ref to the `code` input element.

- [ ] **Step 2: Implement state & storage logic**

  Add `isSticky` state initialized from localStorage:
  ```ts
  const [isSticky, setIsSticky] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sticky_file_fields') === 'true'
    }
    return false
  })
  ```

- [ ] **Step 3: Modify handleManualSubmit reset logic**

  In `handleManualSubmit` success block, change the state reset to:
  ```ts
  if (isSticky) {
      setFormData(prev => ({
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
  } else {
      setFormData({
          code: '',
          title: '',
          type: 'Hình sự',
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
      })
  }
  ```

- [ ] **Step 4: Render toggle in form UI**

  Add the sticky checkbox above the DialogFooter in the form layout:
  ```tsx
  <div className="flex items-center space-x-2 py-3 px-1 border-t mt-4">
      <Checkbox
          id="sticky"
          checked={isSticky}
          onCheckedChange={(checked) => {
              setIsSticky(!!checked)
              localStorage.setItem('sticky_file_fields', String(checked))
          }}
      />
      <Label htmlFor="sticky" className="text-sm font-medium cursor-pointer text-muted-foreground">
          Nhập liên tục (Giữ lại Loại án, Năm, Bảo quản và Hộp số)
      </Label>
  </div>
  ```

- [ ] **Step 5: Commit sticky fields logic**

  ```bash
  git add components/forms/manual-file-form.tsx
  git commit -m "feat(web): implement sticky fields in ManualFileForm"
  ```
