import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductImages } from '@/components/product/ProductImages'
import { ProductInfo } from '@/components/product/ProductInfo'
import { getProductDescription } from '@/lib/catalog'
import { storefrontService } from '@/lib/storefront'

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 300

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const t = await getTranslations('product')
  const locale = await getLocale()

  const product = await storefrontService.getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const [relatedProducts, reviews] = await Promise.all([
    storefrontService.getRelatedProducts(product.id, product.categoryId, 4),
    storefrontService.getProductReviews(product.id),
  ])

  const avgRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0

  return (
    <div className="container py-8 sm:py-10 lg:py-12">
      <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
        <ProductImages product={product} />

        <ProductInfo
          product={product}
          locale={locale}
          avgRating={avgRating}
          reviewCount={reviews.length}
        />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.45)] backdrop-blur-sm sm:p-8">
          <h2 className="font-display text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {t('description')}
          </h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-slate-600 sm:text-base">
            {getProductDescription(product, locale)}
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.45)] backdrop-blur-sm sm:p-8">
          <h2 className="font-display text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {t('reviews')} ({reviews.length})
          </h2>
          {reviews.length > 0 ? (
            <div className="mt-5 space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex text-base text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star}>{star <= review.rating ? '★' : '☆'}</span>
                      ))}
                    </div>
                    <span className="font-semibold text-slate-900">
                      {review.user?.fullName || 'Anonymous'}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm leading-7 text-slate-600">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-7 text-slate-500">{t('noReviews')}</p>
          )}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-12 sm:mt-14">
          <div className="mb-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('relatedProducts')}</p>
            <h2 className="font-display text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {t('relatedProducts')}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
