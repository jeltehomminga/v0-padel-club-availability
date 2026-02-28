"use client"

import { Clock } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Clock className="w-10 h-10 text-muted-foreground/40 mb-3" />
      <p className="text-sm font-medium text-foreground mb-1">
        No slots available
      </p>
      <p className="text-xs text-muted-foreground">
        Try a different date, location, or duration.
      </p>
    </div>
  )
}
