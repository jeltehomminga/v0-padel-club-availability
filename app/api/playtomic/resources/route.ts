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

    // Match the exact headers the original curl script uses — minimal, no custom user-agent
    const headers = {
      Accept: "application/json",
      "Accept-Language": "en-US,en;q=0.9",
    }

    const urls = [
      `https://api.playtomic.io/v1/resources?tenant_id=${tenantId}&sport_id=PADEL`,
      `https://playtomic.io/api/v1/resources?tenant_id=${tenantId}&sport_id=PADEL`,
    ]

    for (const url of urls) {
      try {
        const response = await fetch(url, { headers, redirect: "follow" })

        if (!response.ok) continue

        const contentType = response.headers.get("content-type")
        if (!contentType?.includes("application/json")) continue

        const data = await response.json()
        const resources: { id: string; name: string }[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : []

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
