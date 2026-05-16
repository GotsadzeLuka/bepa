import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductFilters } from '@/components/product/ProductFilters'
import { Button } from '@/components/ui/button'
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

export default async function ProductsPage({ searchParams }: Props) {
  const t = await getTranslations('common')
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
      pageTitle = category.nameEn
      pageCopy = category.descriptionEn ?? pageCopy
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
    <div className="container py-8 sm:py-10 lg:py-12">
      <section className="overflow-hidden rounded-[2.25rem] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_34%),linear-gradient(135deg,#fff8ef_0%,#f7f0e7_46%,#f8f5ef_100%)] p-6 shadow-[0_28px_80px_-52px_rgba(15,23,42,0.55)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('products')}</p>
            <h1 className="font-display text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              {pageTitle}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              {pageCopy}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/70 bg-white/75 px-5 py-4 text-sm text-slate-600 shadow-sm backdrop-blur-sm">
            <span className="font-semibold text-slate-950">{pagination.total}</span> {t('results')}
          </div>
        </div>
      </section>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <aside className="w-full lg:w-80 lg:shrink-0">
          <div className="lg:sticky lg:top-36">
            <ProductFilters categories={categories} />
          </div>
        </aside>

        <div className="flex-1">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 px-6 py-14 text-center shadow-sm">
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
