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
        const response = await fetch(url, {
          headers,
          redirect: "follow",
        }).catch(() => null)

        if (!response || !response.ok) {
          continue
        }

        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          continue
        }

        const data = await response.json()

        let resources = []
        if (Array.isArray(data)) {
          resources = data
        } else if (data && data.items && Array.isArray(data.items)) {
          resources = data.items
        } else if (data && typeof data === "object") {
          resources = [data]
        }

        serverCache.set(cacheKey, resources)
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
