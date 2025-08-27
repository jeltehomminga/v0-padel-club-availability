import { type NextRequest, NextResponse } from "next/server"
import { serverCache } from "@/lib/cache"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tenantId = searchParams.get("tenant_id")
  const date = searchParams.get("date")

  if (!tenantId || !date) {
    return NextResponse.json({ error: "tenant_id and date are required" }, { status: 400 })
  }

  const cacheKey = `availability-${tenantId}-${date}`
  const cachedData = serverCache.get(cacheKey)
  if (cachedData) {
    return NextResponse.json(cachedData)
  }

  const startMin = `${date}T00:00:00`
  const startMax = `${date}T23:59:59`
  const baseUrl = "https://api.playtomic.io/v1"
  const fallbackUrl = "https://playtomic.io/api/v1"

  const headers = {
    Accept: "application/json",
    "X-Requested-With": "com.playtomic.app",
  }

  const urls = [
    `${baseUrl}/availability?sport_id=PADEL&tenant_id=${tenantId}&start_min=${startMin}&start_max=${startMax}`,
    `${fallbackUrl}/availability?sport_id=PADEL&tenant_id=${tenantId}&start_min=${startMin}&start_max=${startMax}`,
  ]

  for (const url of urls) {
    try {
      console.log(`[v0] Cache miss for ${cacheKey}, trying availability URL: ${url}`)
      const response = await fetch(url, { headers })

      console.log(`[v0] Availability response status: ${response.status} for ${url}`)

      if (response.ok) {
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.log(`[v0] Non-JSON response from ${url}, content-type: ${contentType}`)
          const text = await response.text()
          console.log(`[v0] Response text: ${text.substring(0, 200)}`)
          continue
        }

        const data = await response.json()
        console.log(`[v0] Raw availability data:`, JSON.stringify(data).substring(0, 200))

        const availability = Array.isArray(data)
          ? data.map((item: any) => ({
              ...item,
              slots:
                item.slots?.map((slot: any) => ({
                  ...slot,
                  start_time: (() => {
                    const originalTime = slot.start_time
                    const baliTime = convertToBaliTime(originalTime)
                    console.log(`[v0] Time conversion: ${originalTime} UTC -> ${baliTime} Bali`)
                    return baliTime
                  })(),
                  price:
                    typeof slot.price === "string"
                      ? Number.parseInt(slot.price.replace(/[^\d]/g, "")) || 0
                      : slot.price || 0,
                })) || [],
            }))
          : []

        console.log(`[v0] Found ${availability.length} availability slots for tenant ${tenantId}`)

        serverCache.set(cacheKey, availability)

        return NextResponse.json(availability)
      }
    } catch (error) {
      console.error(`[v0] Error with availability URL ${url}:`, error)
      if (error instanceof SyntaxError && error.message.includes("JSON")) {
        console.log(`[v0] JSON parsing error for ${url}, likely rate limited`)
      }
      continue
    }
  }

  console.error(`[v0] All availability URLs failed for tenant ${tenantId}`)
  return NextResponse.json({ error: "Failed to fetch availability from all endpoints" }, { status: 500 })
}

function convertToBaliTime(utcTime: string): string {
  // Parse the time string (format: "HH:MM:SS")
  const [hours, minutes, seconds] = utcTime.split(":").map(Number)

  // Create a date object for today with the UTC time
  const utcDate = new Date()
  utcDate.setUTCHours(hours, minutes, seconds || 0, 0)

  // Convert to Bali time (UTC+8)
  const baliDate = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000)

  // Format back to HH:MM:SS
  const baliHours = baliDate.getUTCHours().toString().padStart(2, "0")
  const baliMinutes = baliDate.getUTCMinutes().toString().padStart(2, "0")
  const baliSeconds = baliDate.getUTCSeconds().toString().padStart(2, "0")

  return `${baliHours}:${baliMinutes}:${baliSeconds}`
}
