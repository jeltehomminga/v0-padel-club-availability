import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
// Allow Next.js fetch cache to work — do not force-dynamic globally
export const dynamic = "force-static"

const AVAILABILITY_TTL = 5 * 60 // 5 minutes in seconds

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tenantId = searchParams.get("tenant_id")
  const date = searchParams.get("date")

  if (!tenantId || !date) {
    return NextResponse.json({ error: "tenant_id and date are required" }, { status: 400 })
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
      // next.revalidate caches at the CDN/infra level — survives serverless cold starts
      const response = await fetch(url, {
        headers,
        next: { revalidate: AVAILABILITY_TTL },
      })

      if (response.ok) {
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          continue
        }

        const data = await response.json()

        const availability = Array.isArray(data)
          ? data.map((item: any) => ({
              ...item,
              slots:
                item.slots?.map((slot: any) => ({
                  ...slot,
                  start_time: convertToBaliTime(slot.start_time),
                  price: typeof slot.price === "string" ? Number.parseInt(slot.price.replace(/[^\d]/g, "")) || 0 : slot.price || 0,
                })) || [],
            }))
          : []

        return NextResponse.json(availability)
      }
    } catch {
      continue
    }
  }

  return NextResponse.json([])
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
