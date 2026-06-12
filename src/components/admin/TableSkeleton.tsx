export function AdminTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 border-b border-zinc-800 bg-zinc-900/60 p-4 last:border-b-0"
        >
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-zinc-800" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 animate-pulse rounded bg-zinc-800" />
            <div className="h-3 w-1/5 animate-pulse rounded bg-zinc-800/70" />
          </div>
          <div className="h-6 w-16 animate-pulse rounded-full bg-zinc-800" />
        </div>
      ))}
    </div>
  )
}
