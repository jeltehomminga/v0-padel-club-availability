"use client"

import { MapPin, ExternalLink } from "lucide-react"
import type { TimeSlot } from "@/lib/playtomic-api"
import { isUnmappedCourt } from "@/lib/court-names"
import { formatPrice, formatCourtName } from "@/lib/format"
import { getDateString } from "@/lib/time"

type SlotCardProps = {
  slot: TimeSlot
  onBook: (slot: TimeSlot) => void
  hasClubSite: boolean
}

export function SlotCard({ slot, onBook, hasClubSite }: SlotCardProps) {
  const today = getDateString(0)
  const tomorrow = getDateString(1)
  const dateLabel =
    slot.date === today
      ? "Today"
      : slot.date === tomorrow
        ? "Tomorrow"
        : new Date(slot.date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })

  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      <div className="flex flex-col items-center justify-center bg-primary/8 rounded-xl px-3 py-2 shrink-0 min-w-[64px]">
        <span className="text-lg font-brand font-bold text-primary leading-none">
          {slot.time.slice(0, 5)}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">
          {slot.duration}min
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm leading-tight truncate">
          {slot.club}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" />
            {slot.location}
          </span>
          <span className="text-xs text-muted-foreground">&middot;</span>
          <span
            className={`text-xs ${isUnmappedCourt(slot.court) ? "text-amber-500 font-medium" : "text-muted-foreground"}`}
            title={
              isUnmappedCourt(slot.court)
                ? "Court name not yet mapped — visit /api/playtomic/discover-courts"
                : undefined
            }
          >
            {formatCourtName(slot.court)}
          </span>
          <span className="text-xs text-muted-foreground">&middot;</span>
          <span className="text-xs text-muted-foreground">{dateLabel}</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {formatPrice(slot.price)}
        </span>
        <button
          onClick={() => onBook(slot)}
          title={
            hasClubSite
              ? `Visit ${slot.club} website to book`
              : "Book via Playtomic"
          }
          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
        >
          Book
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
