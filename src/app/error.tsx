'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { RefreshCcw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('common')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container py-16 sm:py-24">
      <section className="mx-auto max-w-2xl rounded-[2rem] border border-white/70 bg-white/86 p-8 text-center shadow-[0_24px_72px_-46px_rgba(15,23,42,0.5)] backdrop-blur-xl sm:p-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500 text-white">
          <TriangleAlert className="h-8 w-8" />
        </div>
        <h1 className="font-display text-3xl font-black tracking-tight text-slate-950">
          {t('errorTitle')}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500 sm:text-base">
          {t('errorCopy')}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" className="rounded-full" onClick={reset}>
            <RefreshCcw className="h-4 w-4" />
            {t('tryAgain')}
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full border-white/80 bg-white/76">
            <Link href="/">{t('backToHome')}</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
