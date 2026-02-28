import { type NextRequest, NextResponse } from "next/server"
import { serverCache } from "@/lib/cache"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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

    // Use the same headers that work for the availability endpoint
    const headers = {
      Accept: "application/json",
      "Accept-Language": "en-US,en;q=0.9",
      "X-Requested-With": "com.playtomic.app",
    }

    // Try multiple URL patterns — the correct endpoint path is uncertain
    const urls = [
      `https://api.playtomic.io/v1/resources?tenant_id=${tenantId}&sport_id=PADEL`,
      `https://api.playtomic.io/v1/resources?tenant_id=${tenantId}`,
      `https://playtomic.io/api/v1/resources?tenant_id=${tenantId}&sport_id=PADEL`,
    ]

    for (const url of urls) {
      try {
        const response = await fetch(url, { headers, redirect: "follow" })

        console.log(`[v0] Resources ${url} → status ${response.status}`)
        if (!response.ok) {
          const body = await response.text()
          console.log(`[v0] Resources error body:`, body.substring(0, 200))
          continue
        }

        const contentType = response.headers.get("content-type")
        if (!contentType?.includes("application/json")) continue

        const data = await response.json()
        const resources: { id: string; name: string }[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : []

        console.log(`[v0] Resources success: ${resources.length} courts from ${url}`)
        if (resources.length > 0) console.log(`[v0] First resource:`, JSON.stringify(resources[0]))
        // Court names are static — cache for 24 hours (resources rarely change)
        serverCache.set(cacheKey, resources, 24 * 60 * 60 * 1000)
        return NextResponse.json(resources)
      } catch {
        continue
      }
    }

    return NextResponse.json([])
  } catch {
    return NextResponse.json([])
  }
}
