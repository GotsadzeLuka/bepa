import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import type { LucideIcon } from 'lucide-react'
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
import { ProductCard } from '@/components/product/ProductCard'
import { Button } from '@/components/ui/button'
import { SafeImage } from '@/components/ui/SafeImage'
import {
  getCategoryName,
  type StoreCategory,
  type StoreProduct,
} from '@/lib/catalog'
import { getCategoryMedia } from '@/lib/storefront-media'
import { storefrontService } from '@/lib/storefront'

const categoryIcons: Record<string, LucideIcon> = {
  lighting: Zap,
  batteries: BatteryCharging,
  brakes: Disc3,
  filters: Wind,
  'oils-fluids': Droplets,
  accessories: Shield,
}

type CategorySummary = {
  id: string
  href: string
  name: string
  description: string | null
  Icon: LucideIcon
  media: ReturnType<typeof getCategoryMedia>
}

type ServiceHighlight = {
  icon: LucideIcon
  title: string
  desc: string
}

export const revalidate = 300

function getCategoryDescription(category: StoreCategory, locale: string) {
  return locale === 'ka' ? category.descriptionKa : category.descriptionEn
}

function buildCategorySummaries(categories: StoreCategory[], locale: string): CategorySummary[] {
  return categories.map((category) => ({
    id: category.id,
    href: `/products?category=${category.slug}`,
    name: getCategoryName(category, locale),
    description: getCategoryDescription(category, locale),
    Icon: categoryIcons[category.slug] ?? Shield,
    media: getCategoryMedia(category),
  }))
}

function takeUniqueProducts(products: StoreProduct[], usedIds: Set<string>, limit: number) {
  const picked: StoreProduct[] = []

  for (const product of products) {
    if (usedIds.has(product.id)) continue

    picked.push(product)
    usedIds.add(product.id)

    if (picked.length === limit) break
  }

  return picked
}

function ServiceHighlightGrid({ highlights }: { highlights: ServiceHighlight[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {highlights.map(({ icon: Icon, title, desc }, index) => (
        <div
          key={title}
          className="animate-fade-up glass-panel rounded-[1.5rem] p-5"
          style={{ animationDelay: `${180 + index * 60}ms` }}
        >
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">{desc}</p>
        </div>
      ))}
    </div>
  )
}

function ServicePromiseSection({ highlights }: { highlights: ServiceHighlight[] }) {
  if (highlights.length === 0) return null

  return (
    <section className="container pb-12 sm:pb-16">
      <ServiceHighlightGrid highlights={highlights} />
    </section>
  )
}

function CategoryCard({ summary, index }: { summary: CategorySummary; index: number }) {
  const { Icon, media } = summary

  return (
    <Link
      href={summary.href}
      className="animate-fade-up group glass-panel-strong overflow-hidden rounded-[1.75rem] transition-transform duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${80 + index * 50}ms` }}
    >
      <div className="relative aspect-[1.24] overflow-hidden">
        {media.src ? (
          <SafeImage
            src={media.src}
            alt={media.alt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            style={{ objectPosition: media.objectPosition }}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-950 text-white/35">
            <Icon className="h-14 w-14" />
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04),rgba(15,23,42,0.78)_100%)]" />
        <div className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/18 bg-white/12 text-white shadow-lg backdrop-blur-md">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-xl font-black tracking-tight text-slate-950">
            {summary.name}
          </h3>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
        {summary.description && (
          <p className="mt-3 text-sm leading-7 text-slate-500">
            {summary.description}
          </p>
        )}
      </div>
    </Link>
  )
}

function CategorySection({
  categories,
  title,
  copy,
  actionLabel,
}: {
  categories: CategorySummary[]
  title: string
  copy: string
  actionLabel: string
}) {
  if (categories.length === 0) return null

  return (
    <section className="container py-12 sm:py-16">
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 className="font-display text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            {copy}
          </p>
        </div>
        <Button asChild variant="ghost" className="w-full rounded-full sm:w-auto">
          <Link href="/products">
            {actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category, index) => (
          <CategoryCard key={category.id} summary={category} index={index} />
        ))}
      </div>
    </section>
  )
}

