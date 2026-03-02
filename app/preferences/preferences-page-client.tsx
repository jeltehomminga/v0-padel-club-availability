"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PreferencesContent } from "@/components/padel/preferences-sheet"
import { usePreferences } from "@/hooks/use-preferences"
import type { ClubInfo } from "@/lib/playtomic-api"

type PreferencesPageClientProps = Readonly<{
  allClubs: ClubInfo[]
}>

export function PreferencesPageClient({
  allClubs,
}: PreferencesPageClientProps) {
  const { prefs, setPreferences } = usePreferences()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Back to availability"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-brand text-xl text-foreground">
            My availability
          </h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <PreferencesContent
          prefs={prefs}
          setPreferences={setPreferences}
          allClubs={allClubs}
        />
      </main>
    </div>
  )
}
