// Real Playtomic API integration utilities
import { getCourtName } from "@/lib/court-names"
import { getFromCache, setInCache } from "@/lib/slot-cache"

// ─── Server-side fetcher (called directly from Server Components) ─────────────
// Calls Playtomic directly — no API route round-trip.
// next: { revalidate } means Next.js caches responses at the infra level,
// so subsequent page loads are served instantly from cache.

const PLAYTOMIC_BASE = "https://api.playtomic.io/v1"
const PLAYTOMIC_HEADERS = {
  Accept: "application/json",
  "X-Requested-With": "com.playtomic.app",
}

const SERVER_LOCATIONS = {
  ubud: { coord: "-8.506,115.262", name: "Ubud" as const },
  sanur: { coord: "-8.700,115.263", name: "Sanur" as const },
}

async function serverFetch<T>(url: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: PLAYTOMIC_HEADERS,
      next: { revalidate },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function fetchTenantsServer(location: keyof typeof SERVER_LOCATIONS): Promise<PlaytomicTenant[]> {
  const { coord } = SERVER_LOCATIONS[location]
  const url = `${PLAYTOMIC_BASE}/tenants?coordinate=${coord}&radius=8000&sport_id=PADEL&playtomic_status=ACTIVE&size=500`
  const data = await serverFetch<any[]>(url, 10 * 60) // cache 10 min
  if (!data) return []
  return data.map((t) => ({
    id: t.tenant_id || t.id,
    name: t.name || t.tenant_name,
    address: t.address,
    coordinate: t.address?.coordinate || t.coordinate,
  }))
}

async function fetchAvailabilityServer(tenantId: string, date: string): Promise<PlaytomicAvailability[]> {
  const url = `${PLAYTOMIC_BASE}/availability?sport_id=PADEL&tenant_id=${tenantId}&start_min=${date}T00:00:00&start_max=${date}T23:59:59`
  const data = await serverFetch<any[]>(url, 5 * 60) // cache 5 min
  if (!data || !Array.isArray(data)) return []
  return data.map((item) => ({
    resource_id: item.resource_id,
    start_date: item.start_date,
    slots: (item.slots || []).map((s: any) => ({
      start_time: convertToBaliTime(s.start_time),
      duration: s.duration,
      price: typeof s.price === "string" ? parseInt(s.price.replace(/[^\d]/g, "")) || 0 : s.price || 0,
    })),
  }))
}

function convertToBaliTime(utcTime: string): string {
  if (!utcTime) return utcTime
  // Bali is UTC+8 — add 8 hours
  const [h, m, s] = utcTime.split(":").map(Number)
  if (isNaN(h)) return utcTime
  const baliHour = (h + 8) % 24
  return `${String(baliHour).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s ?? 0).padStart(2, "0")}`
}

export async function fetchSlotsForDate(date: string): Promise<TimeSlot[]> {
  const [ubudTenants, sanurTenants] = await Promise.all([
    fetchTenantsServer("ubud"),
    fetchTenantsServer("sanur"),
  ])

  const allTenants = [
    ...ubudTenants.map((t) => ({ ...t, location: "Ubud" as const })),
    ...sanurTenants.map((t) => ({ ...t, location: "Sanur" as const })),
  ]

  // Deduplicate tenants by ID (a tenant near both areas appears in both searches)
  const seen = new Set<string>()
  const uniqueTenants = allTenants.filter((t) => {
    if (seen.has(t.id)) return false
    seen.add(t.id)
    return true
  })

  const allSlots = (
    await Promise.all(
      uniqueTenants.map(async (tenant) => {
        const availability = await fetchAvailabilityServer(tenant.id, date)
        const slots: TimeSlot[] = []
        for (const avail of availability) {
          const court = getCourtName(tenant.id, avail.resource_id)
          for (const slot of avail.slots) {
            slots.push({
              id: `${tenant.id}-${avail.resource_id}-${avail.start_date}-${slot.start_time}-${slot.duration}`,
              tenantId: tenant.id,
              club: tenant.name,
              location: tenant.location,
              date: avail.start_date,
              time: slot.start_time,
              court,
              price: slot.price,
              available: true,
              duration: slot.duration,
            })
          }
        }
        return slots
      })
    )
  ).flat()

  return allSlots.sort((a, b) =>
    a.date !== b.date ? a.date.localeCompare(b.date) : a.time.localeCompare(b.time)
  )
}

export interface PlaytomicTenant {
  id: string
  name: string
  address?: string
  coordinate?: {
    lat: number
    lon: number // Changed from lng to lon to match API response
  }
}

export interface PlaytomicSlot {
  start_time: string
  duration: number
  price: number
}

export interface PlaytomicAvailability {
  resource_id: string
  start_date: string
  slots: PlaytomicSlot[]
}

export interface TimeSlot {
  id: string
  tenantId: string
  club: string
  location: "Ubud" | "Sanur"
  date: string
  time: string
  court: string
  price: number
  available: boolean
  duration: number
}

// Location coordinates — Bali is eastern hemisphere, longitude is positive
const LOCATIONS = {
  ubud: { name: "Ubud", lat: -8.506, lng: 115.262 },
  sanur: { name: "Sanur", lat: -8.700, lng: 115.263 },
} as const

// Haversine formula for distance calculation
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

export class PlaytomicAPI {
  private baseUrl = "/api/playtomic"

  private async fetch<T>(url: string): Promise<T | null> {
    try {
      const res = await fetch(url)
      return res.ok ? res.json() : null
    } catch {
      return null
    }
  }

  async getTenants(location: "ubud" | "sanur"): Promise<PlaytomicTenant[]> {
    const data = await this.fetch<PlaytomicTenant[]>(`${this.baseUrl}/tenants?location=${location}`)
    return data ?? []
  }

  async getAvailability(tenantId: string, date: string): Promise<PlaytomicAvailability[]> {
    const data = await this.fetch<PlaytomicAvailability[]>(
      `${this.baseUrl}/availability?tenant_id=${tenantId}&date=${date}`
    )
    return data ?? []
  }

  // Returns slots AND the tenants used, so callers don't need to re-fetch tenants
  private async getSlotsAndTenants(
    location: "ubud" | "sanur",
    date: string,
  ): Promise<{ slots: TimeSlot[]; tenants: PlaytomicTenant[] }> {
    const tenants = await this.getTenants(location)
    const allSlots: TimeSlot[] = []

    for (const tenant of tenants) {
      const availability = await this.getAvailability(tenant.id, date)

      for (const avail of availability) {
        // Resolve human-readable court name using tenant+resource pair
        const court = getCourtName(tenant.id, avail.resource_id)

        for (const slot of avail.slots) {
          allSlots.push({
            // Include duration in the key to prevent duplicates across duration variants
            id: `${tenant.id}-${avail.resource_id}-${avail.start_date}-${slot.start_time}-${slot.duration}`,
            tenantId: tenant.id,
            club: tenant.name,
            location: LOCATIONS[location].name as "Ubud" | "Sanur",
            date: avail.start_date,
            time: slot.start_time,
            court,
            price: slot.price,
            available: true,
            duration: slot.duration,
          })
        }
      }
    }

    return { slots: allSlots, tenants }
  }

  async getAllSlotsForBothLocations(date: string): Promise<TimeSlot[]> {
    // Fetch slots and tenant data in parallel — single fetch per location, no double-fetching
    const [{ slots: ubudSlots, tenants: ubudTenants }, { slots: sanurSlots, tenants: sanurTenants }] =
      await Promise.all([this.getSlotsAndTenants("ubud", date), this.getSlotsAndTenants("sanur", date)])

    const allTenants = [...ubudTenants, ...sanurTenants]

    // Assign each club to exactly one location based on closest distance
    const clubLocationMap = new Map<string, "Ubud" | "Sanur">()
    for (const tenant of allTenants) {
      if (!tenant.coordinate?.lat || !tenant.coordinate?.lon) continue
      const distUbud = calculateDistance(
        tenant.coordinate.lat, tenant.coordinate.lon,
        LOCATIONS.ubud.lat, LOCATIONS.ubud.lng,
      )
      const distSanur = calculateDistance(
        tenant.coordinate.lat, tenant.coordinate.lon,
        LOCATIONS.sanur.lat, LOCATIONS.sanur.lng,
      )
      clubLocationMap.set(tenant.name, distUbud <= distSanur ? "Ubud" : "Sanur")
    }

    // Deduplicate: keep each slot only for its geographically assigned location
    const allSlots = [...ubudSlots, ...sanurSlots]
    return allSlots
      .filter((slot) => {
        const assigned = clubLocationMap.get(slot.club)
        // If we have coordinate data, enforce the assignment; otherwise keep the slot
        return !assigned || slot.location === assigned
      })
      .sort((a, b) =>
        a.date !== b.date ? a.date.localeCompare(b.date) : a.time.localeCompare(b.time),
      )
  }
}

// Export singleton instance
export const playtomicAPI = new PlaytomicAPI()