function ProductShelf({
  title,
  copy,
  href,
  actionLabel,
  products,
  variant = 'plain',
}: {
  title: string
  copy: string
  href: string
  actionLabel: string
  products: StoreProduct[]
  variant?: 'plain' | 'promo'
}) {
  if (products.length === 0) return null

  const content = (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 className="font-display text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            {copy}
          </p>
        </div>
        <Button asChild variant={variant === 'promo' ? 'outline' : 'ghost'} className="w-full rounded-full sm:w-auto">
          <Link href={href}>
            {actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  )

  if (variant === 'promo') {
    return (
      <section className="container py-2 sm:py-4">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(248,113,113,0.16),transparent_34%),linear-gradient(135deg,#fff7f7_0%,#fff8f4_44%,#fffdfb_100%)] p-5 shadow-[0_30px_84px_-54px_rgba(239,68,68,0.36)] sm:p-7">
          {content}
        </div>
      </section>
    )
  }

  return <section className="container py-12 sm:py-16">{content}</section>
}

export default async function HomePage() {
  const locale = await getLocale()
  const t = await getTranslations('home')
  const tc = await getTranslations('common')

  const { categories, featuredProducts, saleProducts, latestProducts } = await storefrontService.getHomePageData()

  const categorySummaries = buildCategorySummaries(categories, locale)
  const usedProductIds = new Set<string>()

  const featuredGrid = takeUniqueProducts(featuredProducts, usedProductIds, 4)
  const saleGrid = takeUniqueProducts(saleProducts, usedProductIds, 4)
  const latestGrid = takeUniqueProducts(latestProducts, usedProductIds, 4)

  const serviceHighlights: ServiceHighlight[] = [
    { icon: Truck, title: t('heroStatDeliveryTitle'), desc: t('heroStatDeliveryCopy') },
    { icon: Shield, title: t('heroStatSelectionTitle'), desc: t('heroStatSelectionCopy') },
    { icon: Headphones, title: t('heroStatSupportTitle'), desc: t('heroStatSupportCopy') },
    { icon: CreditCard, title: t('secureCheckoutTitle'), desc: t('secureCheckoutCopy') },
  ]

  return (
    <div className="pb-16 sm:pb-20">
      <section className="relative overflow-hidden border-b border-white/60 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_24%),linear-gradient(180deg,#fbf7f0_0%,#f5efe6_50%,#f8f5ef_100%)]">
        <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.08),transparent_56%)]" />
        <div className="absolute left-[-12rem] top-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[-10rem] top-40 h-72 w-72 rounded-full bg-slate-900/8 blur-3xl" />

        <div className="container relative py-10 sm:py-14 lg:py-16">
          <div className="animate-fade-up max-w-4xl space-y-7">
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
              <Button asChild size="lg" className="w-full rounded-full px-7 sm:w-auto">
                <Link href="/products">
                  {t('shopNow')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full rounded-full border-white/80 bg-white/82 px-7 sm:w-auto">
                <Link href="/products?featured=true">{tc('viewAll')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <CategorySection
        categories={categorySummaries}
        title={t('browseCategories')}
        copy={t('browseCategoriesCopy')}
        actionLabel={tc('viewAll')}
      />

      <ServicePromiseSection highlights={serviceHighlights} />

      <ProductShelf
        title={t('featuredProducts')}
        copy={t('featuredCopy')}
        href="/products?featured=true"
        actionLabel={tc('viewAll')}
        products={featuredGrid}
      />

      <ProductShelf
        title={t('saleProducts')}
        copy={t('saleCopy')}
        href="/products?sale=true"
        actionLabel={tc('viewAll')}
        products={saleGrid}
        variant="promo"
      />

      <ProductShelf
        title={t('latestProducts')}
        copy={t('latestCopy')}
        href="/products"
        actionLabel={tc('viewAll')}
        products={latestGrid}
      />

      <section className="container pt-6 sm:pt-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.24),transparent_32%),linear-gradient(135deg,#111827_0%,#1f2937_46%,#0f172a_100%)] p-8 text-white shadow-[0_32px_100px_-52px_rgba(15,23,42,0.9)] sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
                {t('helpHeadline')}
              </h2>
              <p className="text-sm leading-7 text-slate-300 sm:text-base">
                {t('helpCopy')}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full rounded-full sm:w-auto">
                <a href="tel:+995322052627">{t('callNow')}</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 sm:w-auto">
                <Link href="/contact">{tc('contact')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
