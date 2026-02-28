import { fetchAllClubs } from "@/lib/playtomic-api"
import { PreferencesPageClient } from "./preferences-page-client"

export default async function PreferencesPage() {
  const allClubs = await fetchAllClubs()
  return <PreferencesPageClient allClubs={allClubs} />
}
