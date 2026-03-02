"use client"

type FilterChipsProps = {
  label: string
  options: readonly { value: string; label: string }[]
  selected: string
  onSelect: (value: string) => void
}

export function FilterChips({
  label,
  options,
  selected,
  onSelect,
}: Readonly<FilterChipsProps>) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0">
        {label}
      </span>
      <div className="flex gap-1.5 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            aria-pressed={selected === opt.value}
            onClick={() => onSelect(opt.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
              selected === opt.value
                ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20 font-semibold"
                : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:bg-primary/5 hover:text-foreground active:scale-95"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
