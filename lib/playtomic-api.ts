import { getCourtName } from "@/lib/court-names"
import { convertToBaliTime } from "@/lib/time"
import { serverCache } from "@/lib/cache"
import type {
  PlaytomicApiTenant,
  PlaytomicApiAvailabilityItem,
  PlaytomicApiSlot,
} from "@/lib/types"

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

// ─── In-flight request deduplication ─────────────────────────────────────────
const inFlightTenants = new Map<string, Promise<PlaytomicTenant[]>>()
const inFlightSlots = new Map<string, Promise<TimeSlot[]>>()

const TENANT_CACHE_TTL = 30 * 60 * 1000 // 30 min

const fetchTenantsServer = async (
  location: keyof typeof serverLocations,
  revalidateSeconds = 10 * 60,
): Promise<PlaytomicTenant[]> => {
  const cacheKey = `tenants-${location}`

  const cached = serverCache.get<PlaytomicTenant[]>(cacheKey)
  if (cached) return cached

  const inflight = inFlightTenants.get(cacheKey)
  if (inflight) return inflight

  const promise = (async () => {
    const { coord } = serverLocations[location]
    const url = `${playtomicBase}/tenants?coordinate=${coord}&radius=8000&sport_id=PADEL&playtomic_status=ACTIVE&size=500`
    const data = await serverFetch<PlaytomicApiTenant[]>(url, revalidateSeconds)
    if (!data) return []
    const result = data.map((tenant: PlaytomicApiTenant) => ({
      id: tenant.tenant_id || tenant.id || "",
      name: tenant.name || tenant.tenant_name || "",
      slug: tenant.slug || "",
      address: tenant.address,
      coordinate: tenant.address?.coordinate || tenant.coordinate,
    }))
    serverCache.set(cacheKey, result, TENANT_CACHE_TTL)
    return result
  })()

  inFlightTenants.set(cacheKey, promise)
  promise.finally(() => inFlightTenants.delete(cacheKey))
  return promise
}

const fetchAvailabilityServer = async (
  tenantId: string,
  date: string,
): Promise<PlaytomicAvailability[]> => {
  const cacheKey = `avail-${tenantId}-${date}`
  const cached = serverCache.get<PlaytomicAvailability[]>(cacheKey)
  if (cached) return cached

  const url = `${playtomicBase}/availability?sport_id=PADEL&tenant_id=${tenantId}&start_min=${date}T00:00:00&start_max=${date}T23:59:59`
  const data = await serverFetch<PlaytomicApiAvailabilityItem[]>(url, 5 * 60)
  if (!data || !Array.isArray(data)) return []

  const result = data.map((item: PlaytomicApiAvailabilityItem) => ({
    resource_id: item.resource_id,
    start_date: item.start_date,
    slots: (item.slots || []).map((slot: PlaytomicApiSlot) => ({
      start_time: convertToBaliTime(slot.start_time),
      duration: slot.duration,
      price:
        typeof slot.price === "string"
          ? Number.parseInt(slot.price.replaceAll(/[^\d]/g, ""), 10) || 0
          : slot.price || 0,
    })),
  }))
  serverCache.set(cacheKey, result, 5 * 60 * 1000)
  return result
}

async function fetchSlotsForDateInternal(date: string): Promise<TimeSlot[]> {
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
            tenantSlug: tenant.slug,
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
    a.date === b.date
      ? a.time.localeCompare(b.time)
      : a.date.localeCompare(b.date),
  )
}

export function fetchSlotsForDate(date: string): Promise<TimeSlot[]> {
  const inflight = inFlightSlots.get(date)
  if (inflight) return inflight

  const promise = fetchSlotsForDateInternal(date).finally(() => {
    inFlightSlots.delete(date)
  })
  inFlightSlots.set(date, promise)
  return promise
}

/** Club list for preferences; cached 1hr. Call from server component only. */
export type ClubInfo = {
  id: string
  name: string
  location: "Ubud" | "Sanur"
}

const ONE_HOUR = 60 * 60

export async function fetchAllClubs(): Promise<ClubInfo[]> {
  const [ubudTenants, sanurTenants] = await Promise.all([
    fetchTenantsServer("ubud", ONE_HOUR),
    fetchTenantsServer("sanur", ONE_HOUR),
  ])
  const all = [
    ...ubudTenants.map((t) => ({ ...t, location: "Ubud" as const })),
    ...sanurTenants.map((t) => ({ ...t, location: "Sanur" as const })),
  ]
  const seen = new Set<string>()
  return all.filter((t) => {
    if (seen.has(t.id)) return false
    seen.add(t.id)
    return true
  })
}

export type PlaytomicTenant = {
  id: string
  name: string
  slug: string
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
  tenantSlug: string
  club: string
  location: "Ubud" | "Sanur"
  date: string
  time: string
  court: string
  price: number
  available: boolean
  duration: number
}
