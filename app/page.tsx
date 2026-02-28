import { fetchSlotsForDate } from "@/lib/playtomic-api"
import PadelClient from "@/components/padel-client"

const getTodayString = () => new Date().toISOString().split("T")[0]

// Server Component — fetches data on the server before sending HTML to the browser.
// Next.js caches the underlying fetch() calls so subsequent loads are served from cache.
export default async function Page() {
  const today = getTodayString()
  const initialSlots = await fetchSlotsForDate(today)

  return <PadelClient initialSlots={initialSlots} initialDate={today} />
}
