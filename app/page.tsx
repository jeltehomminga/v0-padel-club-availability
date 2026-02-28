"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Loader2, MapPin, ExternalLink } from "lucide-react"
import { playtomicAPI, type TimeSlot } from "@/lib/playtomic-api"

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const DURATION_OPTIONS = [
  { value: "60+", label: "60+ min" },
  { value: "60", label: "60 min" },
  { value: "90", label: "90 min" },
] as const

// Playtomic universal link — on iOS/Android with the app installed this opens the app directly;
// without the app it falls back to the Playtomic mobile website.
const playtomicTenantUrl = (tenantId: string) => `https://playtomic.io/tenant/${tenantId}`

// Verified club websites for desktop users — club name must exactly match the API name.
// Clubs without a standalone site fall back to their Playtomic page.
const CLUB_WEBSITES: Record<string, string> = {
  "Bam Bam Padel Ubud": "https://www.bambampadel.com",
  "BamBam Padel": "https://www.bambampadel.com",
  "Monkey Padel Bali": "https://monkeypadelbali.com",
  "Monkey Padel Bali Sayan Ubud": "https://monkeypadelbali.com",
  "Simply Padel": "https://simply-padel.com",
  "Simply Padel Sanur": "https://simply-padel.com",
  "Padel of Gods": "https://padelofgodsbali.com",
  "Padel of Gods Bali": "https://padelofgodsbali.com",
}

const isMobileDevice = () =>
  typeof navigator !== "undefined" &&
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

// ─── Utilities ────────────────────────────────────────────────────────────────

const getDateString = (offset = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split("T")[0]
}

const getNext14Days = () => Array.from({ length: 14 }, (_, i) => getDateString(i))

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price)

