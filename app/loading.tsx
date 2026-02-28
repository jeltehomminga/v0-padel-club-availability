export default function Loading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <header className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-4 pt-4 pb-3 space-y-3">
          <div className="flex items-baseline justify-between">
            <div className="space-y-1">
              <div className="h-7 w-48 rounded bg-muted" />
              <div className="h-3 w-36 rounded bg-muted" />
            </div>
            <div className="h-5 w-16 rounded-full bg-muted" />
          </div>
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-[60px] min-w-[52px] rounded-xl bg-muted shrink-0"
              />
            ))}
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="h-6 w-24 rounded-full bg-muted" />
            <div className="h-6 w-20 rounded-full bg-muted" />
            <div className="h-6 w-20 rounded-full bg-muted" />
          </div>
          <div className="h-8 w-full rounded-md bg-muted" />
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-4 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl border border-border bg-card flex items-center gap-4 px-4"
          >
            <div className="h-14 w-16 rounded-lg bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-3 w-48 rounded bg-muted" />
            </div>
            <div className="h-8 w-20 rounded-full bg-muted shrink-0" />
          </div>
        ))}
      </main>
    </div>
  )
}
