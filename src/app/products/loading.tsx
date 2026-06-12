import { Skeleton } from '@/components/ui/skeleton'

export default function ProductsLoading() {
  return (
    <div className="container py-8 sm:py-10 lg:py-12">
      <Skeleton className="h-44 rounded-[2.25rem] bg-white/60" />

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <aside className="w-full lg:w-80 lg:shrink-0">
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-[1.5rem] bg-white/60" />
            <Skeleton className="h-32 rounded-[1.5rem] bg-white/60" />
          </div>
        </aside>

        <div className="flex-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="aspect-[0.9] rounded-[2rem] bg-white/60" />
                <Skeleton className="h-10 rounded-full bg-white/60" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
