import type { TimeSlot } from "@/lib/playtomic-api"

// Module-level cache — persists across all requests within the same Node.js process.
// Unlike useState or route-handler locals, this survives serverless warm instances.
// TTL: 5 minutes for today (slots change), 10 minutes for future days.

const TODAY_TTL = 5 * 60 * 1000
const FUTURE_TTL = 10 * 60 * 1000

interface CacheEntry {
  slots: TimeSlot[]
  fetchedAt: number
  ttl: number
}

const store = new Map<string, CacheEntry>()

// Whether a background warm-up has been initiated for the 14-day window
let warmedForDate = ""

function getTTL(date: string): number {
  const today = new Date().toISOString().split("T")[0]
  return date === today ? TODAY_TTL : FUTURE_TTL
}

export function getFromCache(date: string): TimeSlot[] | null {
  const entry = store.get(date)
  if (!entry) return null
  if (Date.now() - entry.fetchedAt > entry.ttl) {
    store.delete(date)
    return null
  }
  return entry.slots
}

export function setInCache(date: string, slots: TimeSlot[]): void {
  store.set(date, {
    slots,
    fetchedAt: Date.now(),
    ttl: getTTL(date),
  })
}

export function needsWarmup(today: string): boolean {
  if (warmedForDate === today) return false
  warmedForDate = today
  return true
}
