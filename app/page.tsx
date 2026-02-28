import { fetchSlotsForDate, type TimeSlot } from "@/lib/playtomic-api"
import PadelClient from "@/components/padel-client"

const getDateString = (offset = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split("T")[0]
}

// Server Component — pre-fetches ALL 14 days in parallel at render time.
// Each underlying fetch() call is cached by Next.js (next: { revalidate: 300 }),
// so on subsequent page loads all 14 days are served from infra-level cache instantly —
// no client-side fetching needed at all.
export default async function Page() {
  const dates = Array.from({ length: 14 }, (_, i) => getDateString(i))
  const today = dates[0]

  // Fetch all 14 days in parallel — cached individually per date key
  const slotsByDate = await Promise.all(dates.map((date) => fetchSlotsForDate(date)))

  const initialSlotCache: Record<string, TimeSlot[]> = {}
  dates.forEach((date, i) => {
    initialSlotCache[date] = slotsByDate[i]
  })

  return <PadelClient initialSlotCache={initialSlotCache} initialDate={today} />
}
