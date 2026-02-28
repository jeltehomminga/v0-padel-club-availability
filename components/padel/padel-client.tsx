"use client"

import Link from "next/link"
import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import {
  useQueryStates,
  parseAsString,
  parseAsStringLiteral,
  parseAsBoolean,
} from "nuqs"
import useSWR, { useSWRConfig } from "swr"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, RefreshCw, X, SlidersHorizontal } from "lucide-react"
import type { TimeSlot, ClubInfo } from "@/lib/playtomic-api"
import { getNext14Days } from "@/lib/time"
import {
  durationOptions,
  clubWebsites,
  playtomicTenantUrl,
} from "@/lib/constants"
import { isMobileDevice } from "@/lib/device"
import { DateStrip } from "@/components/padel/date-strip"
import { FilterChips } from "@/components/padel/filter-chips"
import { SlotCard } from "@/components/padel/slot-card"
import { EmptyState } from "@/components/padel/empty-state"
import { usePreferences } from "@/hooks/use-preferences"

// Client-side fetch deduplication — prevents duplicate network requests
// when prefetch + navigation happen for the same URL concurrently.
const inFlightFetches = new Map<string, Promise<TimeSlot[]>>()
const slotsFetcher = (url: string): Promise<TimeSlot[]> => {
  const existing = inFlightFetches.get(url)
  if (existing) return existing

  const promise = fetch(url)
    .then((res) => res.json() as Promise<TimeSlot[]>)
    .finally(() => inFlightFetches.delete(url))
  inFlightFetches.set(url, promise)
  return promise
}

const LOCATIONS = ["all", "Ubud", "Sanur"] as const
const DURATIONS = ["60+", "60", "90"] as const

type SkipReason = "day-disabled" | "duration-too-long" | null

type PadelClientProps = Readonly<{
  initialSlotCache: Record<string, TimeSlot[]>
  initialDate: string
  allClubs?: ClubInfo[]
}>

