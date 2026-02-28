// Real Playtomic API integration utilities
import { getCourtName } from "@/lib/court-names"
import { convertToBaliTime } from "@/lib/time"
import type {
  PlaytomicApiTenant,
  PlaytomicApiAvailabilityItem,
  PlaytomicApiSlot,
} from "@/lib/types"

// ─── Server-side fetcher (called directly from Server Components) ─────────────
// Calls Playtomic directly — no API route round-trip.
// next: { revalidate } means Next.js caches responses at the infra level,
// so subsequent page loads are served instantly from cache.

const playtomicBase = "https://api.playtomic.io/v1"
const playtomicHeaders = {
  Accept: "application/json",
  "X-Requested-With": "com.playtomic.app",
}

const serverLocations = {
  ubud: { coord: "-8.506,115.262", name: "Ubud" as const },
  sanur: { coord: "-8.700,115.263", name: "Sanur" as const },
}

const serverFetch = async <T>(
  url: string,
  revalidate: number,
): Promise<T | null> => {
  try {
    const res = await fetch(url, {
      headers: playtomicHeaders,
      next: { revalidate },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

const fetchTenantsServer = async (
  location: keyof typeof serverLocations,
): Promise<PlaytomicTenant[]> => {
  const { coord } = serverLocations[location]
  const url = `${playtomicBase}/tenants?coordinate=${coord}&radius=8000&sport_id=PADEL&playtomic_status=ACTIVE&size=500`
  const data = await serverFetch<PlaytomicApiTenant[]>(url, 10 * 60) // cache 10 min
  if (!data) return []
  return data.map((tenant: PlaytomicApiTenant) => ({
    id: tenant.tenant_id || tenant.id || "",
    name: tenant.name || tenant.tenant_name || "",
    address: tenant.address,
    coordinate: tenant.address?.coordinate || tenant.coordinate,
  }))
}

const fetchAvailabilityServer = async (
  tenantId: string,
  date: string,
): Promise<PlaytomicAvailability[]> => {
  const url = `${playtomicBase}/availability?sport_id=PADEL&tenant_id=${tenantId}&start_min=${date}T00:00:00&start_max=${date}T23:59:59`
  const data = await serverFetch<PlaytomicApiAvailabilityItem[]>(url, 5 * 60) // cache 5 min
  if (!data || !Array.isArray(data)) return []
  return data.map((item: PlaytomicApiAvailabilityItem) => ({
    resource_id: item.resource_id,
    start_date: item.start_date,
    slots: (item.slots || []).map((slot: PlaytomicApiSlot) => ({
      start_time: convertToBaliTime(slot.start_time),
      duration: slot.duration,
      price:
        typeof slot.price === "string"
          ? Number.parseInt(slot.price.replace(/[^\d]/g, ""), 10) || 0
          : slot.price || 0,
    })),
  }))
}

export async function fetchSlotsForDate(date: string): Promise<TimeSlot[]> {
  const [ubudTenants, sanurTenants] = await Promise.all([
    fetchTenantsServer("ubud"),
    fetchTenantsServer("sanur"),
  ])

  const allTenants = [
    ...ubudTenants.map((tenant) => ({ ...tenant, location: "Ubud" as const })),
    ...sanurTenants.map((tenant) => ({
      ...tenant,
      location: "Sanur" as const,
    })),
  ]

  // Deduplicate tenants by ID (a tenant near both areas appears in both searches)
  const seen = new Set<string>()
  const uniqueTenants = allTenants.filter((tenant) => {
    if (seen.has(tenant.id)) return false
    seen.add(tenant.id)
    return true
  })

  const allSlots = (
    await Promise.all(
      uniqueTenants.map(async (tenant) => {
        const availability = await fetchAvailabilityServer(tenant.id, date)
        return availability.flatMap((avail) =>
          avail.slots.map((slot) => ({
            id: `${tenant.id}-${avail.resource_id}-${avail.start_date}-${slot.start_time}-${slot.duration}`,
            tenantId: tenant.id,
            club: tenant.name,
            location: tenant.location,
            date: avail.start_date,
            time: slot.start_time,
            court: getCourtName(tenant.id, avail.resource_id),
            price: slot.price,
            available: true,
            duration: slot.duration,
          })),
        )
      }),
    )
  ).flat()

  return allSlots.sort((a, b) =>
    a.date !== b.date
      ? a.date.localeCompare(b.date)
      : a.time.localeCompare(b.time),
  )
}

export type PlaytomicTenant = {
  id: string
  name: string
  address?: unknown
  coordinate?: {
    lat: number
    lon: number
  }
}

export type PlaytomicSlot = {
  start_time: string
  duration: number
  price: number
}

export type PlaytomicAvailability = {
  resource_id: string
  start_date: string
  slots: PlaytomicSlot[]
}

export type TimeSlot = {
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
