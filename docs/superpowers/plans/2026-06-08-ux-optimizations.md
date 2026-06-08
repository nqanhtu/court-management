# UX Optimization & Box Autocomplete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement UX optimizations for rapid data entry, including:
1. **Form Hotkeys**: Support `Ctrl + Enter` (or `Cmd + Enter`) to save and submit forms instantly.
2. **Value-Mapped Autocomplete**: Extend the `AutocompleteInput` component to support `{ value, label }` options, and convert the **Hộp số (Box ID)** selection dropdown to a searchable autocomplete input in both creation and edit forms.
3. **Tab Order Verification**: Audit the form field layouts to ensure keyboard tab focus flows sequentially without breaks.

**Tech Stack:** React, Tailwind CSS, TanStack Query.

---

### Task 1: Extend `AutocompleteInput` to Support Value/Label Mapping

Modify `AutocompleteInput` to accept either `string[]` or `{ value: string, label: string }[]` suggestions.

**Files:**
- Modify: [autocomplete-input.tsx](file:///f:/projects/court-management/components/ui/autocomplete-input.tsx)

- [ ] **Step 1: Update type signatures and mapping logic**

  Open `f:/projects/court-management/components/ui/autocomplete-input.tsx` and rewrite it to handle object suggestion types:
  ```tsx
  import * as React from "react"
  import { Input } from "@/components/ui/input"
  import { cn } from "@/lib/utils"

  export interface AutocompleteOption {
    value: string
    label: string
  }

  interface AutocompleteInputProps extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
    suggestions: string[] | AutocompleteOption[]
    onValueChange: (val: string) => void
    value?: string
  }

  export function AutocompleteInput({
    suggestions,
    onValueChange,
    className,
    value,
    ...props
  }: AutocompleteInputProps) {
    const [open, setOpen] = React.useState(false)
    const [selectedIndex, setSelectedIndex] = React.useState(-1)
    const containerRef = React.useRef<HTMLDivElement>(null)

    // Normalize suggestions to option object structure
    const normalizedSuggestions = React.useMemo<AutocompleteOption[]>(() => {
      return suggestions.map((item) => {
        if (typeof item === "string") {
          return { value: item, label: item }
        }
        return item
      })
    }, [suggestions])

    // Local input text is the label of the currently selected option, or the typed string
    const [inputValue, setInputValue] = React.useState("")

    React.useEffect(() => {
      const match = normalizedSuggestions.find(o => o.value === value)
      setInputValue(match ? match.label : String(value || ""))
    }, [value, normalizedSuggestions])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setInputValue(val)
      onValueChange(val) // Send raw typed text to parent
      setSelectedIndex(-1)
      setOpen(true)
    }

    const filteredSuggestions = React.useMemo(() => {
      const cleanInput = inputValue.trim().toLowerCase()
      if (!cleanInput) return normalizedSuggestions
      return normalizedSuggestions.filter((item) =>
        item.label.toLowerCase().includes(cleanInput)
      )
    }, [normalizedSuggestions, inputValue])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open || filteredSuggestions.length === 0) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredSuggestions.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length)
      } else if (e.key === "Enter") {
        if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
          e.preventDefault()
          const selectedOption = filteredSuggestions[selectedIndex]
          setInputValue(selectedOption.label)
          onValueChange(selectedOption.value)
          setOpen(false)
        }
      } else if (e.key === "Escape") {
        setOpen(false)
      }
    }

    return (
      <div className="relative w-full" ref={containerRef} onKeyDown={handleKeyDown}>
        <Input
          {...props}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          className={cn("w-full", className)}
        />
        {open && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md outline-none">
            <ul className="flex flex-col gap-0.5">
              {filteredSuggestions.map((item, index) => (
                <li
                  key={item.value}
                  onMouseDown={(e) => {
                    // Prevent input blur before click registers
                    e.preventDefault()
                  }}
                  onClick={() => {
                    setInputValue(item.label)
                    onValueChange(item.value)
                    setOpen(false)
                  }}
                  className={cn(
                    "relative flex cursor-default select-none items-center rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer",
                    index === selectedIndex && "bg-accent text-accent-foreground"
                  )}
                >
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }
  ```

- [ ] **Step 2: Verify tests still pass**

  Run: `pnpm test`
  Expected: PASS.

- [ ] **Step 3: Commit AutocompleteInput changes**

  ```bash
  git add components/ui/autocomplete-input.tsx
  git commit -m "feat(web): support key-value suggestion options in AutocompleteInput"
  ```

---

### Task 2: Implement Ctrl+Enter Hotkeys and Box Autocomplete in ManualFileForm

Add hotkey listeners and replace the box ID Select dropdown in `ManualFileForm`.

**Files:**
- Modify: [manual-file-form.tsx](file:///f:/projects/court-management/components/forms/manual-file-form.tsx)

- [ ] **Step 1: Map boxes to options and replace Select input**

  Open `f:/projects/court-management/components/forms/manual-file-form.tsx`:
  - Map the list of `boxes` into `{ value, label }` structure:
    ```ts
    const boxOptions = boxes.map((b) => ({
        value: b.id,
        label: `${b.code} (Kệ: ${b.shelf}) ${b.agency?.name ? `- Phông: ${b.agency.name}` : ''}`
    }))
    ```
  - Replace `<Select>` block with `<AutocompleteInput>`:
    ```tsx
    <div className="space-y-2">
        <Label htmlFor="boxId">Hộp số (Mã hộp)</Label>
        <AutocompleteInput
            id="boxId"
            placeholder="Tìm kiếm hộp lưu trữ..."
            value={formData.boxId}
            suggestions={boxOptions}
            onValueChange={(val) => setFormData({ ...formData, boxId: val })}
        />
    </div>
    ```

- [ ] **Step 2: Add Ctrl+Enter hotkey handler**

  Add keydown listener on the root `<form>` tag:
  ```tsx
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault()
          handleManualSubmit(e)
      }
  }
  ```
  And render:
  ```tsx
  <form onSubmit={handleManualSubmit} onKeyDown={handleKeyDown} className="flex max-h-[70vh] flex-col overflow-hidden">
  ```

- [ ] **Step 3: Verify tests and commit**

  Run: `pnpm test`
  Expected: PASS.
  
  ```bash
  git add components/forms/manual-file-form.tsx
  git commit -m "feat(web): add Ctrl+Enter hotkey and Box autocomplete in ManualFileForm"
  ```

---

### Task 3: Implement Ctrl+Enter Hotkeys and Box Autocomplete in EditFileDialog

Apply the same UX changes to the file edit dialog form.

**Files:**
- Modify: [edit-file-dialog.tsx](file:///f:/projects/court-management/components/forms/edit-file-dialog.tsx)

- [ ] **Step 1: Map boxes and replace Select dropdown**

  Open `f:/projects/court-management/components/forms/edit-file-dialog.tsx`:
  - Add box mapping and replace the `boxId` `<Select>` dropdown with the new `<AutocompleteInput>` using `boxOptions`.

- [ ] **Step 2: Add Ctrl+Enter hotkey**

  Add keydown listener to the form tag:
  ```tsx
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault()
          handleSubmit(e)
      }
  }
  ```
  Apply `onKeyDown={handleKeyDown}` to `<form onSubmit={handleSubmit} ...>`.

- [ ] **Step 3: Verify tests and commit**

  Run: `pnpm test`
  Expected: PASS.
  
  ```bash
  git add components/forms/edit-file-dialog.tsx
  git commit -m "feat(web): add Ctrl+Enter hotkey and Box autocomplete in EditFileDialog"
  ```

---

### Task 4: Keyboard Navigation and Tab Order Audit

Verify logical tab sequence and key actions in both forms.

**Files:**
- Audit: [manual-file-form.tsx](file:///f:/projects/court-management/components/forms/manual-file-form.tsx)
- Audit: [edit-file-dialog.tsx](file:///f:/projects/court-management/components/forms/edit-file-dialog.tsx)
- Modify: [autocomplete-input.tsx](file:///f:/projects/court-management/components/ui/autocomplete-input.tsx)

- [ ] **Step 1: Verify tabIndex sequence**

  Check that the DOM layout corresponds to the visual layout so standard sequential navigation flows naturally.
  Expected Tab Sequence:
  `Mã hồ sơ` -> `Loại án` -> `Năm` -> `Thời hạn bảo quản` -> `Số bản án` -> `Ngày bản án` -> `Số trang` -> `Bị cáo` -> `Đương sự` -> `Người có quyền lợi` -> `Hộp số` -> `Ghi chú` -> `Lưu`.

- [ ] **Step 2: Add Escape key event propagation handling in AutocompleteInput**

  Open `f:/projects/court-management/components/ui/autocomplete-input.tsx` and stop propagation on Escape key down so it closes suggestions without triggering the parent Dialog's close handler:
  ```tsx
  } else if (e.key === "Escape") {
    e.preventDefault()
    e.stopPropagation() // Prevent closing parent dialogs
    setOpen(false)
  }
  ```

- [ ] **Step 3: Run full manual walkthrough to verify keyboard workflow**

  Verify that focus outlines show clearly, arrow-keys navigate through suggestions, and `Ctrl + Enter` submits correctly.

- [ ] **Step 4: Commit tab audit changes**

  ```bash
  git add components/ui/autocomplete-input.tsx
  git commit -m "feat(web): stop escape key propagation in AutocompleteInput"
  ```

---

## Verification Plan

### Automated Tests
- Run `pnpm test` in the `court-management` directory to ensure no React rendering or form state regression.

### Manual Verification
1. Open the "Thêm mới hồ sơ" dialog.
2. Verify you can tab through all fields sequentially.
3. Type a query in "Hộp số" to verify it searches and filters boxes successfully.
4. Select a box using `ArrowDown` and `Enter`. Verify the selection is set correctly and focus remains inside the box field.
5. Press `Escape` while suggestions are open. Verify suggestions close but the parent "Thêm mới hồ sơ" dialog remains open.
6. Press `Ctrl + Enter` inside any form input. Verify the form submits and redirects or displays success toast.
