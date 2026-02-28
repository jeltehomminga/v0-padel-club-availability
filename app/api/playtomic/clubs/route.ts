import { NextResponse } from "next/server"
import { fetchAllClubs } from "@/lib/playtomic-api"

export const runtime = "nodejs"

export async function GET() {
  const clubs = await fetchAllClubs()
  return NextResponse.json(clubs, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=60",
    },
  })
}
