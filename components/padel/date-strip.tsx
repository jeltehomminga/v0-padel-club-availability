"use client"

import { useEffect, useRef } from "react"
import { getDateString } from "@/lib/time"
import { weekdays } from "@/lib/constants"

type DateStripProps = {
  dates: string[]
  selected: string
  onSelect: (date: string) => void
  onPrefetchDate?: (date: string) => void
}

export function DateStrip({
  dates,
  selected,
  onSelect,
  onPrefetchDate,
}: Readonly<DateStripProps>) {
  const today = getDateString(0)
  const tomorrow = getDateString(1)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current?.querySelector("[data-selected='true']")
    el?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    })
  }, [selected])

  return (
    <nav
      ref={scrollRef}
      aria-label="Select date"
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {dates.map((date) => {
        const dateObj = new Date(date)
        const isSelected = date === selected
        const label =
          date === today
            ? "Today"
            : date === tomorrow
              ? "Tmrw"
              : weekdays[dateObj.getDay()]
        const dayNum = dateObj.getDate()

        return (
          <button
            key={date}
            data-selected={isSelected}
            aria-pressed={isSelected}
            aria-label={`${label === "Today" ? "Today" : label === "Tmrw" ? "Tomorrow" : label}, ${dayNum}`}
            onClick={() => onSelect(date)}
            onMouseEnter={() => onPrefetchDate?.(date)}
            onFocus={() => onPrefetchDate?.(date)}
            className={`flex flex-col items-center justify-center min-w-[52px] h-[60px] rounded-2xl border text-sm font-medium transition-all shrink-0 cursor-pointer ${
              isSelected
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25 scale-105"
                : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
            }`}
          >
            <span className="text-[11px] leading-none mb-1 uppercase tracking-wide">{label}</span>
            <span
              className={`text-lg leading-none font-brand font-bold ${isSelected ? "" : "text-foreground"}`}
            >
              {dayNum}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
