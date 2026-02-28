import { fetchSlotsForDate, type TimeSlot } from "@/lib/playtomic-api"
import PadelClient from "@/components/padel-client"

const getTodayString = () => new Date().toISOString().split("T")[0]

// Server Component — only fetches today eagerly for fast first paint.
// Today's data is cached by Next.js (next: { revalidate: 300 }) at the infra level.
// Other dates are fetched on demand by the client via /api/playtomic/slots,
// which uses the same server-side cache.
export default async function Page() {
  const today = getTodayString()
  const todaySlots = await fetchSlotsForDate(today)

  const initialSlotCache: Record<string, TimeSlot[]> = {
    [today]: todaySlots,
  }

  return <PadelClient initialSlotCache={initialSlotCache} initialDate={today} />
}
