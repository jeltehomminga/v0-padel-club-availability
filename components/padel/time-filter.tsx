"use client"

import { X, Clock } from "lucide-react"

type TimeFilterProps = Readonly<{
  from: string
  to: string
  onChange: (from: string, to: string) => void
  onClear: () => void
}>

export function TimeFilter({ from, to, onChange, onClear }: TimeFilterProps) {
  const hasValue = from !== "" || to !== ""

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Time
      </span>
      <div className="flex items-center gap-1.5">
        <input
          type="time"
          value={from}
          onChange={(e) => onChange(e.target.value, to)}
          className="h-7 rounded-full border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-all focus:border-primary focus:outline-none"
          aria-label="From time"
        />
        <span className="text-xs text-muted-foreground">—</span>
        <input
          type="time"
          value={to}
          onChange={(e) => onChange(from, e.target.value)}
          className="h-7 rounded-full border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-all focus:border-primary focus:outline-none"
          aria-label="To time"
        />
        {hasValue && (
          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Clear time filter"
            aria-label="Clear time filter"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