const formatCourtName = (name: string) => {
  if (/^[0-9a-f]{8}-/.test(name)) return `Court ${name.slice(-8, -4).toUpperCase()}`
  return name.startsWith("Court") ? name : `Court ${name}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DateStrip({
  dates,
  selected,
  onSelect,
}: {
  dates: string[]
  selected: string
  onSelect: (d: string) => void
}) {
  const today = getDateString(0)
  const tomorrow = getDateString(1)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll selected date into view on mount
  useEffect(() => {
    const el = scrollRef.current?.querySelector("[data-selected='true']")
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" })
  }, [selected])

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {dates.map((date) => {
        const d = new Date(date)
        const isSelected = date === selected
        const label = date === today ? "Today" : date === tomorrow ? "Tmrw" : WEEKDAYS[d.getDay()]
        const dayNum = d.getDate()

        return (
          <button
            key={date}
            data-selected={isSelected}
            onClick={() => onSelect(date)}
            className={`flex flex-col items-center justify-center min-w-[52px] h-[60px] rounded-xl border text-sm font-medium transition-all shrink-0 cursor-pointer ${
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            }`}
          >
            <span className="text-xs leading-none mb-1">{label}</span>
            <span className={`text-lg leading-none font-semibold ${isSelected ? "" : "text-foreground"}`}>
              {dayNum}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function FilterChips({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string
  options: { value: string; label: string }[]
  selected: string
  onSelect: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0">{label}</span>
      <div className="flex gap-1.5 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
              selected === opt.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function SlotCard({
  slot,
  onBook,
  hasClubSite,
}: {
  slot: TimeSlot
  onBook: (slot: TimeSlot) => void
  hasClubSite: boolean
}) {
  const today = getDateString(0)
  const tomorrow = getDateString(1)
  const dateLabel =
    slot.date === today
      ? "Today"
      : slot.date === tomorrow
        ? "Tomorrow"
        : new Date(slot.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/40 hover:shadow-sm transition-all">
      {/* Time block */}
      <div className="flex flex-col items-center justify-center bg-muted rounded-lg px-3 py-2 shrink-0 min-w-[64px]">
        <span className="text-lg font-semibold text-foreground leading-none">
          {slot.time.slice(0, 5)}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">{slot.duration}min</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm leading-tight truncate">{slot.club}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" />
            {slot.location}
          </span>
          <span className="text-xs text-muted-foreground">&middot;</span>
          <span className="text-xs text-muted-foreground">{formatCourtName(slot.court)}</span>
          <span className="text-xs text-muted-foreground">&middot;</span>
          <span className="text-xs text-muted-foreground">{dateLabel}</span>
        </div>
      </div>

      {/* Price + CTA */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-sm font-semibold text-foreground">{formatPrice(slot.price)}</span>
        <button
          onClick={() => onBook(slot)}
          title={hasClubSite ? `Visit ${slot.club} website to book` : "Book via Playtomic"}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full hover:opacity-90 transition-opacity cursor-pointer"
        >
          Book
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PadelAvailability() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(getDateString())
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [selectedClub, setSelectedClub] = useState("all")
  const [selectedDuration, setSelectedDuration] = useState("60+")
  const [cache, setCache] = useState<Record<string, TimeSlot[]>>({})

  useEffect(() => {
    const load = async () => {
      if (cache[selectedDate]) {
        setTimeSlots(cache[selectedDate])
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const slots = await playtomicAPI.getAllSlotsForBothLocations(selectedDate)
        setTimeSlots(slots)
        setCache((prev) => ({ ...prev, [selectedDate]: slots }))
      } catch {
        setError("Failed to load availability. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedDate, cache])

  const filteredSlots = useMemo(() => {
    const cutoff = new Date(Date.now() + 3600000)
    const durationFilter: Record<string, (d: number) => boolean> = {
      "60+": (d) => d >= 60,
      "60": (d) => d === 60,
      "90": (d) => d === 90,
    }
    return timeSlots.filter((slot) => {
      const slotTime = new Date(`${slot.date}T${slot.time}`)
      return (
        slotTime > cutoff &&
        durationFilter[selectedDuration]?.(slot.duration) &&
        (selectedLocation === "all" || slot.location === selectedLocation) &&
        (selectedClub === "all" || slot.club === selectedClub)
      )
    })
  }, [timeSlots, selectedDuration, selectedLocation, selectedClub])

  const handleBook = (slot: TimeSlot) => {
    const url = isMobileDevice()
      // Universal link: iOS/Android intercept this and open the Playtomic app if installed,
      // otherwise fall back to the Playtomic mobile website — no fake scheme needed.
      ? playtomicTenantUrl(slot.tenantId)
      // Desktop: go to the club's own website when available, else their Playtomic page.
      : (CLUB_WEBSITES[slot.club] ?? playtomicTenantUrl(slot.tenantId))

    window.open(url, "_blank", "noopener,noreferrer")
  }

  const dates = getNext14Days()
  const uniqueClubs = [...new Set(timeSlots.map((s) => s.club))].sort()

  const locationOptions = [
    { value: "all", label: "All" },
    { value: "Ubud", label: "Ubud" },
    { value: "Sanur", label: "Sanur" },
  ]

  const clubOptions = [
    { value: "all", label: "All clubs" },
    ...uniqueClubs.map((c) => ({ value: c, label: c })),
  ]

  // ─── Loading / Error states ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-7 h-7 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading court availability…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-xs">
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button size="sm" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  // ─── Main UI ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-4 pt-4 pb-3 space-y-3">
          {/* Title */}
          <div className="flex items-baseline justify-between">
            <div>
              <h1 className="font-serif text-2xl text-foreground leading-tight">Padel Courts Bali</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Ubud &amp; Sanur — live availability</p>
            </div>
            <Badge
              variant="outline"
              className="text-xs text-primary border-primary/40 bg-primary/8 font-medium"
            >
              {filteredSlots.length} slots
            </Badge>
          </div>

          {/* Date strip */}
          <DateStrip dates={dates} selected={selectedDate} onSelect={setSelectedDate} />

          {/* Filter row */}
          <div className="flex flex-wrap gap-3 items-center">
            <FilterChips
              label="Where"
              options={locationOptions}
              selected={selectedLocation}
              onSelect={setSelectedLocation}
            />
            <FilterChips
              label="Duration"
              options={DURATION_OPTIONS}
              selected={selectedDuration}
              onSelect={setSelectedDuration}
            />
          </div>

          {/* Club select — only shown when clubs are loaded */}
          {uniqueClubs.length > 0 && (
            <Select value={selectedClub} onValueChange={setSelectedClub}>
              <SelectTrigger className="h-8 text-xs w-full border-border bg-background">
                <SelectValue placeholder="All clubs" />
              </SelectTrigger>
              <SelectContent>
                {clubOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-sm">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </header>

      {/* ── Slot list ── */}
      <main className="max-w-3xl mx-auto px-4 py-4 space-y-2">
        {filteredSlots.length > 0 ? (
          filteredSlots.map((slot) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              onBook={handleBook}
              hasClubSite={!!CLUB_WEBSITES[slot.club]}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Clock className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No slots available</p>
            <p className="text-xs text-muted-foreground">Try a different date, location, or duration.</p>
          </div>
        )}
      </main>
    </div>
  )
}
