"use client"

import { useCallback } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
} from "@/components/ui/sheet"
import { X, Plus, Trash2 } from "lucide-react"
import { weekdays } from "@/lib/constants"
import type { UserPreferences, DayAvailability, TimeRange } from "@/lib/types"
import { DEFAULT_USER_PREFERENCES } from "@/lib/types"
import type { ClubInfo } from "@/lib/playtomic-api"
import { cn } from "@/lib/utils"

export type PreferencesContentProps = Readonly<{
  prefs: UserPreferences
  setPreferences: (updater: (prev: UserPreferences) => UserPreferences) => void
  allClubs: ClubInfo[]
}>

type PreferencesSheetProps = Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  prefs: UserPreferences
  setPreferences: (updater: (prev: UserPreferences) => UserPreferences) => void
  allClubs: ClubInfo[]
}>

/**
 * Sort ranges by start time and merge any that overlap so no two windows
 * cover the same period.
 */
function normalizeRanges(ranges: TimeRange[]): TimeRange[] {
  if (ranges.length <= 1) return ranges
  const sorted = [...ranges].sort((a, b) => a.start.localeCompare(b.start))
  const merged: TimeRange[] = [sorted[0]]
  for (let i = 1; i < sorted.length; i++) {
    const prev = merged.at(-1)!
    const cur = sorted[i]
    if (cur.start < prev.end) {
      if (cur.end > prev.end) prev.end = cur.end
    } else {
      merged.push({ ...cur })
    }
  }
  return merged
}

/**
 * Shared preferences form body (day toggles, time ranges, clubs).
 * Used by both the sheet overlay and the standalone /preferences page.
 */
export function PreferencesContent({
  prefs,
  setPreferences,
  allClubs,
}: PreferencesContentProps) {
  const setDay = useCallback(
    (weekday: number, value: DayAvailability) => {
      setPreferences((prev) => ({
        ...prev,
        availability: {
          ...prev.availability,
          [weekday]: { ...value, ranges: normalizeRanges(value.ranges) },
        },
      }))
    },
    [setPreferences],
  )

  const toggleDay = useCallback(
    (weekday: number, enabled: boolean) => {
      const current = prefs.availability[weekday]
      setDay(weekday, { ...current, enabled })
    },
    [prefs.availability, setDay],
  )

  const addRange = useCallback(
    (weekday: number) => {
      const current = prefs.availability[weekday]
      const last = current.ranges.at(-1)
      const newRange: TimeRange = last
        ? { start: last.end, end: last.end < "22:00" ? "22:00" : "23:59" }
        : { start: "09:00", end: "12:00" }
      setDay(weekday, { ...current, ranges: [...current.ranges, newRange] })
    },
    [prefs.availability, setDay],
  )

  const updateRange = useCallback(
    (weekday: number, index: number, field: "start" | "end", value: string) => {
      const current = prefs.availability[weekday]
      const updated = current.ranges.map((r, i) =>
        i === index ? { ...r, [field]: value } : r,
      )
      setDay(weekday, { ...current, ranges: updated })
    },
    [prefs.availability, setDay],
  )

  const removeRange = useCallback(
    (weekday: number, index: number) => {
      const current = prefs.availability[weekday]
      setDay(weekday, {
        ...current,
        ranges: current.ranges.filter((_, i) => i !== index),
      })
    },
    [prefs.availability, setDay],
  )

  const applyToAllDays = useCallback(() => {
    const first = Object.values(prefs.availability).find((d) => d.enabled)
    if (!first) return
    setPreferences((prev) => ({
      ...prev,
      availability: {
        0: { ...first },
        1: { ...first },
        2: { ...first },
        3: { ...first },
        4: { ...first },
        5: { ...first },
        6: { ...first },
      },
    }))
  }, [prefs.availability, setPreferences])

  const toggleClub = useCallback(
    (clubName: string, checked: boolean) => {
      setPreferences((prev) => {
        const next = checked
          ? [...prev.clubs, clubName]
          : prev.clubs.filter((c) => c !== clubName)
        return { ...prev, clubs: next }
      })
    },
    [setPreferences],
  )

  const clearAll = useCallback(() => {
    setPreferences(() => ({ ...DEFAULT_USER_PREFERENCES }))
  }, [setPreferences])

  const sortedClubs = [...allClubs].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          When I&apos;m available
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Unchecked days are hidden entirely. Add time windows to limit when
          you&apos;re free — or leave empty for all hours.
        </p>
        <div className="space-y-3">
          {(weekdays as unknown as readonly string[]).map((label, i) => {
            const day = prefs.availability[i]
            const enabled = day?.enabled ?? true

            return (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => toggleDay(i, e.target.checked)}
                      className="rounded border-border"
                    />
                    <span
                      className={cn(
                        "text-sm font-medium w-8",
                        !enabled && "text-muted-foreground",
                      )}
                    >
                      {label}
                    </span>
                  </label>

                  {enabled && (
                    <button
                      type="button"
                      onClick={() => addRange(i)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                    >
                      <Plus className="w-3 h-3" />
                      Add window
                    </button>
                  )}
                </div>

                {enabled && day.ranges.length > 0 && (
                  <div className="ml-6 space-y-1.5">
                    {day.ranges.map((range, ri) => (
                      <div key={ri} className="flex items-center gap-2 text-sm">
                        <input
                          type="time"
                          value={range.start}
                          onChange={(e) =>
                            updateRange(i, ri, "start", e.target.value)
                          }
                          className="h-7 rounded border border-border bg-background px-2 text-xs"
                        />
                        <span className="text-muted-foreground text-xs">
                          to
                        </span>
                        <input
                          type="time"
                          value={range.end}
                          onChange={(e) =>
                            updateRange(i, ri, "end", e.target.value)
                          }
                          className="h-7 rounded border border-border bg-background px-2 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => removeRange(i, ri)}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label="Remove time window"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {enabled && day.ranges.length === 0 && (
                  <p className="ml-6 text-xs text-muted-foreground">
                    All hours
                  </p>
                )}
              </div>
            )
          })}
        </div>
        <button
          type="button"
          onClick={applyToAllDays}
          className="mt-3 text-xs text-primary hover:underline font-medium"
        >
          Apply first day to all days
        </button>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Clubs
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Only show slots from selected clubs. Leave all unchecked for all
          clubs.
        </p>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {sortedClubs.map((club) => (
            <label
              key={club.id}
              className={cn(
                "flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer text-sm",
              )}
            >
              <input
                type="checkbox"
                checked={prefs.clubs.includes(club.name)}
                onChange={(e) => toggleClub(club.name, e.target.checked)}
                className="rounded border-border"
              />
              <span className="font-medium">{club.name}</span>
              <span className="text-xs text-muted-foreground">
                {club.location}
              </span>
            </label>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={clearAll}
        className="text-xs text-muted-foreground hover:text-foreground underline"
      >
        Reset all preferences
      </button>
    </div>
  )
}

export function PreferencesSheet({
  open,
  onOpenChange,
  prefs,
  setPreferences,
  allClubs,
}: PreferencesSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="p-0">
        <SheetHeader>
          <SheetTitle>My availability</SheetTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </SheetHeader>
        <SheetBody className="space-y-6">
          <PreferencesContent
            prefs={prefs}
            setPreferences={setPreferences}
            allClubs={allClubs}
          />
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
