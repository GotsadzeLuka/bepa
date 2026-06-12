import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ArrowRight, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function NotFound() {
  const t = await getTranslations('common')

  return (
    <div className="container py-16 sm:py-24">
      <section className="mx-auto max-w-2xl rounded-[2rem] border border-white/70 bg-white/86 p-8 text-center shadow-[0_24px_72px_-46px_rgba(15,23,42,0.5)] backdrop-blur-xl sm:p-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <Compass className="h-8 w-8" />
        </div>
        <p className="font-display text-6xl font-black tracking-tight text-slate-950">404</p>
        <h1 className="mt-3 font-display text-3xl font-black tracking-tight text-slate-950">
          {t('notFoundTitle')}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500 sm:text-base">
          {t('notFoundCopy')}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/">
              {t('backToHome')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full border-white/80 bg-white/76">
            <Link href="/products">{t('products')}</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
