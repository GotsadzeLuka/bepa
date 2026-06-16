'use client'

import { useTranslations } from 'next-intl'
import { Skeleton } from '@/components/ui/skeleton'

interface RouteLoadingStateProps {
  compact?: boolean
}

export function RouteLoadingState({ compact = false }: RouteLoadingStateProps) {
  const t = useTranslations('common')

  return (
    <div className="container py-6 sm:py-8 lg:py-10" aria-busy="true" aria-live="polite">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-950">{t('loading')}</p>
          <p className="mt-1 text-sm text-slate-500">{t('loadingResultsCopy')}</p>
        </div>
        <div className="h-2 w-28 overflow-hidden rounded-full bg-white/80">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
        </div>
      </div>

      <Skeleton className="h-32 rounded-[1.75rem] bg-white/70 sm:h-40" />

      {!compact && (
        <div className="mt-7 flex flex-col gap-8 lg:flex-row">
          <aside className="w-full lg:w-72 lg:shrink-0">
            <div className="space-y-4">
              <Skeleton className="h-56 rounded-[1.5rem] bg-white/70" />
              <Skeleton className="h-28 rounded-[1.5rem] bg-white/70" />
            </div>
          </aside>

          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/70 p-3">
                <Skeleton className="aspect-[4/3] rounded-[1.25rem] bg-slate-100/90" />
                <div className="space-y-3 p-2 pt-4">
                  <Skeleton className="h-3 w-24 rounded-full bg-slate-100" />
                  <Skeleton className="h-5 w-4/5 rounded-full bg-slate-100" />
                  <Skeleton className="h-4 w-full rounded-full bg-slate-100" />
                  <Skeleton className="h-10 rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
