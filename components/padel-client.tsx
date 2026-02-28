"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Loader2, MapPin, ExternalLink } from "lucide-react"
import type { TimeSlot } from "@/lib/playtomic-api"

// Fetches slots for a date via the API route — cached server-side with Next.js fetch cache,
// so the browser also benefits from Cache-Control headers on repeated requests.
async function fetchSlotsForDateClient(date: string): Promise<TimeSlot[]> {
  const res = await fetch(`/api/playtomic/slots?date=${date}`)
  if (!res.ok) return []
  return res.json()
}
import { isUnmappedCourt } from "@/lib/court-names"

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const DURATION_OPTIONS = [
  { value: "60+", label: "60+ min" },
  { value: "60", label: "60 min" },
  { value: "90", label: "90 min" },
] as const

const playtomicTenantUrl = (tenantId: string) => `https://playtomic.io/tenant/${tenantId}`

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
  options: readonly { value: string; label: string }[]
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
      <div className="flex flex-col items-center justify-center bg-muted rounded-lg px-3 py-2 shrink-0 min-w-[64px]">
        <span className="text-lg font-semibold text-foreground leading-none">{slot.time.slice(0, 5)}</span>
        <span className="text-xs text-muted-foreground mt-0.5">{slot.duration}min</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm leading-tight truncate">{slot.club}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" />
            {slot.location}
          </span>
          <span className="text-xs text-muted-foreground">&middot;</span>
          <span
            className={`text-xs ${isUnmappedCourt(slot.court) ? "text-amber-500 font-medium" : "text-muted-foreground"}`}
            title={isUnmappedCourt(slot.court) ? "Court name not yet mapped — visit /api/playtomic/discover-courts" : undefined}
          >
            {formatCourtName(slot.court)}
          </span>
          <span className="text-xs text-muted-foreground">&middot;</span>
          <span className="text-xs text-muted-foreground">{dateLabel}</span>
        </div>
      </div>

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

// ─── Main client component ────────────────────────────────────────────────────

export default function PadelClient({
  initialSlots,
  initialDate,
}: {
  initialSlots: TimeSlot[]
  initialDate: string
}) {
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [selectedClub, setSelectedClub] = useState("all")
  const [selectedDuration, setSelectedDuration] = useState("60+")

  // Per-date slot cache — seeded with server-fetched today data
  const [slotCache, setSlotCache] = useState<Record<string, TimeSlot[]>>({
    [initialDate]: initialSlots,
  })
  const [loadingDate, setLoadingDate] = useState<string | null>(null)

  const timeSlots = slotCache[selectedDate] ?? []
  const isLoading = loadingDate === selectedDate && !slotCache[selectedDate]

  // Fetch slots for a date not yet in cache
  useEffect(() => {
    if (slotCache[selectedDate]) return
    setLoadingDate(selectedDate)
    fetchSlotsForDateClient(selectedDate)
      .then((slots) => {
        setSlotCache((prev) => ({ ...prev, [selectedDate]: slots }))
      })
      .catch(() => {
        setSlotCache((prev) => ({ ...prev, [selectedDate]: [] }))
      })
      .finally(() => setLoadingDate(null))
  }, [selectedDate, slotCache])

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
      ? playtomicTenantUrl(slot.tenantId)
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

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-4 pt-4 pb-3 space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <h1 className="font-serif text-2xl text-foreground leading-tight">Padel Courts Bali</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Ubud &amp; Sanur — live availability</p>
            </div>
            <Badge variant="outline" className="text-xs text-primary border-primary/40 bg-primary/8 font-medium">
              {filteredSlots.length} slots
            </Badge>
          </div>

          <DateStrip dates={dates} selected={selectedDate} onSelect={setSelectedDate} />

          <div className="flex flex-wrap gap-3 items-center">
            <FilterChips label="Where" options={locationOptions} selected={selectedLocation} onSelect={setSelectedLocation} />
            <FilterChips label="Duration" options={DURATION_OPTIONS} selected={selectedDuration} onSelect={setSelectedDuration} />
          </div>

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

      {/* Slot list */}
      <main className="max-w-3xl mx-auto px-4 py-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredSlots.length > 0 ? (
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
