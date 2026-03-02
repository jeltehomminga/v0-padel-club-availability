"use client"

import { Clock } from "lucide-react"

type EmptyStateProps = Readonly<{
  message?: string
  subtitle?: string
}>

export function EmptyState({
  message = "No slots available",
  subtitle = "Try a different date, time, location, or duration.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Clock className="w-10 h-10 text-muted-foreground/40 mb-3" />
      <p className="text-sm font-medium text-foreground mb-1">{message}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  )
}
