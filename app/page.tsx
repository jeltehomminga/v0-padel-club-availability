import { redirect } from "next/navigation"
import {
  fetchSlotsForDate,
  fetchAllClubs,
  type TimeSlot,
} from "@/lib/playtomic-api"
import PadelClient from "@/components/padel-client"
import { getDateString } from "@/lib/time"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// Server Component — fetches initial slots and club list for fast first paint.
// Both use Next.js server-side cache (slots 5min, clubs 1hr).
export default async function Page({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ date?: string }>
}>) {
  const today = getDateString(0)
  const { date: rawDate } = await searchParams

  if (!rawDate || !DATE_RE.test(rawDate)) {
    redirect(`/?date=${today}`)
  }

  const [initialSlots, allClubs] = await Promise.all([
    fetchSlotsForDate(rawDate),
    fetchAllClubs(),
  ])

  const initialSlotCache: Record<string, TimeSlot[]> = {
    [rawDate]: initialSlots,
  }

  return (
    <PadelClient
      initialSlotCache={initialSlotCache}
      initialDate={rawDate}
      allClubs={allClubs}
    />
  )
}
