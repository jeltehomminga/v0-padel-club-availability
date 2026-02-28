// Real Playtomic API integration utilities

export interface PlaytomicTenant {
  id: string
  name: string
  address?: string
  coordinate?: {
    lat: number
    lon: number // Changed from lng to lon to match API response
  }
}

export interface PlaytomicResource {
  id: string
  name: string
  tenant_id: string
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
        for (const slot of avail.slots) {
          allSlots.push({
            id: `${tenant.id}-${avail.resource_id}-${avail.start_date}-${slot.start_time}`,
            tenantId: tenant.id,
            club: tenant.name,
            location: LOCATIONS[location].name as "Ubud" | "Sanur",
            date: avail.start_date,
            time: slot.start_time,
            court: `Court ${avail.resource_id.substring(0, 8)}`,
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
