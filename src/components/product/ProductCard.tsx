'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Check, Eye, Heart, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { addToWishlist } from '@/app/actions'
import {
  getCategoryName,
  getDisplayPrice,
  getProductDescription,
  getProductName,
  hasProductDiscount,
  type StoreProduct,
} from '@/lib/catalog'
import { getProductMedia } from '@/lib/storefront-media'
import { useCartStore } from '@/store/cart'

interface ProductCardProps {
  product: StoreProduct
}

export function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations('common')
  const locale = useLocale()
  const addItem = useCartStore((state) => state.addItem)
  const [wishlistPending, startWishlistTransition] = useTransition()
  const [justAdded, setJustAdded] = useState(false)

  const name = getProductName(product, locale)
  const categoryName = getCategoryName(product.category, locale)
  const media = getProductMedia(product)
  const imageUrl = media.src
  const hasDiscount = hasProductDiscount(product)
  const displayPrice = getDisplayPrice(product)
  const discountPercent = hasDiscount
    ? Math.round(((product.price - (product.salePrice ?? product.price)) / product.price) * 100)
    : 0

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name,
      price: displayPrice,
      image: imageUrl ?? undefined,
      quantity: 1,
    })
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1600)
    toast.success(t('addedToCart'))
  }

  const handleAddToWishlist = () => {
    startWishlistTransition(async () => {
      try {
        await addToWishlist(product.id)
        toast.success(t('addToWishlist'))
      } catch {
        toast.error('Log in to save database catalog items to your wishlist.')
      }
    })
  }

  return (
    <Card
      data-product-card
      className="group h-full overflow-hidden rounded-[2rem] border-white/70 bg-white/88 py-0 shadow-[0_20px_58px_-34px_rgba(15,23,42,0.5)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_32px_90px_-42px_rgba(15,23,42,0.58)]"
    >
      <div className="relative aspect-[0.9] overflow-hidden bg-slate-950">
        <Link href={`/product/${product.slug}`} className="absolute inset-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={media.alt || name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
              style={{ objectPosition: media.objectPosition }}
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white/30">
              <ShoppingCart className="h-14 w-14" />
            </div>
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.18)_34%,rgba(15,23,42,0.84)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.24),transparent_26%)]" />
        </Link>

        <div className="absolute left-3 top-3 flex max-w-[75%] flex-wrap gap-1.5">
          {hasDiscount && (
            <Badge className="rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white hover:bg-rose-500">
              -{discountPercent}%
            </Badge>
          )}
          {product.isFeatured && (
            <Badge className="rounded-full bg-white/88 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-900 hover:bg-white">
              {t('featured')}
            </Badge>
          )}
          {product.stock === 0 && (
            <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
              {t('outOfStock')}
            </Badge>
          )}
        </div>

        <div className="absolute right-3 top-3 flex flex-col gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <Button
            size="icon-sm"
            variant="secondary"
            className="rounded-full border border-white/25 bg-white/88 shadow-lg backdrop-blur hover:bg-white"
            aria-label={t('addToWishlist')}
            disabled={wishlistPending}
            onClick={handleAddToWishlist}
          >
            <Heart className="h-4 w-4" />
          </Button>
          <Link href={`/product/${product.slug}`}>
            <Button
              size="icon-sm"
              variant="secondary"
              className="rounded-full border border-white/25 bg-white/88 shadow-lg backdrop-blur hover:bg-white"
              aria-label={t('viewDetails')}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="absolute inset-x-4 bottom-4">
          <div className="rounded-[1.6rem] border border-white/14 bg-slate-950/32 p-4 shadow-2xl backdrop-blur-md">
            {categoryName && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70">
                {categoryName}
              </p>
            )}
            <h3 className="mt-2 line-clamp-2 text-xl font-black tracking-tight text-white">
              {name}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/72">
              {getProductDescription(product, locale)}
            </p>
          </div>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="mt-auto space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-slate-950">₾{displayPrice}</span>
              {hasDiscount && (
                <span className="text-sm text-slate-400 line-through">₾{product.price}</span>
              )}
            </div>
            <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              {product.stock > 0 ? `${product.stock} ${t('inStock')}` : t('outOfStock')}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href={`/product/${product.slug}`} className="sm:flex-1">
              <Button variant="outline" className="w-full rounded-full border-slate-200 bg-slate-50/80">
                <Eye className="h-4 w-4" />
                {t('viewDetails')}
              </Button>
            </Link>
            <Button
              className="w-full rounded-full px-4 sm:w-auto"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              data-add-to-cart
            >
              {justAdded ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
              {justAdded ? t('addedToCart') : t('addToCart')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
