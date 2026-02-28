/**
 * Court Discovery Endpoint
 * ========================
 * Visit /api/playtomic/discover-courts to get a full report of:
 *   - Every tenant currently returned by the Playtomic API
 *   - Every resource UUID seen in today's availability responses
 *   - Which ones are NOT yet mapped in lib/court-names.ts
 *   - Ready-to-paste code snippets for court-names.ts
 *
 * Use this whenever a new club appears in the app showing "Court xxxxxxxx"
 * instead of a real name. Then:
 *   1. Visit https://playtomic.io/tenant/{full-tenant-uuid} to find the real court names
 *   2. Paste the generated snippet into lib/court-names.ts
 *   3. Done — no app restart needed, cache will refresh within 5 minutes
 */

import { NextResponse } from "next/server"
import { serverCache } from "@/lib/cache"
import { getCourtName } from "@/lib/court-names"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PLAYTOMIC_API = "https://api.playtomic.io/v1"
const HEADERS = {
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
  "X-Requested-With": "com.playtomic.app",
}

const LOCATIONS = {
  ubud: { coord: "-8.506,115.262", radius: 10 },
  sanur: { coord: "-8.700,115.263", radius: 10 },
}

async function fetchTenants(coord: string, radius: number) {
  const url = `${PLAYTOMIC_API}/tenants?size=100&status=ACTIVE&sport_id=PADEL&coordinate=${coord}&radius=${radius}km`
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) return []
  const data = await res.json()
  const tenants = Array.isArray(data) ? data : data.items ?? []
  return tenants.map((t: any) => ({
    id: t.tenant_id || t.id,
    name: t.name,
  }))
}

async function fetchResourceIds(tenantId: string, date: string): Promise<string[]> {
  const cacheKey = `availability-${tenantId}-${date}`
  const cached = serverCache.get<any[]>(cacheKey)
  const data = cached ?? await (async () => {
    const url = `${PLAYTOMIC_API}/availability?tenant_id=${tenantId}&sport_id=PADEL&date=${date}`
    const res = await fetch(url, { headers: HEADERS })
    if (!res.ok) return []
    return res.json()
  })()
  if (!Array.isArray(data)) return []
  return [...new Set(data.map((item: any) => item.resource_id).filter(Boolean))]
}

export async function GET() {
  const today = new Date().toISOString().split("T")[0]

  // Fetch all tenants from both locations in parallel
  const [ubudTenants, sanurTenants] = await Promise.all([
    fetchTenants(LOCATIONS.ubud.coord, LOCATIONS.ubud.radius),
    fetchTenants(LOCATIONS.sanur.coord, LOCATIONS.sanur.radius),
  ])

  // Deduplicate tenants by ID
  const tenantMap = new Map<string, { id: string; name: string; location: string }>()
  for (const t of ubudTenants) tenantMap.set(t.id, { ...t, location: "Ubud" })
  for (const t of sanurTenants) tenantMap.set(t.id, { ...t, location: "Sanur" })
  const allTenants = [...tenantMap.values()]

  // For each tenant, fetch their resource IDs from today's availability
  const tenantReports = await Promise.all(
    allTenants.map(async (tenant) => {
      const resourceIds = await fetchResourceIds(tenant.id, today)
      const mapped: string[] = []
      const unmapped: string[] = []

      for (const resourceId of resourceIds) {
        const name = getCourtName(tenant.id, resourceId)
        if (name.startsWith("Court ") && name.length === 14) {
          // Still a fallback — 8 char hex fragment
          unmapped.push(resourceId)
        } else {
          mapped.push(`${resourceId.substring(0, 8)} → "${name}"`)
        }
      }

      return { tenant, resourceIds, mapped, unmapped }
    })
  )

  // Build the ready-to-paste snippet for all unmapped courts
  const snippets: string[] = []
  const unmappedSummary: any[] = []

  for (const { tenant, unmapped } of tenantReports) {
    if (unmapped.length === 0) continue

    const tenantShort = tenant.id.substring(0, 8)
    snippets.push(`  // ── ${tenant.name} (${tenantShort}) — visit playtomic.io/tenant/${tenant.id}`)
    for (const resourceId of unmapped) {
      snippets.push(`  "${tenantShort}::${resourceId.substring(0, 8)}": "??? Court Name ???",`)
    }
    snippets.push("")

    unmappedSummary.push({
      club: tenant.name,
      location: tenant.location,
      tenantId: tenant.id,
      playtomicPage: `https://playtomic.io/tenant/${tenant.id}`,
      unmappedResourceIds: unmapped,
    })
  }

  const allMapped = unmappedSummary.length === 0

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    date: today,
    summary: {
      totalTenants: allTenants.length,
      fullyMapped: tenantReports.filter(r => r.unmapped.length === 0 && r.resourceIds.length > 0).length,
      unmappedTenants: unmappedSummary.length,
      status: allMapped ? "ALL_COURTS_MAPPED" : "ACTION_REQUIRED",
    },
    unmappedCourts: unmappedSummary,
    mappedCourts: tenantReports
      .filter(r => r.mapped.length > 0)
      .map(r => ({ club: r.tenant.name, courts: r.mapped })),
    // Paste this directly into lib/court-names.ts TENANT_COURT_NAMES object
    snippetForCourtNamesTs: allMapped
      ? "// Nothing to add — all courts are mapped!"
      : snippets.join("\n"),
    instructions: [
      "1. Find any unmapped courts above in the 'unmappedCourts' array",
      "2. Visit the 'playtomicPage' URL for each unmapped club to find real court names",
      "3. Replace '??? Court Name ???' in the snippet with the real names",
      "4. Paste the snippet into lib/court-names.ts inside TENANT_COURT_NAMES",
    ],
  })
}
