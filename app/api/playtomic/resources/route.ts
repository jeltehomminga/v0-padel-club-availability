import { type NextRequest, NextResponse } from "next/server"
import { serverCache } from "@/lib/cache"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get("tenant_id")

    if (!tenantId) {
      return NextResponse.json({ error: "tenant_id is required" }, { status: 400 })
    }

    const cacheKey = `resources-${tenantId}`
    const cachedData = serverCache.get(cacheKey)
    if (cachedData) {
      return NextResponse.json(cachedData)
    }

    const headers = {
      Accept: "application/json",
    }

    const urls = [
      `https://api.playtomic.io/v1/resources?tenant_id=${tenantId}&sport_id=PADEL`,
      `https://playtomic.io/api/v1/resources?tenant_id=${tenantId}&sport_id=PADEL`,
    ]

    for (const url of urls) {
      try {
        console.log(`[v0] Cache miss for ${cacheKey}, trying URL: ${url}`)
        const response = await fetch(url, {
          headers,
          redirect: "follow",
        })

        console.log(`[v0] Response status: ${response.status} for ${url}`)

        if (response.ok) {
          const contentType = response.headers.get("content-type")
          if (!contentType || !contentType.includes("application/json")) {
            console.log(`[v0] Non-JSON response from ${url}, content-type: ${contentType}`)
            const text = await response.text()
            console.log(`[v0] Response text: ${text.substring(0, 200)}`)
            continue
          }

          const data = await response.json()
          console.log(`[v0] Raw response data:`, JSON.stringify(data).substring(0, 200))

          let resources = []
          if (Array.isArray(data)) {
            resources = data
          } else if (data && data.items && Array.isArray(data.items)) {
            resources = data.items
          } else if (data && typeof data === "object") {
            // Sometimes the response might be a single resource object
            resources = [data]
          }

          console.log(`[v0] Found ${resources.length} total resources for tenant ${tenantId}`)

          serverCache.set(cacheKey, resources)

          return NextResponse.json(resources)
        }
      } catch (error) {
        console.log(`[v0] Error fetching from ${url}:`, error instanceof Error ? error.message : String(error))
        continue
      }
    }

    console.log(`[v0] Resources API unavailable for tenant ${tenantId}, returning empty array`)
    return NextResponse.json([])
  } catch (error) {
    console.error(`[v0] Unexpected error in resources route:`, error instanceof Error ? error.message : String(error))
    return NextResponse.json([])
  }
}
