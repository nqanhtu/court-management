# Bug Fix: Autocomplete Suggestions Flashing and Disappearing Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the bug where the autocomplete suggestion list flashes once and immediately disappears upon first focus.

**Architecture:** 
The flash/disappear bug is caused by focus movements when Radix Popover mounts its Portal outside the input's DOM tree, triggering an unexpected `onBlur` event on the input. 
To solve this permanently and robustly:
1. Replace Radix Popover & CMDK with a simple, native absolutely-positioned `div` inside the input's wrapper.
2. Manage keyboard navigation (ArrowUp, ArrowDown, Enter, Escape) manually using standard React keyboard event handlers.

**Tech Stack:** React, Tailwind CSS.

---

### Task 1: Rewrite AutocompleteInput Component

Replace Popover and CMDK with inline dropdown in `AutocompleteInput`.

**Files:**
- Modify: [autocomplete-input.tsx](file:///f:/projects/court-management/components/ui/autocomplete-input.tsx)

- [ ] **Step 1: Replace code in `autocomplete-input.tsx`**

  Open `f:/projects/court-management/components/ui/autocomplete-input.tsx` and replace its entire content with the following:
  ```tsx
  import * as React from "react"
  import { Input } from "@/components/ui/input"
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
    const [selectedIndex, setSelectedIndex] = React.useState(-1)
    const containerRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      setInputValue(String(value || ""))
    }, [value])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setInputValue(val)
      onValueChange(val)
      setSelectedIndex(-1)
      setOpen(true)
      if (onChange) onChange(e)
    }

    const filteredSuggestions = React.useMemo(() => {
      const cleanInput = inputValue.trim().toLowerCase()
      if (!cleanInput) return suggestions
      return suggestions.filter((item) =>
        item.toLowerCase().includes(cleanInput)
      )
    }, [suggestions, inputValue])

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
          const selectedValue = filteredSuggestions[selectedIndex]
          setInputValue(selectedValue)
          onValueChange(selectedValue)
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
                  key={item}
                  onClick={() => {
                    setInputValue(item)
                    onValueChange(item)
                    setOpen(false)
                  }}
                  className={cn(
                    "relative flex cursor-default select-none items-center rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer",
                    index === selectedIndex && "bg-accent text-accent-foreground"
                  )}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }
  ```

- [ ] **Step 2: Verify frontend tests still pass**

  Run: `pnpm test`
  Expected: PASS.

- [ ] **Step 3: Commit rewrite**

  ```bash
  git add components/ui/autocomplete-input.tsx
  git commit -m "fix(web): rewrite AutocompleteInput with inline absolute div to prevent focus loss and flashing"
  ```
