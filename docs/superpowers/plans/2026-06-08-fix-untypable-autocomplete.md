# Bug Fix: Untypable Autocomplete Input fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the issue where `AutocompleteInput` fields (Loại án and Tiêu đề) cannot be typed in due to Radix Popover modal focus trap and trigger key event interception.

**Architecture:** 
1. Re-configure the `Popover` component inside `AutocompleteInput` to be non-modal (`modal={false}`). This prevents Radix from trapping focus and blocking key events on the input field when suggestions are open.
2. Replace `<PopoverTrigger asChild>` with `<PopoverAnchor asChild>` to prevent Radix from intercepting keyboard actions (like Space/Enter) on the input field.

**Tech Stack:** React, Radix UI Popover, CMDK.

---

### Task 1: Update AutocompleteInput Component

Modify `AutocompleteInput` to use `PopoverAnchor` and set `modal={false}`.

**Files:**
- Modify: [autocomplete-input.tsx](file:///f:/projects/court-management/components/ui/autocomplete-input.tsx)

- [ ] **Step 1: Modify code in `autocomplete-input.tsx`**

  Open `f:/projects/court-management/components/ui/autocomplete-input.tsx`:
  - Import `PopoverAnchor` from `@/components/ui/popover`.
  - Update the render structure:
    * Set `<Popover modal={false} ...>`
    * Replace `<PopoverTrigger asChild>` with `<PopoverAnchor asChild>`.
    
  Code changes:
  ```tsx
  import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "@/components/ui/popover"
  ```
  And:
  ```tsx
  return (
    <div className="relative w-full" ref={containerRef}>
      <Popover open={open && filteredSuggestions.length > 0} onOpenChange={setOpen} modal={false}>
        <PopoverAnchor asChild>
          <Input
            {...props}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            className={cn("w-full", className)}
          />
        </PopoverAnchor>
        <PopoverContent
          className="p-0 max-h-48 overflow-y-auto"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          style={{
            width: containerRef.current?.getBoundingClientRect().width,
          }}
        >
          {/* ... */}
        </PopoverContent>
      </Popover>
    </div>
  )
  ```

- [ ] **Step 2: Verify frontend tests still pass**

  Run: `pnpm test`
  Expected: PASS (all 22 tests).

- [ ] **Step 3: Commit changes**

  ```bash
  git add components/ui/autocomplete-input.tsx
  git commit -m "fix(web): allow typing in AutocompleteInput by setting popover modal=false and using PopoverAnchor"
  ```
