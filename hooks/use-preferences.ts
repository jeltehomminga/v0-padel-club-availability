"use client"

import { useSyncExternalStore, useCallback } from "react"
import type { UserPreferences, DayAvailability } from "@/lib/types"
import { DEFAULT_USER_PREFERENCES } from "@/lib/types"

const STORAGE_KEY = "padel-preferences"

function getSnapshot(): string {
  if (globalThis.window === undefined)
    return JSON.stringify(DEFAULT_USER_PREFERENCES)
  return (
    globalThis.localStorage.getItem(STORAGE_KEY) ??
    JSON.stringify(DEFAULT_USER_PREFERENCES)
  )
}

function getServerSnapshot(): string {
  return JSON.stringify(DEFAULT_USER_PREFERENCES)
}

const PREFERENCES_CHANGED_EVENT = "padel-preferences-changed"

function subscribe(callback: () => void): () => void {
  if (globalThis.window === undefined) return () => {}
  const handler = () => callback()
  globalThis.window.addEventListener("storage", handler)
  globalThis.window.addEventListener(PREFERENCES_CHANGED_EVENT, handler)
  return () => {
    globalThis.window.removeEventListener("storage", handler)
    globalThis.window.removeEventListener(PREFERENCES_CHANGED_EVENT, handler)
  }
}

/**
 * Migrate old format ({ start, end } | null) to new format ({ enabled, ranges }).
 * Also handles the new format as a no-op.
 */
function migrateDayAvailability(raw: unknown): DayAvailability {
  if (!raw || typeof raw !== "object") {
    return { enabled: true, ranges: [] }
  }
  const obj = raw as Record<string, unknown>
  // New format
  if ("enabled" in obj && "ranges" in obj) {
    return {
      enabled: Boolean(obj.enabled),
      ranges: Array.isArray(obj.ranges) ? obj.ranges : [],
    }
  }
  // Old format: { start: "HH:MM", end: "HH:MM" }
  if ("start" in obj && "end" in obj) {
    return {
      enabled: true,
      ranges: [{ start: String(obj.start), end: String(obj.end) }],
    }
  }
  return { enabled: true, ranges: [] }
}

function parsePrefs(raw: string): UserPreferences {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (
      parsed &&
      typeof parsed.availability === "object" &&
      Array.isArray(parsed.clubs)
    ) {
      const availability: Record<number, DayAvailability> = {}
      for (let i = 0; i <= 6; i++) {
        const day = (parsed.availability as Record<number, unknown>)[i]
        // Old format: null meant "no filter / not set" — migrate to enabled=true, no ranges
        availability[i] =
          day === null
            ? { enabled: true, ranges: [] }
            : migrateDayAvailability(day)
      }
      return {
        availability,
        clubs: parsed.clubs as string[],
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_USER_PREFERENCES
}

export function usePreferences() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const prefs = parsePrefs(raw)

  const setPreferences = useCallback(
    (updater: (prev: UserPreferences) => UserPreferences) => {
      const current = parsePrefs(
        globalThis.localStorage.getItem(STORAGE_KEY) ??
          JSON.stringify(DEFAULT_USER_PREFERENCES),
      )
      const next = updater(current)
      globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      globalThis.window.dispatchEvent(
        new CustomEvent(PREFERENCES_CHANGED_EVENT),
      )
    },
    [],
  )

  // Active when any day is disabled, any day has a time range restriction, or clubs are selected
  const hasActivePrefs =
    prefs.clubs.length > 0 ||
    Object.values(prefs.availability).some(
      (day) => !day.enabled || day.ranges.length > 0,
    )

  return { prefs, setPreferences, hasActivePrefs }
}
