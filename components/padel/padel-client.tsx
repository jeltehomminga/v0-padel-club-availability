"use client"

import { useState, useCallback, useEffect } from "react"
import useSWR, { useSWRConfig } from "swr"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, RefreshCw, X } from "lucide-react"
import type { TimeSlot } from "@/lib/playtomic-api"
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

const slotsFetcher = (url: string) =>
  fetch(url).then((response) => response.json() as Promise<TimeSlot[]>)

type PadelClientProps = {
  initialSlotCache: Record<string, TimeSlot[]>
  initialDate: string
}

export default function PadelClient({
  initialSlotCache,
  initialDate,
}: PadelClientProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [selectedClub, setSelectedClub] = useState("all")
  const [selectedDuration, setSelectedDuration] = useState("90")
  const [dismissedError, setDismissedError] = useState(false)

  const { mutate: globalMutate } = useSWRConfig()

  useEffect(() => {
    setDismissedError(false)
  }, [selectedDate])

  const {
    data: timeSlots = [],
    isLoading,
    error,
    mutate,
  } = useSWR<TimeSlot[]>(
    `/api/playtomic/slots?date=${selectedDate}`,
    slotsFetcher,
    {
      fallbackData:
        selectedDate === initialDate
          ? initialSlotCache[initialDate]
          : undefined,
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000,
    },
  )

  const dates = getNext14Days()

  const prefetchDate = useCallback(
    (date: string) => {
      const key = `/api/playtomic/slots?date=${date}`
      void globalMutate(key, slotsFetcher(key))
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
    return (
      slotTime > cutoff &&
      durationFilter[selectedDuration]?.(slot.duration) &&
      (selectedLocation === "all" || slot.location === selectedLocation) &&
      (selectedClub === "all" || slot.club === selectedClub)
    )
  })

  const handleBook = useCallback((slot: TimeSlot) => {
    const url = isMobileDevice()
      ? playtomicTenantUrl(slot.tenantId)
      : (clubWebsites[slot.club] ?? playtomicTenantUrl(slot.tenantId))
    window.open(url, "_blank", "noopener,noreferrer")
  }, [])

  const uniqueClubs = [...new Set(timeSlots.map((slot) => slot.club))].sort(
    (a, b) => a.localeCompare(b),
  )

  const locationOptions = [
    { value: "all", label: "All" },
    { value: "Ubud", label: "Ubud" },
    { value: "Sanur", label: "Sanur" },
  ]

  const clubOptions = [
    { value: "all", label: "All clubs" },
    ...uniqueClubs.map((club) => ({ value: club, label: club })),
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
                Padel Courts Bali
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ubud &amp; Sanur — live availability
              </p>
            </div>
            <div className="flex items-center gap-2">
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

          <DateStrip
            dates={dates}
            selected={selectedDate}
            onSelect={setSelectedDate}
            onPrefetchDate={prefetchDate}
          />

          <div className="flex flex-wrap gap-3 items-center">
            <FilterChips
              label="Where"
              options={locationOptions}
              selected={selectedLocation}
              onSelect={setSelectedLocation}
            />
            <FilterChips
              label="Duration"
              options={durationOptions}
              selected={selectedDuration}
              onSelect={setSelectedDuration}
            />
          </div>

          {uniqueClubs.length > 0 && (
            <Select value={selectedClub} onValueChange={setSelectedClub}>
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
