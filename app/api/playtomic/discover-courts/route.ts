/**
 * Court Discovery & Verification Endpoint
 * ========================================
 * Visit /api/playtomic/discover-courts for a live report showing:
 *   - Every tenant returned by the Playtomic API
 *   - Court names fetched from /v1/tenants/{id}/resources (the source of truth)
 *   - Comparison against the static fallback map in lib/court-names.ts
 *   - Any mismatches or missing entries
 */

import { NextResponse } from "next/server"
import {
  getCourtName,
  FALLBACK_COURT_NAMES,
} from "@/lib/court-names"
import { fetchResourceNames } from "@/lib/playtomic-api"
import type { PlaytomicApiTenant } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const playtomicApi = "https://api.playtomic.io/v1"
const headers = {
  Accept: "application/json",
  "X-Requested-With": "com.playtomic.app",
}

const locations = {
  ubud: { coord: "-8.506,115.262", radius: 10 },
  sanur: { coord: "-8.700,115.263", radius: 10 },
}

const fetchTenants = async (coord: string, radius: number) => {
  const url = `${playtomicApi}/tenants?size=100&status=ACTIVE&sport_id=PADEL&coordinate=${coord}&radius=${radius}km`
  const res = await fetch(url, { headers })
  if (!res.ok) return []
  const raw = (await res.json()) as
    | PlaytomicApiTenant[]
    | { items?: PlaytomicApiTenant[] }
  const tenants: PlaytomicApiTenant[] = Array.isArray(raw)
    ? raw
    : (raw.items ?? [])
  return tenants.map((tenant: PlaytomicApiTenant) => ({
    id: tenant.tenant_id || tenant.id || "",
    name: tenant.name || tenant.tenant_name || "",
  }))
}

export async function GET() {
  const [ubudTenants, sanurTenants] = await Promise.all([
    fetchTenants(locations.ubud.coord, locations.ubud.radius),
    fetchTenants(locations.sanur.coord, locations.sanur.radius),
  ])

  const tenantMap = new Map<
    string,
    { id: string; name: string; location: string }
  >()
  for (const t of ubudTenants)
    tenantMap.set(t.id, { ...t, location: "Ubud" })
  for (const t of sanurTenants)
    tenantMap.set(t.id, { ...t, location: "Sanur" })
  const allTenants = [...tenantMap.values()]

  const reports = await Promise.all(
    allTenants.map(async (tenant) => {
      const resources = await fetchResourceNames(tenant.id)
      const tenantShort = tenant.id.substring(0, 8)

      const courts = resources.map((r) => {
        const resourceShort = r.resource_id.substring(0, 8)
        const apiName = r.name.trim()
        const fallbackKey = `${tenantShort}::${resourceShort}`
        const fallbackName = FALLBACK_COURT_NAMES[fallbackKey]
        const resolvedName = getCourtName(tenant.id, r.resource_id)

        return {
          resourceId: r.resource_id,
          apiName,
          fallbackName: fallbackName ?? null,
          resolvedName,
          status:
            fallbackName === undefined
              ? "MISSING_FROM_FALLBACK"
              : fallbackName === apiName
                ? "OK"
                : "MISMATCH",
        }
      })

      const allOk = courts.every((c) => c.status === "OK")
      const hasMismatch = courts.some((c) => c.status === "MISMATCH")

      return {
        club: tenant.name,
        location: tenant.location,
        tenantId: tenant.id,
        courtCount: resources.length,
        courts,
        status: allOk
          ? "OK"
          : hasMismatch
            ? "MISMATCH"
            : "MISSING_FROM_FALLBACK",
      }
    }),
  )

  const issues = reports.filter((r) => r.status !== "OK")

  // Generate a corrected fallback map snippet for any mismatches
  const snippet = issues.length === 0
    ? "// All fallback entries match the API — nothing to update!"
    : issues.flatMap((report) => {
        const tenantShort = report.tenantId.substring(0, 8)
        const lines = [
          `  // ── ${report.club} (${tenantShort})`,
          ...report.courts.map(
            (c) =>
              `  "${tenantShort}::${c.resourceId.substring(0, 8)}": "${c.apiName}",`,
          ),
          "",
        ]
        return lines
      }).join("\n")

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    summary: {
      totalTenants: allTenants.length,
      tenantsWithIssues: issues.length,
      status: issues.length === 0 ? "ALL_OK" : "ACTION_REQUIRED",
    },
    reports,
    correctedSnippet: snippet,
  })
}
