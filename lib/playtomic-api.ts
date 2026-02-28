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
  club: string
  location: "Ubud" | "Sanur"
  date: string
  time: string
  court: string
  price: number
  available: boolean
  duration: number
}

// Location coordinates
const LOCATIONS = {
  ubud: { coord: "-8.506,115.262", name: "Ubud", lat: -8.506, lng: 115.262 },
  sanur: { coord: "-8.6725,115.2625", name: "Sanur", lat: -8.6725, lng: -115.2625 },
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export class PlaytomicAPI {
  private baseUrl = "/api/playtomic"

  async getTenants(location: "ubud" | "sanur"): Promise<PlaytomicTenant[]> {
    const url = `${this.baseUrl}/tenants?location=${location}`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`)
      }
      const tenants = await response.json()
      return tenants
    } catch (error) {
      console.error("Error fetching tenants:", error)
      return []
    }
  }

  async getResources(tenantId: string): Promise<PlaytomicResource[]> {
    const url = `${this.baseUrl}/resources?tenant_id=${tenantId}`

    try {
      const response = await fetch(url)
      const resources = await response.json()
      return resources
    } catch (error) {
      // Resources API is optional, silently return empty array
      return []
    }
  }

  async getAvailability(tenantId: string, date: string): Promise<PlaytomicAvailability[]> {
    const url = `${this.baseUrl}/availability?tenant_id=${tenantId}&date=${date}`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`)
      }
      const availability = await response.json()
      return availability
    } catch (error) {
      console.error(`Error fetching availability for tenant ${tenantId}:`, error)
      return []
    }
  }

  async getAllAvailableSlots(location: "ubud" | "sanur", date: string): Promise<TimeSlot[]> {
    const tenants = await this.getTenants(location)
    const allSlots: TimeSlot[] = []

    for (const tenant of tenants) {
      try {
        const availability = await this.getAvailability(tenant.id, date)

        // Try to get resources for court names, but don't fail if it doesn't work
        let resourceMap = new Map<string, string>()
        try {
          const resources = await this.getResources(tenant.id)
          resourceMap = new Map(resources.map((r) => [r.id, r.name]))
          console.log(`[v0] Got ${resources.length} resources for ${tenant.name}`)
        } catch (error) {
          console.log(`[v0] Could not get resources for ${tenant.name}, using resource IDs as names`)
        }

        console.log(`[v0] Processing ${availability.length} availability entries for ${tenant.name}`)

        // Process availability data
        for (const avail of availability) {
          const courtName = resourceMap.get(avail.resource_id) || `Court ${avail.resource_id.substring(0, 8)}`

          for (const slot of avail.slots) {
            allSlots.push({
              id: `${tenant.id}-${avail.resource_id}-${avail.start_date}-${slot.start_time}`,
              club: tenant.name,
              location: LOCATIONS[location].name as "Ubud" | "Sanur",
              date: avail.start_date,
              time: slot.start_time,
              court: courtName,
              price: slot.price,
              available: true,
              duration: slot.duration,
            })
          }
        }
      } catch (error) {
        console.error(`Error processing tenant ${tenant.name}:`, error)
      }
    }

    console.log(`[v0] Total slots found for ${location}: ${allSlots.length}`)
    return allSlots.sort((a, b) => {
      // Sort by date, then time
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.time.localeCompare(b.time)
    })
  }

  async getAllSlotsForBothLocations(date: string): Promise<TimeSlot[]> {
    const [ubudSlots, sanurSlots] = await Promise.all([
      this.getAllAvailableSlots("ubud", date),
      this.getAllAvailableSlots("sanur", date),
    ])

    const clubLocationMap = new Map<string, "Ubud" | "Sanur">()
    const allSlots = [...ubudSlots, ...sanurSlots]

    // First pass: determine the closest location for each club
    const clubCoordinates = new Map<string, { lat: number; lon: number }>()

    // Get tenant data to find coordinates for each club
    const [ubudTenants, sanurTenants] = await Promise.all([this.getTenants("ubud"), this.getTenants("sanur")])

    const allTenants = [...ubudTenants, ...sanurTenants]

    console.log(`[v0] Total tenants found: ${allTenants.length}`)
    console.log(`[v0] Sample tenant data:`, JSON.stringify(allTenants.slice(0, 2), null, 2))

    for (const tenant of allTenants) {
      console.log(`[v0] Processing tenant: ${tenant.name}, coordinate:`, tenant.coordinate)

      if (tenant.coordinate && tenant.coordinate.lat && tenant.coordinate.lon) {
        const distanceToUbud = calculateDistance(
          tenant.coordinate.lat,
          tenant.coordinate.lon,
          LOCATIONS.ubud.lat,
          LOCATIONS.ubud.lng,
        )
        const distanceToSanur = calculateDistance(
          tenant.coordinate.lat,
          tenant.coordinate.lon,
          LOCATIONS.sanur.lat,
          LOCATIONS.sanur.lng,
        )

        const closestLocation = distanceToUbud <= distanceToSanur ? "Ubud" : "Sanur"
        clubLocationMap.set(tenant.name, closestLocation)

        console.log(
          `[v0] ${tenant.name}: ${distanceToUbud.toFixed(1)}km to Ubud, ${distanceToSanur.toFixed(1)}km to Sanur -> assigned to ${closestLocation}`,
        )
      } else {
        console.log(`[v0] ${tenant.name}: No coordinate data available`)
      }
    }

    console.log(`[v0] Club location assignments:`, Array.from(clubLocationMap.entries()))

    // Second pass: filter slots to only include clubs in their assigned location
    const deduplicatedSlots = allSlots.filter((slot) => {
      const assignedLocation = clubLocationMap.get(slot.club)
      if (!assignedLocation) {
        // If we don't have coordinate data, keep the slot as-is
        console.log(`[v0] No location assignment for ${slot.club}, keeping slot`)
        return true
      }
      const shouldKeep = slot.location === assignedLocation
      if (!shouldKeep) {
        console.log(`[v0] Filtering out ${slot.club} slot from ${slot.location} (assigned to ${assignedLocation})`)
      }
      return shouldKeep
    })

    console.log(`[v0] Before deduplication: ${allSlots.length} slots`)
    console.log(`[v0] After deduplication: ${deduplicatedSlots.length} slots`)

    return deduplicatedSlots.sort((a, b) => {
      // Sort by date, then time
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.time.localeCompare(b.time)
    })
  }
}

// Export singleton instance
export const playtomicAPI = new PlaytomicAPI()
