import * as React from "react"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "@/components/ui/popover"
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
