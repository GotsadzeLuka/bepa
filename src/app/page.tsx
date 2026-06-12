import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import {
  ArrowRight,
  BatteryCharging,
  CreditCard,
  Disc3,
  Droplets,
  Headphones,
  Shield,
  Truck,
  Wind,
  Zap,
} from 'lucide-react'
import { ProductArtwork } from '@/components/product/ProductArtwork'
import { ProductCard } from '@/components/product/ProductCard'
import { Button } from '@/components/ui/button'
import { SafeImage } from '@/components/ui/SafeImage'
import { getCategoryName, getDisplayPrice, getProductDescription, getProductName } from '@/lib/catalog'
import { getCategoryMedia, getProductMedia } from '@/lib/storefront-media'
import { storefrontService } from '@/lib/storefront'

const categoryIcons = {
  lighting: Zap,
  batteries: BatteryCharging,
  brakes: Disc3,
  filters: Wind,
  'oils-fluids': Droplets,
  accessories: Shield,
} as const

export const revalidate = 300

export default async function HomePage() {
  const locale = await getLocale()
  const t = await getTranslations('home')
  const tc = await getTranslations('common')

  const { categories, featuredProducts, saleProducts, latestProducts } = await storefrontService.getHomePageData()

  const showcasePrimary = featuredProducts[0] ?? latestProducts[0]
  const showcaseSecondary = featuredProducts[1] ?? saleProducts[0] ?? latestProducts[1]
  const showcasePrimaryMedia = showcasePrimary ? getProductMedia(showcasePrimary) : null
  const showcaseSecondaryMedia = showcaseSecondary ? getProductMedia(showcaseSecondary) : null
  const catalogPreview = Array.from(
    new Map([...featuredProducts, ...saleProducts, ...latestProducts].map((product) => [product.id, product])).values()
  )

  const categoryCounts = catalogPreview.reduce<Record<string, number>>((counts, product) => {
    if (product.category?.slug) {
      counts[product.category.slug] = (counts[product.category.slug] ?? 0) + 1
    }

    return counts
  }, {})

  const serviceHighlights = [
    { icon: Truck, title: t('heroStatDeliveryTitle'), desc: t('heroStatDeliveryCopy') },
    { icon: Shield, title: t('heroStatSelectionTitle'), desc: t('heroStatSelectionCopy') },
    { icon: Headphones, title: t('heroStatSupportTitle'), desc: t('heroStatSupportCopy') },
    { icon: CreditCard, title: t('secureCheckoutTitle'), desc: t('secureCheckoutCopy') },
  ]

  const featuredGrid = featuredProducts.slice(0, 4)
  const saleGrid = saleProducts.slice(0, 4)
  const latestGrid = latestProducts.slice(0, 4)

  return (
    <div className="pb-16 sm:pb-20">
      <section className="relative overflow-hidden border-b border-white/60 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.2),transparent_24%),linear-gradient(180deg,#fbf7f0_0%,#f5efe6_50%,#f8f5ef_100%)]">
        <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.08),transparent_56%)]" />
        <div className="absolute left-[-12rem] top-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[-10rem] top-40 h-72 w-72 rounded-full bg-slate-900/8 blur-3xl" />

        <div className="container relative py-10 sm:py-14 lg:py-20">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:items-start">
            <div className="space-y-7 animate-fade-up">
              <div className="space-y-5">
                <p className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                  {t('heroKicker')}
                </p>
                <div className="space-y-4">
                  <h1 className="max-w-3xl font-display text-4xl font-black tracking-tight text-slate-950 text-balance sm:text-5xl lg:text-6xl">
                    {t('heroTitle')}
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                    {t('heroSubtitle')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/products">
                  <Button size="lg" className="w-full rounded-full px-7 sm:w-auto">
                    {t('shopNow')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/products?featured=true">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full rounded-full border-white/80 bg-white/82 px-7 sm:w-auto"
                  >
                    {tc('viewAll')}
                  </Button>
                </Link>
              </div>

              {categories.length > 0 && (
                <div className="glass-panel rounded-[2rem] p-4 sm:p-5">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {categories.slice(0, 3).map((category, index) => {
                      const Icon = categoryIcons[category.slug as keyof typeof categoryIcons] ?? Shield

                      return (
                        <Link
                          key={category.id}
                          href={`/products?category=${category.slug}`}
                          className="group rounded-[1.5rem] border border-white/60 bg-white/70 p-4 transition-transform duration-300 hover:-translate-y-1"
                          style={{ animationDelay: `${120 + index * 80}ms` }}
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg">
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                              {categoryCounts[category.slug] ?? 0} {tc('items')}
                            </span>
                          </div>
                          <h2 className="text-base font-semibold text-slate-950">
                            {getCategoryName(category, locale)}
                          </h2>
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            {locale === 'ka' ? category.descriptionKa : category.descriptionEn}
                          </p>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(17rem,0.8fr)]">
              <div className="space-y-4 animate-fade-up" style={{ animationDelay: '120ms' }}>
                {showcasePrimary && showcasePrimaryMedia && (
                  <Link
                    href={`/product/${showcasePrimary.slug}`}
                    className="group block overflow-hidden rounded-[2.35rem] border border-white/65 shadow-[0_34px_110px_-54px_rgba(15,23,42,0.62)] transition-transform duration-500 hover:-translate-y-1"
                  >
                    <div className="relative h-[22rem] sm:h-[28rem]">
                      <ProductArtwork
                        title={getProductName(showcasePrimary, locale)}
                        category={getCategoryName(showcasePrimary.category, locale) || 'BEPA'}
                        subtitle={getProductDescription(showcasePrimary, locale)}
                        tone={showcasePrimary.category?.slug}
                        imageSrc={showcasePrimaryMedia.src}
                        imageAlt={showcasePrimaryMedia.alt}
                        objectPosition={showcasePrimaryMedia.objectPosition}
                      />
                    </div>
                  </Link>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  {categories.slice(3, 5).map((category, index) => {
                    const media = getCategoryMedia(category)

                    return (
                      <Link
                        key={category.id}
                        href={`/products?category=${category.slug}`}
                        className="group relative overflow-hidden rounded-[1.65rem] border border-white/65 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.48)]"
                        style={{ animationDelay: `${220 + index * 80}ms` }}
                      >
                        <div className="relative min-h-[11rem]">
                          {media.src ? (
                            <SafeImage
                              src={media.src}
                              alt={media.alt}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                              style={{ objectPosition: media.objectPosition }}
                              sizes="(max-width: 640px) 100vw, 50vw"
                            />
                          ) : (
                            <div className="flex h-full min-h-[11rem] w-full items-center justify-center bg-slate-900 text-white/30">
                              <Shield className="h-12 w-12" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04),rgba(15,23,42,0.74)_100%)]" />
                          <div className="absolute inset-x-4 bottom-4 rounded-[1.35rem] border border-white/12 bg-black/22 p-4 backdrop-blur-md">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/68">
                              {categoryCounts[category.slug] ?? 0} {tc('items')}
                            </p>
                            <h3 className="mt-2 text-lg font-bold tracking-tight text-white">
                              {getCategoryName(category, locale)}
                            </h3>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-4 animate-fade-up" style={{ animationDelay: '220ms' }}>
                {showcaseSecondary && showcaseSecondaryMedia && (
                  <Link
                    href={`/product/${showcaseSecondary.slug}`}
                    className="group block overflow-hidden rounded-[2rem] border border-white/65 shadow-[0_30px_90px_-54px_rgba(15,23,42,0.52)] transition-transform duration-500 hover:-translate-y-1"
                  >
                    <div className="relative h-[18rem]">
                      <ProductArtwork
                        compact
                        title={getProductName(showcaseSecondary, locale)}
                        category={getCategoryName(showcaseSecondary.category, locale) || 'BEPA'}
                        subtitle={getProductDescription(showcaseSecondary, locale)}
                        tone={showcaseSecondary.category?.slug}
                        imageSrc={showcaseSecondaryMedia.src}
                        imageAlt={showcaseSecondaryMedia.alt}
                        objectPosition={showcaseSecondaryMedia.objectPosition}
                      />
                    </div>
                  </Link>
                )}

                <div className="glass-panel-strong rounded-[2rem] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    {t('heroPanelEyebrow')}
                  </p>
                  <h2 className="mt-3 font-display text-2xl font-black tracking-tight text-slate-950">
                    {t('heroPanelTitle')}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {t('heroPanelCopy')}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {categories.slice(0, 4).map((category) => (
                      <Link
                        key={category.id}
                        href={`/products?category=${category.slug}`}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-primary/30 hover:text-primary"
                      >
                        {getCategoryName(category, locale)}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {serviceHighlights.map(({ icon: Icon, title, desc }, index) => (
              <div
                key={title}
                className="glass-panel rounded-[1.75rem] p-5 animate-fade-up"
                style={{ animationDelay: `${280 + index * 70}ms` }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-950">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-12 sm:py-16">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{tc('categories')}</p>
            <h2 className="font-display text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {t('browseCategories')}
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              {t('browseCategoriesCopy')}
            </p>
          </div>
          <Link href="/products">
            <Button variant="ghost" className="w-full rounded-full sm:w-auto">
              {tc('viewAll')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category, index) => {
            const media = getCategoryMedia(category)

            return (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group glass-panel-strong editorial-noise overflow-hidden rounded-[2rem] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_34px_100px_-52px_rgba(15,23,42,0.56)]"
                style={{ animationDelay: `${120 + index * 80}ms` }}
              >
                <div className="relative aspect-[1.18] overflow-hidden">
                  {media.src ? (
                    <SafeImage
                      src={media.src}
                      alt={media.alt}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                      style={{ objectPosition: media.objectPosition }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white/30">
                      <Shield className="h-14 w-14" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.08)_38%,rgba(15,23,42,0.84)_100%)]" />
                  <div className="absolute left-5 top-5 rounded-full border border-white/18 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/88 backdrop-blur-md">
                    {categoryCounts[category.slug] ?? 0} {tc('items')}
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-2xl font-black tracking-tight text-slate-950">
                      {getCategoryName(category, locale)}
                    </h3>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {locale === 'ka' ? category.descriptionKa : category.descriptionEn}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="container py-12 sm:py-16">
        <div className="glass-panel-strong overflow-hidden rounded-[2.35rem] p-3 sm:p-4">
          {showcasePrimary && showcasePrimaryMedia && (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:items-stretch">
              <div className="rounded-[2rem] bg-white/72 p-5 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {t('featuredProducts')}
                </p>
                <h2 className="mt-3 font-display text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  {getProductName(showcasePrimary, locale)}
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                  {getProductDescription(showcasePrimary, locale)}
                </p>

                <div className="mt-6 flex flex-wrap items-end gap-3">
                  <span className="text-3xl font-black tracking-tight text-slate-950">
                    ₾{getDisplayPrice(showcasePrimary)}
                  </span>
                  {showcasePrimary.salePrice && showcasePrimary.salePrice < showcasePrimary.price ? (
                    <span className="text-base text-slate-400 line-through">₾{showcasePrimary.price}</span>
                  ) : null}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link href={`/product/${showcasePrimary.slug}`}>
                    <Button size="lg" className="w-full rounded-full sm:w-auto">
                      {tc('viewDetails')}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/products?featured=true">
                    <Button size="lg" variant="outline" className="w-full rounded-full border-white/80 bg-white/82 sm:w-auto">
                      {tc('viewAll')}
                    </Button>
                  </Link>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {serviceHighlights.slice(2).map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="rounded-[1.5rem] border border-white/65 bg-white/70 p-4">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative h-[22rem] overflow-hidden rounded-[2rem]">
                <ProductArtwork
                  title={getProductName(showcasePrimary, locale)}
                  category={getCategoryName(showcasePrimary.category, locale) || 'BEPA'}
                  subtitle={getProductDescription(showcasePrimary, locale)}
                  tone={showcasePrimary.category?.slug}
                  imageSrc={showcasePrimaryMedia.src}
                  imageAlt={showcasePrimaryMedia.alt}
                  objectPosition={showcasePrimaryMedia.objectPosition}
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {featuredGrid.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container py-2 sm:py-4">
        <div className="overflow-hidden rounded-[2.35rem] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(248,113,113,0.18),transparent_34%),linear-gradient(135deg,#fff5f5_0%,#fff7f2_42%,#fffdfb_100%)] p-5 shadow-[0_30px_84px_-50px_rgba(239,68,68,0.44)] sm:p-7">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">{t('saleProducts')}</p>
              <h2 className="font-display text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {t('saleProducts')}
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                {t('saleCopy')}
              </p>
            </div>
            <Link href="/products?sale=true">
              <Button variant="outline" className="w-full rounded-full border-white/80 bg-white/80 sm:w-auto">
                {tc('viewAll')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {saleGrid.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="container py-12 sm:py-16">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('latestProducts')}</p>
            <h2 className="font-display text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {t('latestProducts')}
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              {t('latestCopy')}
            </p>
          </div>
          <Link href="/products">
            <Button variant="ghost" className="w-full rounded-full sm:w-auto">
              {tc('viewAll')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {latestGrid.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container pt-6 sm:pt-8">
        <div className="overflow-hidden rounded-[2.35rem] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.24),transparent_32%),linear-gradient(135deg,#111827_0%,#1f2937_46%,#0f172a_100%)] p-8 text-white shadow-[0_32px_100px_-52px_rgba(15,23,42,0.9)] sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-200">{t('helpTitle')}</p>
              <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
                {t('helpHeadline')}
              </h2>
              <p className="text-sm leading-7 text-slate-300 sm:text-base">
                {t('helpCopy')}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href="tel:+995322052627">
                <Button size="lg" className="w-full rounded-full sm:w-auto">
                  {t('callNow')}
                </Button>
              </a>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 sm:w-auto"
                >
                  {tc('contact')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
