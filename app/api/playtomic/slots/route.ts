import { type NextRequest, NextResponse } from "next/server"
import { fetchSlotsForDate } from "@/lib/playtomic-api"

export const runtime = "nodejs"

// This route is the single cached entry point for slot data for any date.
// next: { revalidate } on the underlying fetches inside fetchSlotsForDate
// caches at the infra level — all serverless instances share the same cache.
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date")

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date is required (YYYY-MM-DD)" }, { status: 400 })
  }

  const slots = await fetchSlotsForDate(date)

  return NextResponse.json(slots, {
    headers: {
      // Tell the browser to cache this response for 5 minutes
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  })
}
