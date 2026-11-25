"use client"

import { MapPin, ExternalLink } from "lucide-react"
import { playtomicTenantUrl } from "@/lib/constants"
import type { ClubInfo } from "@/lib/playtomic-api"

type BookDirectProps = Readonly<{
  clubs: ClubInfo[]
  date: string
}>

export function BookDirect({ clubs, date }: BookDirectProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground py-2">
        Playtomic closed its public API in November 2026, so CourtScout
        can&apos;t show live times. Check each club on Playtomic:
      </p>
      {clubs.map((club) => (
        <a
          key={club.id}
          href={playtomicTenantUrl("", club.id, date)}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 hover:border-primary/30 hover:shadow-md transition-all duration-200"
        >
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm leading-tight truncate">
              {club.name}
            </p>
            <span className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {club.location}
            </span>
          </div>
          <ExternalLink className="w-4 h-4 text-primary shrink-0" />
        </a>
      ))}
    </div>
  )
}
