/**
 * Raw response types from the Playtomic API (api.playtomic.io/v1).
 * Used for type-safe parsing of API responses.
 */

export type PlaytomicApiTenant = {
  tenant_id?: string
  id?: string
  name?: string
  tenant_name?: string
  slug?: string
  address?: {
    coordinate?: { lat: number; lon: number }
  }
  coordinate?: { lat: number; lon: number }
}

export type PlaytomicApiSlot = {
  start_time: string
  duration: number
  price: string | number
}

export type PlaytomicApiAvailabilityItem = {
  resource_id: string
  start_date: string
  slots?: PlaytomicApiSlot[]
}

export type PlaytomicApiResource = {
  resource_id: string
  name: string
  sport_id?: string
  reservation_priority?: number
  is_active?: boolean
  properties?: {
    resource_type?: string
    resource_size?: string
    resource_feature?: string
  }
}

// ─── User preferences (localStorage) ───────────────────────────────────────

export type TimeRange = {
  start: string // "HH:MM"
  end: string // "HH:MM"
}

export type DayAvailability = {
  enabled: boolean
  ranges: TimeRange[] // empty = full day (no time filter)
}

export type UserPreferences = {
  availability: Record<number, DayAvailability> // 0=Sun .. 6=Sat
  clubs: string[] // club names; empty = all clubs
}

const DEFAULT_DAY: DayAvailability = {
  enabled: true,
  ranges: [],
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  availability: {
    0: DEFAULT_DAY,
    1: DEFAULT_DAY,
    2: DEFAULT_DAY,
    3: DEFAULT_DAY,
    4: DEFAULT_DAY,
    5: DEFAULT_DAY,
    6: DEFAULT_DAY,
  },
  clubs: [],
}
