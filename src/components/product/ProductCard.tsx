'use client'

import Link from 'next/link'
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
import { SafeImage } from '@/components/ui/SafeImage'

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
      className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border-white/70 bg-white/92 py-0 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_80px_-40px_rgba(15,23,42,0.55)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Link href={`/product/${product.slug}`} className="absolute inset-0">
          {imageUrl ? (
            <SafeImage
              src={imageUrl}
              alt={media.alt || name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
              style={{ objectPosition: media.objectPosition }}
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-300">
              <ShoppingCart className="h-14 w-14" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
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

      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        {categoryName && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            {categoryName}
          </p>
        )}
        <Link href={`/product/${product.slug}`} className="group/title">
          <h3 className="line-clamp-2 text-lg font-black leading-snug tracking-tight text-slate-950 transition-colors group-hover/title:text-primary">
            {name}
          </h3>
        </Link>
        <p className="line-clamp-2 text-sm leading-6 text-slate-500">
          {getProductDescription(product, locale)}
        </p>

        <div className="mt-auto space-y-3 pt-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight text-slate-950">₾{displayPrice}</span>
              {hasDiscount && (
                <span className="text-sm text-slate-400 line-through">₾{product.price}</span>
              )}
            </div>
            <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              {product.stock > 0 ? `${product.stock} ${t('inStock')}` : t('outOfStock')}
            </p>
          </div>

          <Button
            className="w-full rounded-full"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            data-add-to-cart
          >
            {justAdded ? <Check className="h-4 w-4 shrink-0" /> : <ShoppingCart className="h-4 w-4 shrink-0" />}
            <span className="truncate">{justAdded ? t('addedToCart') : t('addToCart')}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
