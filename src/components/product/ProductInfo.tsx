'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Heart, Minus, Plus, ShoppingCart, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  getCategoryName,
  getDisplayPrice,
  getProductName,
  getVariantName,
  hasProductDiscount,
  type StoreProduct,
  type StoreProductVariant,
} from '@/lib/catalog'
import { useCartStore } from '@/store/cart'

interface ProductInfoProps {
  product: StoreProduct
  locale: string
  avgRating: number
  reviewCount: number
}

export function ProductInfo({ product, locale, avgRating, reviewCount }: ProductInfoProps) {
  const t = useTranslations('common')
  const tp = useTranslations('product')
  const addItem = useCartStore((state) => state.addItem)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<StoreProductVariant | null>(product.variants[0] ?? null)

  const name = getProductName(product, locale)
  const categoryName = getCategoryName(product.category, locale)
  const hasDiscount = hasProductDiscount(product)
  const basePrice = selectedVariant ? selectedVariant.price : getDisplayPrice(product)
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock
  const inStock = currentStock > 0

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name,
      variantName: selectedVariant ? getVariantName(selectedVariant, locale) : undefined,
      price: basePrice,
      quantity,
    })
    toast.success(`${t('addToCart')} ✓`)
  }

  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.55)] backdrop-blur-sm sm:p-7">
      <div className="space-y-6">
        <div className="space-y-4">
          {categoryName && (
            <Link
              href={`/products?category=${product.category?.slug}`}
              className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary"
            >
              {categoryName}
            </Link>
          )}

          <div className="space-y-3">
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {name}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              {locale === 'ka' ? product.descriptionKa : product.descriptionEn}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {reviewCount > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold">{avgRating.toFixed(1)}</span>
                <span className="text-slate-500">({reviewCount} {tp('reviews')})</span>
              </div>
            )}
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
              {inStock ? (
                <>
                  <Check className="h-4 w-4" />
                  {t('inStock')}
                </>
              ) : (
                t('outOfStock')
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50 p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-3">
            <span className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">₾{basePrice}</span>
            {hasDiscount && !selectedVariant && (
              <>
                <span className="text-lg text-slate-400 line-through sm:text-xl">₾{product.price}</span>
                <Badge className="rounded-full bg-rose-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white hover:bg-rose-500">
                  -{Math.round(((product.price - (product.salePrice ?? product.price)) / product.price) * 100)}%
                </Badge>
              </>
            )}
          </div>
          {product.sku && (
            <p className="mt-3 text-sm text-slate-500">
              {tp('sku')}: <span className="font-medium text-slate-700">{product.sku}</span>
            </p>
          )}
        </div>

        {product.variants.length > 0 && (
          <div className="space-y-3">
            <label className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              {tp('selectVariant')}
            </label>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((variant) => (
                <Button
                  key={variant.id}
                  variant={selectedVariant?.id === variant.id ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full px-4"
                  onClick={() => setSelectedVariant(variant)}
                  disabled={variant.stock === 0}
                >
                  {getVariantName(variant, locale)}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Separator />

        <div className="space-y-3">
          <label className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            {t('quantity')}
          </label>
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-full border border-slate-200 bg-white p-1">
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center text-base font-semibold text-slate-950">{quantity}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                disabled={!inStock || quantity >= currentStock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-slate-500">{inStock ? `${currentStock} ${t('inStock')}` : t('outOfStock')}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            size="lg"
            className="flex-1 rounded-full"
            onClick={handleAddToCart}
            disabled={!inStock}
          >
            <ShoppingCart className="h-5 w-5" />
            {t('addToCart')}
          </Button>
          <Button size="lg" variant="outline" className="rounded-full px-4">
            <Heart className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
