import { type NextRequest, NextResponse } from "next/server"
import { serverCache } from "@/lib/cache"

const LOCATIONS = {
  ubud: { coord: "-8.506,115.262", name: "Ubud" },
  sanur: { coord: "-8.6725,115.2625", name: "Sanur" },
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const location = searchParams.get("location") as "ubud" | "sanur"

  if (!location || !LOCATIONS[location]) {
    return NextResponse.json({ error: "Invalid location" }, { status: 400 })
  }

  const cacheKey = `tenants-${location}`
  const cachedData = serverCache.get(cacheKey)
  if (cachedData) {
    return NextResponse.json(cachedData)
  }

  const { coord } = LOCATIONS[location]
  const radius = 8000 // Reduced search radius from 20km to 8km to exclude distant clubs like Jimbaran and Canggu
  const baseUrl = "https://api.playtomic.io/v1"
  const fallbackUrl = "https://playtomic.io/api/v1"

  const url = `${baseUrl}/tenants?coordinate=${coord}&radius=${radius}&sport_id=PADEL&playtomic_status=ACTIVE&size=500`

  const headers = {
    Accept: "application/json",
    "X-Requested-With": "com.playtomic.app",
  }

  try {
    console.log(`[v0] Cache miss for ${cacheKey}, fetching from API`)
    let response = await fetch(url, { headers })

    if (!response.ok) {
      // Try fallback URL
      const fallbackUrlFull = url.replace(baseUrl, fallbackUrl)
      response = await fetch(fallbackUrlFull, { headers })
    }

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`)
    }

    const data = await response.json()
    const tenants = Array.isArray(data) ? data : data.items || []

    console.log("[v0] Raw tenants data:", JSON.stringify(tenants.slice(0, 2), null, 2))

    const mappedTenants = tenants.map((tenant: any) => ({
      id: tenant.tenant_id || tenant.id || tenant._id,
      name: tenant.name || tenant.tenant_name,
      address: tenant.address,
      coordinate: tenant.address?.coordinate || tenant.coordinate || tenant.coordinates || tenant.location || tenant.coord,
    }))

    console.log("[v0] Mapped tenants:", JSON.stringify(mappedTenants.slice(0, 2), null, 2))
    console.log(
      "[v0] Tenant coordinates:",
      mappedTenants.map((t) => ({ name: t.name, coordinate: t.coordinate })),
    )

    serverCache.set(cacheKey, mappedTenants)

    return NextResponse.json(mappedTenants)
  } catch (error) {
    console.error("Error fetching tenants:", error)
    return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 })
  }
}
