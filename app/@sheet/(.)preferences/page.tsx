"use client"

import { useRouter } from "next/navigation"
import useSWR from "swr"
import { PreferencesSheet } from "@/components/padel/preferences-sheet"
import { usePreferences } from "@/hooks/use-preferences"
import type { ClubInfo } from "@/lib/playtomic-api"

const clubsFetcher = (url: string) =>
  fetch(url).then((res) => res.json() as Promise<ClubInfo[]>)

export default function PreferencesInterceptedPage() {
  const router = useRouter()
  const { prefs, setPreferences } = usePreferences()
  const { data: allClubs = [] } = useSWR<ClubInfo[]>(
    "/api/playtomic/clubs",
    clubsFetcher,
    { revalidateOnFocus: false },
  )

  return (
    <PreferencesSheet
      open
      onOpenChange={(open) => {
        if (!open) router.back()
      }}
      prefs={prefs}
      setPreferences={setPreferences}
      allClubs={allClubs}
    />
  )
}
