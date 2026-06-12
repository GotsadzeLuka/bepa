import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductFilters } from '@/components/product/ProductFilters'
import { Button } from '@/components/ui/button'
import { getCategoryName } from '@/lib/catalog'
import { storefrontService } from '@/lib/storefront'

interface Props {
  searchParams: Promise<{
    category?: string
    search?: string
    featured?: string
    sale?: string
    sort?: string
    page?: string
  }>
}

export const revalidate = 300

export default async function ProductsPage({ searchParams }: Props) {
  const t = await getTranslations('common')
  const locale = await getLocale()
  const params = await searchParams

  const [categories, { products, pagination }] = await Promise.all([
    storefrontService.getCategories(),
    storefrontService.getProducts({
      category: params.category,
      search: params.search,
      featured: params.featured === 'true',
      sale: params.sale === 'true',
      sort: params.sort as 'price-asc' | 'price-desc' | 'name' | 'newest' | undefined,
      page: params.page ? parseInt(params.page, 10) : 1,
      limit: 12,
    }),
  ])

  let pageTitle = t('products')
  let pageCopy = t('productsIntro')

  if (params.category) {
    const category = categories.find((entry) => entry.slug === params.category)
    if (category) {
      pageTitle = getCategoryName(category, locale)
      pageCopy = (locale === 'ka' ? category.descriptionKa : category.descriptionEn) ?? pageCopy
    }
  }

  if (params.search) {
    pageTitle = `${t('search')}: "${params.search}"`
    pageCopy = t('searchResultsCopy')
  }

  if (params.sale === 'true') {
    pageTitle = t('sale')
    pageCopy = t('saleResultsCopy')
  }

  if (params.featured === 'true') {
    pageTitle = t('featured')
    pageCopy = t('featuredResultsCopy')
  }

  return (
    <div className="container py-6 sm:py-8 lg:py-10">
      <section className="animate-fade-up overflow-hidden rounded-[1.75rem] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_34%),linear-gradient(135deg,#fff8ef_0%,#f7f0e7_46%,#f8f5ef_100%)] px-5 py-5 shadow-[0_28px_80px_-52px_rgba(15,23,42,0.55)] sm:px-7 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="max-w-2xl space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {pageTitle}
              </h1>
              <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm">
                <span className="font-semibold text-slate-950">{pagination.total}</span> {t('results')}
              </span>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              {pageCopy}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        <aside className="w-full lg:w-72 lg:shrink-0">
          <div className="animate-fade-up lg:sticky lg:top-36" style={{ animationDelay: '80ms' }}>
            <ProductFilters categories={categories} />
          </div>
        </aside>

        <div className="flex-1">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-up h-full"
                  style={{ animationDelay: `${Math.min(index, 8) * 70 + 120}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="animate-fade-up rounded-[2rem] border border-dashed border-slate-300 bg-white/80 px-6 py-14 text-center shadow-sm" style={{ animationDelay: '120ms' }}>
              <h2 className="font-display text-2xl font-black tracking-tight text-slate-950">
                {t('noProductsFound')}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                {t('emptyResultsCopy')}
              </p>
              <Button asChild className="mt-5 rounded-full">
                <Link href="/products">{t('clearFilters')}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