export default function PadelClient({
  initialSlotCache,
  initialDate,
  allClubs = [],
}: PadelClientProps) {
  const [filters, setFilters] = useQueryStates(
    {
      date: parseAsString.withDefault(initialDate),
      location: parseAsStringLiteral(LOCATIONS).withDefault("all"),
      duration: parseAsStringLiteral(DURATIONS).withDefault("90"),
      club: parseAsString.withDefault("all"),
      showAll: parseAsBoolean.withDefault(false),
    },
    { clearOnDefault: true },
  )

  const {
    date: selectedDate,
    location: selectedLocation,
    duration: selectedDuration,
    club: selectedClub,
    showAll,
  } = filters

  const [dismissedError, setDismissedError] = useState(false)

  const { prefs, hasActivePrefs } = usePreferences()

  const { mutate: globalMutate } = useSWRConfig()

  useEffect(() => {
    setDismissedError(false)
  }, [selectedDate])

  // Determine if we can skip the API call entirely because
  // the selected duration can't possibly fit the user's preference windows.
  const skipReason: SkipReason = useMemo(() => {
    if (showAll || !hasActivePrefs) return null

    const weekday = new Date(`${selectedDate}T12:00:00`).getDay()
    const dayPref = prefs.availability[weekday]

    if (!dayPref?.enabled) return "day-disabled"
    if (dayPref.ranges.length === 0) return null

    const durationMinutes = selectedDuration === "90" ? 90 : 60
    const canFit = dayPref.ranges.some((range) => {
      const [sh, sm] = range.start.split(":").map(Number)
      const [eh, em] = range.end.split(":").map(Number)
      return eh * 60 + em - (sh * 60 + sm) >= durationMinutes
    })
    return canFit ? null : "duration-too-long"
  }, [
    selectedDate,
    selectedDuration,
    prefs.availability,
    showAll,
    hasActivePrefs,
  ])

  const swrKey = skipReason ? null : `/api/playtomic/slots?date=${selectedDate}`

  const hasFallback = selectedDate === initialDate
  const {
    data: timeSlots = [],
    isLoading,
    error,
    mutate,
  } = useSWR<TimeSlot[]>(swrKey, slotsFetcher, {
    fallbackData: hasFallback ? initialSlotCache[initialDate] : undefined,
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 5 * 60 * 1000,
  })

  const dates = getNext14Days()

  const prefetchedDates = useRef(new Set<string>([initialDate]))
  const prefetchDate = useCallback(
    (date: string) => {
      if (prefetchedDates.current.has(date)) return
      prefetchedDates.current.add(date)
      const key = `/api/playtomic/slots?date=${date}`
      void globalMutate(key, slotsFetcher(key), { revalidate: false })
    },
    [globalMutate],
  )

  const cutoff = new Date(Date.now() + 3600000)
  const durationFilter: Record<string, (duration: number) => boolean> = {
    "60+": (duration) => duration >= 60,
    "60": (duration) => duration === 60,
    "90": (duration) => duration === 90,
  }

  const filteredSlots = timeSlots.filter((slot) => {
    const slotTime = new Date(`${slot.date}T${slot.time}`)
    if (slotTime <= cutoff) return false
    if (!durationFilter[selectedDuration]?.(slot.duration)) return false
    if (selectedLocation !== "all" && slot.location !== selectedLocation)
      return false

    if (!showAll) {
      if (prefs.clubs.length > 0 && !prefs.clubs.includes(slot.club))
        return false

      const weekday = new Date(slot.date).getDay()
      const dayPref = prefs.availability[weekday]

      if (!dayPref?.enabled) return false

      if (dayPref.ranges.length > 0) {
        const t = slot.time.slice(0, 5)
        const [h, m] = t.split(":").map(Number)
        const endMinutes = h * 60 + m + slot.duration
        const slotEnd = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`
        const fitsAnyRange = dayPref.ranges.some(
          (r) => t >= r.start && slotEnd <= r.end,
        )
        if (!fitsAnyRange) return false
      }
    }

    if (selectedClub !== "all" && slot.club !== selectedClub) return false

    return true
  })

  const handleBook = useCallback((slot: TimeSlot) => {
    const mobile = isMobileDevice()
    const url = mobile
      ? playtomicTenantUrl(slot.tenantId)
      : (clubWebsites[slot.club] ??
        playtomicTenantUrl(slot.tenantId, slot.tenantSlug, slot.date))
    globalThis.open(url, "_blank", "noopener,noreferrer")
  }, [])

  const uniqueClubsFromSlots = [
    ...new Set(timeSlots.map((slot) => slot.club)),
  ].sort((a, b) => a.localeCompare(b))
  const allClubNames =
    allClubs.length > 0
      ? [...allClubs].map((c) => c.name).sort((a, b) => a.localeCompare(b))
      : uniqueClubsFromSlots
  const clubOptions =
    prefs.clubs.length > 0
      ? [
          { value: "all", label: "All saved clubs" },
          ...prefs.clubs.map((club) => ({ value: club, label: club })),
        ]
      : [
          { value: "all", label: "All clubs" },
          ...allClubNames.map((club) => ({ value: club, label: club })),
        ]

  const locationOptions = [
    { value: "all", label: "All" },
    { value: "Ubud", label: "Ubud" },
    { value: "Sanur", label: "Sanur" },
  ]

  const showErrorBanner = error && !dismissedError

  return (
    <div className="min-h-screen bg-background">
      {showErrorBanner && (
        <div
          className="sticky top-0 z-30 bg-destructive/10 border-b border-destructive/20 text-destructive px-4 py-2 flex items-center justify-between gap-2"
          role="alert"
        >
          <span className="text-sm font-medium">
            Couldn&apos;t load slots. Check your connection.
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => mutate()}
              className="p-1 rounded hover:bg-destructive/20 transition-colors"
              title="Retry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDismissedError(true)}
              className="p-1 rounded hover:bg-destructive/20 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-4 pt-4 pb-3 space-y-3">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div>
              <h1 className="font-serif text-2xl text-foreground leading-tight">
                PadelPulse
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ubud &amp; Sanur — live availability
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/preferences"
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                title="My availability"
                aria-label="My availability"
              >
                <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              </Link>
              <button
                onClick={() => mutate()}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                title="Refresh"
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 text-muted-foreground ${isLoading ? "animate-spin" : ""}`}
                />
              </button>
              <Badge
                variant="outline"
                className="text-xs text-primary border-primary/40 bg-primary/8 font-medium"
              >
                {filteredSlots.length} slots
              </Badge>
            </div>
          </div>

          {hasActivePrefs && (
            <div className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 rounded-md bg-muted/50 text-xs">
              <span className="text-muted-foreground">
                Filtered by your preferences
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilters({ showAll: !showAll })}
                  className="font-medium text-primary hover:underline"
                >
                  {showAll ? "Apply filters" : "Show all"}
                </button>
                <Link
                  href="/preferences"
                  className="font-medium text-primary hover:underline"
                >
                  Edit
                </Link>
              </div>
            </div>
          )}

          <DateStrip
            dates={dates}
            selected={selectedDate}
            onSelect={(date) => setFilters({ date })}
            onPrefetchDate={prefetchDate}
          />

          <div className="flex flex-wrap gap-3 items-center">
            <FilterChips
              label="Where"
              options={locationOptions}
              selected={selectedLocation}
              onSelect={(location) =>
                setFilters({ location: location as (typeof LOCATIONS)[number] })
              }
            />
            <FilterChips
              label="Duration"
              options={
                durationOptions as unknown as { value: string; label: string }[]
              }
              selected={selectedDuration}
              onSelect={(duration) =>
                setFilters({ duration: duration as (typeof DURATIONS)[number] })
              }
            />
          </div>

          {clubOptions.length > 1 && (
            <Select
              value={selectedClub}
              onValueChange={(club) => setFilters({ club })}
            >
              <SelectTrigger className="h-8 text-xs w-full border-border bg-background">
                <SelectValue placeholder="All clubs" />
              </SelectTrigger>
              <SelectContent>
                {clubOptions.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-sm"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-2">
        {skipReason === "day-disabled" ? (
          <EmptyState
            message="Day marked unavailable"
            subtitle="Toggle 'Show all' to see available slots anyway, or adjust your preferences."
          />
        ) : skipReason === "duration-too-long" ? (
          <EmptyState
            message={`${selectedDuration}-min slots don\u2019t fit your time window`}
            subtitle="Try a shorter duration or widen your availability in preferences."
          />
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredSlots.length > 0 ? (
          filteredSlots.map((slot) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              onBook={handleBook}
              hasClubSite={!!clubWebsites[slot.club]}
            />
          ))
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  )
}
